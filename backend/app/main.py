from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import Base, engine
from app.api import users, experiences, verification, opportunities, admin

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AnubhavAI API",
    description="Multilingual voice-first skill discovery and verification platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000", "*"],
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


@app.get("/")
def root():
    return {
        "name": "AnubhavAI API",
        "version": "1.0.0",
        "tagline": "Your Experience Has Skills.",
        "demo_mode": settings.is_demo_mode,
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok", "demo_mode": settings.is_demo_mode}
