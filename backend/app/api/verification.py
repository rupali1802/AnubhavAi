from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import (
    User, Skill, SkillVerification, VerificationStatus,
    Experience, ExperienceSkill, SkillGap, SkillCategory
)
from app.schemas.schemas import (
    VerificationCreate, VerificationScenarioOut, VerificationEvaluate,
    VerificationResultOut, SkillGapAnalysis, SkillGapItem
)
from app.ai.extractor import (
    generate_verification_scenario, evaluate_verification_response,
    calculate_skill_gap
)
from app.services.activity_service import log_activity
from app.ai.demo_data import DEMO_SKILL_GAPS

router = APIRouter(tags=["verification"])


@router.post("/skills/{skill_id}/verify", response_model=VerificationScenarioOut)
def create_verification(skill_id: int, data: VerificationCreate, db: Session = Depends(get_db)):
    """Generate verification scenario for a skill."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    scenario_data = generate_verification_scenario(skill.name, data.language)

    verification = SkillVerification(
        user_id=data.user_id,
        skill_id=skill_id,
        scenario=scenario_data["scenario"],
        scenario_hi=scenario_data.get("scenario_hi"),
        scenario_ta=scenario_data.get("scenario_ta"),
        question=scenario_data["question"],
        question_hi=scenario_data.get("question_hi"),
        question_ta=scenario_data.get("question_ta"),
        status=VerificationStatus.PENDING,
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)

    log_activity(db, data.user_id, "verification_started", f"Verification for {skill.name}")

    lang = data.language
    scenario_text = scenario_data.get(f"scenario_{lang}") or scenario_data["scenario"]
    question_text = scenario_data.get(f"question_{lang}") or scenario_data["question"]

    return VerificationScenarioOut(
        id=verification.id,
        skill_id=skill_id,
        skill_name=skill.name,
        scenario=scenario_text,
        question=question_text,
        language=lang,
        scenario_hi=scenario_data.get("scenario_hi"),
        question_hi=scenario_data.get("question_hi"),
        scenario_ta=scenario_data.get("scenario_ta"),
        question_ta=scenario_data.get("question_ta"),
    )


@router.post("/verification/evaluate", response_model=VerificationResultOut)
def evaluate_verification(data: VerificationEvaluate, db: Session = Depends(get_db)):
    """Evaluate user's response to verification challenge."""
    verification = db.query(SkillVerification).filter(SkillVerification.id == data.verification_id).first()
    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found")

    skill = db.query(Skill).filter(Skill.id == verification.skill_id).first()
    result = evaluate_verification_response(
        skill.name,
        verification.scenario,
        data.user_response,
        data.language,
    )

    verification.user_response = data.user_response
    verification.status = VerificationStatus(result["status"])
    verification.score = result["score"]
    verification.dimensions = result["dimensions"]
    verification.explanation = result["explanation"]
    verification.explanation_hi = result.get("explanation_hi")
    verification.explanation_ta = result.get("explanation_ta")
    verification.shap_data = result.get("shap_data")
    verification.shap_explanation = result.get("shap_explanation")
    verification.shap_explanation_hi = result.get("shap_explanation_hi")
    verification.shap_explanation_ta = result.get("shap_explanation_ta")
    db.commit()

    lang = data.language
    explanation = result.get(f"explanation_{lang}") or result["explanation"]
    shap_exp = result.get(f"shap_explanation_{lang}") or result.get("shap_explanation")
    log_activity(db, verification.user_id, "verification_completed", f"Score: {result['score']}")

    return VerificationResultOut(
        id=verification.id,
        skill_id=verification.skill_id,
        skill_name=skill.name,
        status=verification.status,
        score=result["score"],
        dimensions=result["dimensions"],
        explanation=explanation,
        shap_data=result.get("shap_data"),
        shap_explanation=shap_exp,
        language=lang,
    )


@router.get("/users/{user_id}/skill-gaps")
def get_skill_gaps(user_id: int, language: str = "en", db: Session = Depends(get_db)):
    """Get skill gap analysis for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get current skills
    skills_data = []
    experiences = db.query(Experience).filter(Experience.user_id == user_id).all()
    for exp in experiences:
        for es in exp.experience_skills:
            skills_data.append({
                "name": es.skill.name,
                "confidence": es.confidence,
                "category": es.skill.category.name if es.skill.category else "General",
            })

    gaps = calculate_skill_gap(skills_data, language)

    # Persist gaps to DB
    for gap in gaps:
        lang_name = gap["skill_name"].get(language, gap["skill_name"]["en"])
        skill = db.query(Skill).filter(Skill.name == lang_name).first()
        if not skill:
            skill = db.query(Skill).filter(Skill.name == gap["skill_name"]["en"]).first()
        if skill:
            existing_gap = db.query(SkillGap).filter(
                SkillGap.user_id == user_id, SkillGap.skill_id == skill.id
            ).first()
            if not existing_gap:
                sg = SkillGap(
                    user_id=user_id,
                    skill_id=skill.id,
                    current_score=gap["current_score"],
                    target_score=gap["target_score"],
                )
                db.add(sg)
    db.commit()

    return {
        "user_id": user_id,
        "gaps": [
            {
                "skill_name": g["skill_name"].get(language, g["skill_name"]["en"]),
                "skill_name_en": g["skill_name"]["en"],
                "skill_name_hi": g["skill_name"]["hi"],
                "skill_name_ta": g["skill_name"]["ta"],
                "current_score": g["current_score"],
                "target_score": g["target_score"],
            }
            for g in gaps
        ],
    }
