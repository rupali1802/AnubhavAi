from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.db.database import get_db
from app.models.models import User, Skill, Scheme, Experience, SkillVerification, ActivityLog, SkillCategory
from app.schemas.schemas import AdminLogin, TokenOut, AdminStats
from app.core.security import verify_admin, create_access_token, decode_token

router = APIRouter(prefix="/admin", tags=["admin"])
security = HTTPBearer()


def get_current_admin(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


@router.post("/login", response_model=TokenOut)
def admin_login(data: AdminLogin):
    if not verify_admin(data.username, data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": data.username, "role": "admin"})
    return TokenOut(access_token=token)


@router.get("/stats", response_model=AdminStats)
def get_stats(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return AdminStats(
        total_users=db.query(User).count(),
        total_experiences=db.query(Experience).count(),
        total_skills_discovered=db.query(func.count(func.distinct(Skill.id))).scalar() or 0,
        total_skills_verified=db.query(SkillVerification).filter(
            SkillVerification.status == "demonstrated"
        ).count(),
        total_opportunities_matched=db.query(User).count() * 2,
    )


@router.get("/users")
def list_users(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    users = db.query(User).offset(skip).limit(limit).all()
    return [{"id": u.id, "device_id": u.device_id, "name": u.name, "district": u.district,
             "language": u.language, "created_at": u.created_at} for u in users]


@router.get("/skills")
def list_skills(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    skills = db.query(Skill).offset(skip).limit(limit).all()
    return [{"id": s.id, "name": s.name, "name_hi": s.name_hi, "name_ta": s.name_ta,
             "category": s.category.name if s.category else None} for s in skills]


@router.post("/skills")
def create_skill(data: dict, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    skill = Skill(**data)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return {"id": skill.id, "name": skill.name}


@router.put("/skills/{skill_id}")
def update_skill(skill_id: int, data: dict, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    for k, v in data.items():
        if hasattr(skill, k):
            setattr(skill, k, v)
    db.commit()
    return {"id": skill.id, "name": skill.name}


@router.delete("/skills/{skill_id}")
def delete_skill(skill_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()
    return {"message": "Deleted"}


@router.get("/schemes")
def list_schemes(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    schemes = db.query(Scheme).all()
    return [{"id": s.id, "name": s.name, "category": s.category, "district": s.district,
             "is_demo": s.is_demo, "active": s.active} for s in schemes]


@router.post("/schemes")
def create_scheme(data: dict, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    scheme = Scheme(**data)
    db.add(scheme)
    db.commit()
    db.refresh(scheme)
    return {"id": scheme.id, "name": scheme.name}


@router.put("/schemes/{scheme_id}")
def update_scheme(scheme_id: int, data: dict, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    for k, v in data.items():
        if hasattr(scheme, k):
            setattr(scheme, k, v)
    db.commit()
    return {"id": scheme.id, "name": scheme.name}


@router.delete("/schemes/{scheme_id}")
def delete_scheme(scheme_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    db.delete(scheme)
    db.commit()
    return {"message": "Deleted"}


@router.get("/activity")
def get_activity(limit: int = 50, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    return [{"id": l.id, "user_id": l.user_id, "type": l.activity_type,
             "description": l.description, "created_at": l.created_at} for l in logs]
