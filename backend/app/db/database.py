from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings


def get_engine():
    if getattr(settings, "USE_SQLITE", False):
        return create_engine("sqlite:///./anubhavai.db", connect_args={"check_same_thread": False})
    try:
        eng = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False,
        )
        with eng.connect() as conn:
            pass
        print("[Database] Connected to MySQL successfully.")
        return eng
    except Exception as e:
        print(f"[Database] MySQL connection failed ({e}). Falling back to SQLite (anubhavai.db).")
        return create_engine("sqlite:///./anubhavai.db", connect_args={"check_same_thread": False})


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
