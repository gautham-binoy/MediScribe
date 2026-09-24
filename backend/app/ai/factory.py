from app.ai.base import AIProvider
from app.ai.providers.anthropic_provider import AnthropicProvider
from app.ai.providers.gemini_provider import GeminiProvider
from app.ai.providers.mock_provider import MockProvider
from app.ai.providers.openai_provider import OpenAIProvider
from app.core.config import settings
from app.core.logging import logger

_provider_instances = {}


def get_ai_provider() -> AIProvider:
    """
    Factory function to retrieve the configured AI Provider.
    If DEMO_MODE is True or no valid API key is present, returns MockProvider.
    """
    provider_type = (settings.AI_PROVIDER or "mock").lower()

    if settings.DEMO_MODE:
        if "mock" not in _provider_instances:
            _provider_instances["mock"] = MockProvider()
        return _provider_instances["mock"]

    if provider_type == "gemini":
        from app.core.gemini_keys import get_gemini_key_manager

        km = get_gemini_key_manager()
        if not km.has_keys:
            logger.warning("No Gemini API keys are configured. Falling back to MockProvider.")
            if "mock" not in _provider_instances:
                _provider_instances["mock"] = MockProvider()
            return _provider_instances["mock"]
        if "gemini" not in _provider_instances:
            _provider_instances["gemini"] = GeminiProvider()
        return _provider_instances["gemini"]

    elif provider_type == "openai":
        if "openai" not in _provider_instances:
            _provider_instances["openai"] = OpenAIProvider()
        return _provider_instances["openai"]

    elif provider_type == "anthropic":
        if "anthropic" not in _provider_instances:
            _provider_instances["anthropic"] = AnthropicProvider()
        return _provider_instances["anthropic"]

    else:
        if "mock" not in _provider_instances:
            _provider_instances["mock"] = MockProvider()
        return _provider_instances["mock"]
