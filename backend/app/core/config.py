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
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None

    JWT_SECRET_KEY: str = "mediscribe-ai-super-secret-jwt-key-for-local-demo-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    DEMO_MODE: bool = True
    RAG_ENABLED: bool = True
    TRANSCRIPTION_MODE: str = "demo"  # live, upload, demo

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
