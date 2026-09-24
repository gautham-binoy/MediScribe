from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_NAME: str = "MediScribe AI"
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"

    DATABASE_URL: str = "sqlite:///./mediscribe.db"
    SQLITE_FALLBACK_URL: str = "sqlite:///./mediscribe.db"

    AI_PROVIDER: str = "mock"  # gemini, mock, openai, anthropic
    AI_MODEL: str = "gemini-3.1-pro-preview"
    TRANSCRIPTION_MODEL: str = "gemini-3.5-transcribe"
    GEMINI_API_KEY: str | None = None
    GEMINI_API_KEYS: str | None = None  # Comma-separated list of multiple Gemini API keys
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None

    @property
    def gemini_keys(self) -> list[str]:
        """Return all unique Gemini API keys from GEMINI_API_KEYS, GEMINI_API_KEY, or env vars."""
        import os
        import re

        keys: list[str] = []
        raw_sources = [self.GEMINI_API_KEYS, self.GEMINI_API_KEY]
        # Also check GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
        for k, v in os.environ.items():
            if re.match(r"^GEMINI_API_KEY_\d+$", k, re.IGNORECASE) and v.strip():
                raw_sources.append(v.strip())

        for src in raw_sources:
            if not src:
                continue
            for item in re.split(r"[,;\s\n]+", src):
                k = item.strip()
                if k and k not in keys:
                    keys.append(k)
        return keys

    @property
    def primary_gemini_key(self) -> str | None:
        """First available Gemini API key for single-key consumers."""
        keys = self.gemini_keys
        return keys[0] if keys else None

    JWT_SECRET_KEY: str = "mediscribe-ai-super-secret-jwt-key-for-local-demo-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    DEMO_MODE: bool = True
    RAG_ENABLED: bool = True
    TRANSCRIPTION_MODE: str = "demo"  # live, upload, demo

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
