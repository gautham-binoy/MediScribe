import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin import router as admin_router
from app.api.audit import router as audit_router
from app.api.auth import router as auth_router
from app.api.consultations import router as consultations_router
from app.api.health import router as health_router
from app.api.hospital import router as hospital_router
from app.api.patients import router as patients_router
from app.core.config import settings
from app.core.logging import logger
from app.db.seed import seed_database
from app.transcription.mock_transcriber import MockTranscriber


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("MediScribe AI Backend starting up...")
    try:
        seed_database()
        logger.info("Database initialized and verified.")
    except Exception as e:
        logger.error(f"Error during startup database initialization: {e}")
    yield
    logger.info("MediScribe AI Backend shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "MediScribe AI - AI-Powered Clinical Documentation & Hospital Management Copilot. "
        "Educational Healthcare AI Prototype using synthetic patient data only. "
        "AI output is strictly a clinical suggestion requiring explicit physician sign-off."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for local expo and demo convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(patients_router, prefix="/api")
app.include_router(consultations_router, prefix="/api")
app.include_router(hospital_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(health_router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "demo_mode": settings.DEMO_MODE,
        "docs": "/docs",
        "health": "/api/health",
        "ai_status": "/api/health/ai",
    }


# WebSocket for Live Simulated Audio & Streaming Transcript
@app.websocket("/ws/consultations/{consultation_id}")
async def consultation_websocket(websocket: WebSocket, consultation_id: str):
    await websocket.accept()
    logger.info(f"WebSocket connected for consultation: {consultation_id}")
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            action = msg.get("action")

            if action == "start_stream":
                scenario = msg.get("scenario", "malayalam_fever")
                mock_transcriber = MockTranscriber()
                demo_data = mock_transcriber.SCENARIOS.get(
                    scenario, mock_transcriber.SCENARIOS["malayalam_fever"]
                )
                segments = demo_data["segments"]

                await websocket.send_json(
                    {
                        "type": "stream_start",
                        "detected_language": demo_data["detected_language"],
                        "consultation_id": consultation_id,
                    }
                )

                for seg in segments:
                    await asyncio.sleep(1.2)  # Simulate real-time speech delay
                    await websocket.send_json(
                        {
                            "type": "segment",
                            "speaker": seg["speaker"],
                            "text": seg["text"],
                            "timestamp": seg["timestamp"],
                        }
                    )

                await websocket.send_json(
                    {
                        "type": "stream_complete",
                        "original_transcript": demo_data["original_transcript"],
                        "normalized_clinical_text": demo_data["normalized_clinical_text"],
                        "detected_language": demo_data["detected_language"],
                    }
                )

            elif action == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for consultation: {consultation_id}")
    except Exception as e:
        logger.warning(f"WebSocket error ({consultation_id}): {e}")
        try:
            await websocket.close()
        except Exception:
            pass
