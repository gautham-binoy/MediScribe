import os
import re
import threading
import time
from dataclasses import dataclass
from typing import Generator

from app.core.config import settings
from app.core.logging import logger


@dataclass
class KeyStatus:
    api_key: str
    is_active: bool = True
    cooldown_until: float = 0.0
    failure_count: int = 0
    success_count: int = 0
    last_used: float = 0.0
    error_reason: str = ""

    @property
    def masked_key(self) -> str:
        k = self.api_key.strip()
        if len(k) <= 10:
            return k[:2] + "..." + k[-2:]
        return k[:6] + "..." + k[-4:]

    @property
    def in_cooldown(self) -> bool:
        return time.time() < self.cooldown_until


class GeminiKeyManager:
    """
    Thread-safe Gemini API Key Pool with:
    - Multiple key support (load-balanced round-robin)
    - Automated failover when a key hits 429 rate limit or quota exhaustion
    - Temporary backoff cooldowns (auto-recovering after cooldown period)
    - Permanently invalid key isolation (401/403)
    - Cached google.genai.Client instances per key
    """

    _instance = None
    _singleton_lock = threading.Lock()

    def __init__(self):
        self._lock = threading.Lock()
        self._round_robin_idx = 0
        self._clients: dict[str, any] = {}
        self._keys: list[KeyStatus] = []
        self._reload_keys()

    def _reload_keys(self):
        """Read all configured Gemini keys from settings and environment."""
        raw_keys = settings.gemini_keys
        existing_map = {k.api_key: k for k in self._keys}

        new_keys: list[KeyStatus] = []
        for key in raw_keys:
            key_clean = key.strip()
            if not key_clean:
                continue
            if key_clean in existing_map:
                new_keys.append(existing_map[key_clean])
            else:
                new_keys.append(KeyStatus(api_key=key_clean))

        self._keys = new_keys
        if self._keys:
            masked_list = [k.masked_key for k in self._keys]
            logger.info(
                f"GeminiKeyManager initialized with {len(self._keys)} API key(s): {', '.join(masked_list)}"
            )
        else:
            logger.warning("GeminiKeyManager: No Gemini API keys found in configuration.")

    @property
    def total_keys(self) -> int:
        return len(self._keys)

    @property
    def has_keys(self) -> bool:
        return len(self._keys) > 0

    def _get_client_for_key(self, api_key: str):
        """Get or initialize cached genai.Client for an API key."""
        if api_key not in self._clients:
            from google import genai

            self._clients[api_key] = genai.Client(api_key=api_key)
        return self._clients[api_key]

    def get_client(self) -> tuple[any, str]:
        """
        Get the next available active client using round-robin.
        If all keys are on cooldown, returns the key that expires earliest.
        Raises RuntimeError if no keys are configured.
        """
        with self._lock:
            if not self._keys:
                self._reload_keys()
            if not self._keys:
                raise RuntimeError("No Gemini API keys are configured.")

            now = time.time()
            # 1. Filter active keys not currently in cooldown
            available = [k for k in self._keys if k.is_active and not k.in_cooldown]

            if available:
                # Round-robin selection among available keys
                selected = available[self._round_robin_idx % len(available)]
                self._round_robin_idx += 1
                selected.last_used = now
                client = self._get_client_for_key(selected.api_key)
                return client, selected.api_key

            # 2. If all active keys are on cooldown, select the one with earliest cooldown expiry
            active_keys = [k for k in self._keys if k.is_active]
            if active_keys:
                active_keys.sort(key=lambda k: k.cooldown_until)
                earliest = active_keys[0]
                wait_sec = max(0.0, earliest.cooldown_until - now)
                logger.warning(
                    f"All Gemini keys in cooldown. Using earliest key {earliest.masked_key} (cooldown expires in {wait_sec:.1f}s)."
                )
                earliest.last_used = now
                client = self._get_client_for_key(earliest.api_key)
                return client, earliest.api_key

            raise RuntimeError("All configured Gemini API keys have been deactivated due to authentication errors.")

    def get_cascade(self) -> Generator[tuple[any, str], None, None]:
        """
        Generator yielding (client, api_key) pairs across all active keys.
        Allows the caller to try key 1, and if rate-limited, immediately fall back
        to key 2, key 3, etc.
        """
        with self._lock:
            if not self._keys:
                self._reload_keys()
            candidates = [k for k in self._keys if k.is_active]
            # Order: available first (sorted by round-robin / last_used), then cooldown keys
            now = time.time()
            ready = [k for k in candidates if not k.in_cooldown]
            in_cd = [k for k in candidates if k.in_cooldown]
            in_cd.sort(key=lambda k: k.cooldown_until)

            # Rotate ready keys
            if ready:
                idx = self._round_robin_idx % len(ready)
                ready = ready[idx:] + ready[:idx]
                self._round_robin_idx += 1

            ordered_keys = [k.api_key for k in ready + in_cd]

        if not ordered_keys:
            raise RuntimeError("No active Gemini API keys are configured.")

        for key in ordered_keys:
            client = self._get_client_for_key(key)
            yield client, key

    def report_rate_limit(self, api_key: str, cooldown_seconds: float = 60.0):
        """Mark a key as rate-limited (HTTP 429) and place it on temporary cooldown."""
        with self._lock:
            for k in self._keys:
                if k.api_key == api_key:
                    k.cooldown_until = time.time() + cooldown_seconds
                    k.failure_count += 1
                    k.error_reason = "429 RateLimitExceeded"
                    remaining_available = sum(1 for x in self._keys if x.is_active and not x.in_cooldown)
                    logger.warning(
                        f"Gemini API key {k.masked_key} hit rate limit / quota. "
                        f"Cooldown set for {cooldown_seconds:.0f}s. "
                        f"{remaining_available} other active key(s) available in pool."
                    )
                    break

    def report_success(self, api_key: str):
        """Record a successful API call for the key."""
        with self._lock:
            for k in self._keys:
                if k.api_key == api_key:
                    k.success_count += 1
                    k.failure_count = 0
                    k.cooldown_until = 0.0
                    k.error_reason = ""
                    break

    def report_error(self, api_key: str, error: Exception):
        """Analyze exception and update key status accordingly."""
        err_str = str(error).lower()
        if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
            self.report_rate_limit(api_key, cooldown_seconds=60.0)
        elif "401" in err_str or "403" in err_str or "invalid_argument" in err_str or "api_key_invalid" in err_str:
            with self._lock:
                for k in self._keys:
                    if k.api_key == api_key:
                        k.is_active = False
                        k.error_reason = f"Auth error: {str(error)[:100]}"
                        logger.error(
                            f"Gemini API key {k.masked_key} deactivated due to authentication error: {error}"
                        )
                        break
        else:
            with self._lock:
                for k in self._keys:
                    if k.api_key == api_key:
                        k.failure_count += 1
                        break

    def get_pool_status(self) -> dict:
        """Return diagnostic status of the key pool."""
        with self._lock:
            now = time.time()
            return {
                "total_configured": len(self._keys),
                "active_count": sum(1 for k in self._keys if k.is_active),
                "ready_count": sum(1 for k in self._keys if k.is_active and not k.in_cooldown),
                "keys": [
                    {
                        "masked": k.masked_key,
                        "is_active": k.is_active,
                        "in_cooldown": k.in_cooldown,
                        "cooldown_remaining_sec": max(0, int(k.cooldown_until - now)) if k.in_cooldown else 0,
                        "success_count": k.success_count,
                        "failure_count": k.failure_count,
                        "error_reason": k.error_reason or None,
                    }
                    for k in self._keys
                ],
            }


_key_manager_instance: GeminiKeyManager | None = None
_init_lock = threading.Lock()


def get_gemini_key_manager() -> GeminiKeyManager:
    """Retrieve global singleton instance of GeminiKeyManager."""
    global _key_manager_instance
    if _key_manager_instance is None:
        with _init_lock:
            if _key_manager_instance is None:
                _key_manager_instance = GeminiKeyManager()
    return _key_manager_instance
