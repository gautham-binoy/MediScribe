from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.ai.factory import get_ai_provider
from app.core.config import settings
from app.db.session import get_db

router = APIRouter(tags=["System Health & Diagnostics"])


@router.get("/health")
def get_health(db: Session = Depends(get_db)) -> dict[str, Any]:
    db_ok = True
    db_type = "sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if db_ok else "degraded",
        "app_name": settings.APP_NAME,
        "app_env": settings.APP_ENV,
        "database": {
            "status": "connected" if db_ok else "error",
            "type": db_type,
        },
        "demo_mode": settings.DEMO_MODE,
        "timestamp": datetime.now(UTC).isoformat(),
        "version": "1.0.0",
    }


@router.get("/health/ai")
def get_ai_health() -> dict[str, Any]:
    ai_provider = get_ai_provider()

    return {
        "active_provider": ai_provider.provider_name,
        "configured_provider": settings.AI_PROVIDER,
        "model_name": settings.AI_MODEL,
        "demo_mode": settings.DEMO_MODE,
        "rag_enabled": settings.RAG_ENABLED,
        "transcription_mode": settings.TRANSCRIPTION_MODE,
        "credentials": {
            "gemini": "Configured" if bool(settings.GEMINI_API_KEY) else "Not configured",
            "openai": "Configured" if bool(settings.OPENAI_API_KEY) else "Not configured",
            "anthropic": "Configured" if bool(settings.ANTHROPIC_API_KEY) else "Not configured",
        },
        "status": (
            "active"
            if (settings.DEMO_MODE or settings.GEMINI_API_KEY)
            else "warning_fallback_to_mock"
        ),
        "notice": "Operating with synthetic patient safety constraints. AI suggestions require explicit physician sign-off.",
    }
