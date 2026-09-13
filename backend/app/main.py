import os
import sys
import subprocess
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.db.database import Base, engine, SessionLocal
from app.models.models import Skill
from app.api import users, experiences, verification, opportunities, admin

# Create tables
Base.metadata.create_all(bind=engine)


def check_and_seed():
    try:
        db = SessionLocal()
        skill_count = db.query(Skill).count()
        db.close()
        if skill_count == 0:
            print("[Database] Empty database detected. Auto-seeding skills & opportunities...")
            seed_script = Path(__file__).resolve().parent.parent / "seed" / "seed.py"
            if seed_script.exists():
                subprocess.run([sys.executable, str(seed_script)], check=True)
    except Exception as e:
        print(f"[Database] Auto-seed check notice: {e}")


check_and_seed()

app = FastAPI(
    title="AnubhavAI API",
    description="Multilingual voice-first skill discovery and verification platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS: Support frontend URL, local development, and dynamic subdomains
allowed_origins = [settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(users.router, prefix="/api")
app.include_router(experiences.router, prefix="/api")
app.include_router(verification.router, prefix="/api")
app.include_router(opportunities.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "demo_mode": settings.is_demo_mode}


# Locate frontend production build if present (for single-service deployment)
BACKEND_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BACKEND_DIR.parent / "frontend" / "dist"
STATIC_DIST = BACKEND_DIR / "static"
dist_path = FRONTEND_DIST if FRONTEND_DIST.exists() else (STATIC_DIST if STATIC_DIST.exists() else None)

if dist_path and (dist_path / "index.html").exists():
    if (dist_path / "assets").exists():
        app.mount("/assets", StaticFiles(directory=dist_path / "assets"), name="assets")

    @app.get("/")
    def serve_index():
        return FileResponse(dist_path / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Exclude API, docs, openapi, and health
        if full_path.startswith("api/") or full_path in ["docs", "redoc", "openapi.json", "health"]:
            return {"detail": "Not Found"}
        target_file = dist_path / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(dist_path / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "name": "AnubhavAI API",
            "version": "1.0.0",
            "tagline": "Your Experience Has Skills.",
            "demo_mode": settings.is_demo_mode,
            "docs": "/docs",
        }

