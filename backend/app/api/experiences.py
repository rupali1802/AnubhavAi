from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import Experience, User, ExperienceSkill, Skill, SkillEvidence, SkillCategory
from app.schemas.schemas import (
    ExperienceCreate, ExperienceOut, TranscribeRequest, TranscribeResult,
    SkillExtractionResult, ExtractedSkillItem, ExperienceSkillOut, SkillOut, SkillEvidenceOut
)
from app.ai.extractor import extract_skills
from app.services.activity_service import log_activity
import re

router = APIRouter(tags=["experiences"])


@router.post("/voice/transcribe", response_model=TranscribeResult)
def transcribe_and_save(data: TranscribeRequest, db: Session = Depends(get_db)):
    """Save browser-side transcript to DB and return experience ID."""
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    exp = Experience(
        user_id=data.user_id,
        raw_text=data.text,
        language=data.language,
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    # Highlight key phrases
    words = data.text.split()
    detected = [w for w in words if len(w) > 4][:5]

    log_activity(db, data.user_id, "voice_recorded", "Voice transcript saved")
    return TranscribeResult(
        transcript=data.text,
        language=data.language,
        detected_phrases=detected,
        experience_id=exp.id,
    )


@router.post("/experiences", response_model=ExperienceOut)
def create_experience(data: ExperienceCreate, db: Session = Depends(get_db)):
    exp = Experience(**data.model_dump())
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@router.get("/experiences/{experience_id}", response_model=ExperienceOut)
def get_experience(experience_id: int, db: Session = Depends(get_db)):
    exp = db.query(Experience).filter(Experience.id == experience_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    return exp


@router.post("/skills/extract", response_model=SkillExtractionResult)
def extract_skills_from_experience(
    data: TranscribeRequest, db: Session = Depends(get_db)
):
    """Extract skills from transcript and persist to DB."""
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Always create a new Experience record for each fresh story submission
    exp = Experience(user_id=data.user_id, raw_text=data.text, language=data.language)
    db.add(exp)
    db.commit()
    db.refresh(exp)

    # Update summary
    ai_result = extract_skills(data.text, data.language)
    exp.summary = ai_result.get("summary", "")
    db.commit()

    # Persist extracted skills
    experience_skills = []
    for sk_data in ai_result.get("skills", []):
        # Find or create skill
        skill = db.query(Skill).filter(Skill.name == sk_data["name"]).first()
        if not skill:
            cat = db.query(SkillCategory).filter(SkillCategory.name == sk_data.get("category", "General")).first()
            if not cat:
                cat = SkillCategory(name=sk_data.get("category", "General"))
                db.add(cat)
                db.flush()
            skill = Skill(
                name=sk_data["name"],
                name_hi=sk_data.get("name_hi"),
                name_ta=sk_data.get("name_ta"),
                category_id=cat.id,
                description=sk_data.get("evidence"),
                description_hi=sk_data.get("evidence_hi"),
                description_ta=sk_data.get("evidence_ta"),
            )
            db.add(skill)
            db.flush()

        # Check for duplicate
        existing = db.query(ExperienceSkill).filter(
            ExperienceSkill.experience_id == exp.id,
            ExperienceSkill.skill_id == skill.id,
        ).first()
        if existing:
            exp_skill = existing
        else:
            from app.models.models import ConfidenceLevel
            cl = ConfidenceLevel(sk_data.get("confidence_level", "medium"))
            exp_skill = ExperienceSkill(
                experience_id=exp.id,
                skill_id=skill.id,
                confidence=sk_data.get("confidence", 0.5),
                confidence_level=cl,
                years_experience=sk_data.get("years_experience"),
            )
            db.add(exp_skill)
            db.flush()

            # Evidence
            ev = SkillEvidence(
                experience_skill_id=exp_skill.id,
                evidence_text=sk_data.get("evidence", ""),
                evidence_text_hi=sk_data.get("evidence_hi"),
                evidence_text_ta=sk_data.get("evidence_ta"),
                confidence=sk_data.get("confidence", 0.5),
            )
            db.add(ev)

        experience_skills.append(ExtractedSkillItem(
            name=sk_data["name"],
            name_hi=sk_data.get("name_hi"),
            name_ta=sk_data.get("name_ta"),
            category=sk_data.get("category", "General"),
            confidence=sk_data.get("confidence", 0.5),
            confidence_level=sk_data.get("confidence_level", "medium"),
            evidence=sk_data.get("evidence", ""),
            evidence_hi=sk_data.get("evidence_hi"),
            evidence_ta=sk_data.get("evidence_ta"),
            years_experience=sk_data.get("years_experience"),
        ))

    db.commit()
    log_activity(db, data.user_id, "skills_extracted", f"{len(experience_skills)} skills extracted")

    return SkillExtractionResult(
        experience_id=exp.id,
        summary=ai_result.get("summary", ""),
        skills=experience_skills,
        clarification_needed=ai_result.get("clarification_needed", False),
        clarification_question=ai_result.get("clarification_question"),
    )


@router.get("/users/{user_id}/skills")
def get_user_skills(user_id: int, db: Session = Depends(get_db)):
    """Get all skills extracted for a user (latest story skills first)."""
    experiences = (
        db.query(Experience)
        .filter(Experience.user_id == user_id)
        .order_by(Experience.created_at.desc())
        .all()
    )
    all_skills = []
    seen_skill_ids = set()
    for exp in experiences:
        for es in exp.experience_skills:
            if es.skill_id not in seen_skill_ids:
                seen_skill_ids.add(es.skill_id)
                cat_name = es.skill.category.name if es.skill.category else "General"
                all_skills.append({
                    "id": es.id,
                    "skill_id": es.skill_id,
                    "name": es.skill.name,
                    "name_hi": es.skill.name_hi,
                    "name_ta": es.skill.name_ta,
                    "category": cat_name,
                    "confidence": es.confidence,
                    "confidence_level": es.confidence_level,
                    "years_experience": es.years_experience,
                    "evidence": [
                        {
                            "text": ev.evidence_text,
                            "text_hi": ev.evidence_text_hi,
                            "text_ta": ev.evidence_text_ta,
                            "confidence": ev.confidence,
                        }
                        for ev in es.evidence
                    ],
                })
    return {"user_id": user_id, "skills": all_skills}


@router.get("/users/{user_id}/evidence")
def get_user_evidence(user_id: int, db: Session = Depends(get_db)):
    """Get all evidence for a user's skills."""
    experiences = db.query(Experience).filter(Experience.user_id == user_id).all()
    evidence_list = []
    for exp in experiences:
        for es in exp.experience_skills:
            for ev in es.evidence:
                evidence_list.append({
                    "skill_name": es.skill.name,
                    "evidence_text": ev.evidence_text,
                    "evidence_text_hi": ev.evidence_text_hi,
                    "evidence_text_ta": ev.evidence_text_ta,
                    "confidence": ev.confidence,
                })
    return {"user_id": user_id, "evidence": evidence_list}
