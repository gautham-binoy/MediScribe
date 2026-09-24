from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.logging import logger


def get_engine():
    db_url = settings.DATABASE_URL
    connect_args = {}

    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        return create_engine(db_url, connect_args=connect_args, echo=False)

    # Try PostgreSQL connection
    try:
        engine = create_engine(db_url, pool_pre_ping=True, echo=False)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(
            f"Connected to PostgreSQL database: {db_url.split('@')[-1] if '@' in db_url else db_url}"
        )
        return engine
    except Exception as e:
        logger.warning(
            f"Could not connect to PostgreSQL ({e}). Falling back to SQLite for demo/local reliability: {settings.SQLITE_FALLBACK_URL}"
        )
        return create_engine(
            settings.SQLITE_FALLBACK_URL, connect_args={"check_same_thread": False}, echo=False
        )


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency for database session."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
