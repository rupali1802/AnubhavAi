import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SQLITE_DB_PATH = BASE_DIR / "anubhavai.db"
SQLITE_URL = f"sqlite:///{SQLITE_DB_PATH.as_posix()}"


def get_engine():
    db_url = settings.DATABASE_URL
    if getattr(settings, "USE_SQLITE", False) or db_url.startswith("sqlite"):
        return create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
    try:
        connect_args = {}
        if "mysql" in db_url:
            connect_args = {"connect_timeout": 5}
        eng = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False,
            connect_args=connect_args,
        )
        with eng.connect() as conn:
            pass
        db_type = "PostgreSQL" if "postgres" in db_url else "MySQL" if "mysql" in db_url else "Database"
        print(f"[Database] Connected to {db_type} successfully.")
        return eng
    except Exception as e:
        print(f"[Database] Primary database connection failed ({e}). Falling back to SQLite ({SQLITE_DB_PATH.name}).")
        return create_engine(SQLITE_URL, connect_args={"check_same_thread": False})


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
