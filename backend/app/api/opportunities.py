from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User, Scheme, Experience, ExperienceSkill, ProgressionPath, UserOpportunity
from app.ai.extractor import match_opportunities, generate_progression_path, generate_spoken_explanation
from app.services.activity_service import log_activity
from app.ai.demo_data import DEMO_SCHEMES, DEMO_PROGRESSION_STEPS

router = APIRouter(tags=["opportunities"])


@router.get("/opportunities/recommendations")
def get_recommendations(user_id: int, language: str = "en", db: Session = Depends(get_db)):
    """Get opportunity recommendations for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get user skills
    skills_data = []
    for exp in user.experiences:
        for es in exp.experience_skills:
            skills_data.append({"name": es.skill.name, "confidence": es.confidence})

    # Try DB schemes first
    db_schemes = db.query(Scheme).filter(Scheme.active == True).all()
    if db_schemes:
        result = []
        for scheme in db_schemes:
            match_score = scheme.match_score or 85.0
            name = getattr(scheme, f"name_{language}", None) or scheme.name
            desc = getattr(scheme, f"description_{language}", None) or scheme.description
            elig = getattr(scheme, f"eligibility_{language}", None) or scheme.eligibility
            ben = getattr(scheme, f"benefits_{language}", None) or scheme.benefits

            reasons = _get_match_reasons(skills_data, scheme, language)
            result.append({
                "scheme": {
                    "id": scheme.id,
                    "name": name,
                    "name_en": scheme.name,
                    "name_hi": scheme.name_hi,
                    "name_ta": scheme.name_ta,
                    "category": scheme.category,
                    "district": scheme.district,
                    "description": desc,
                    "description_en": scheme.description,
                    "description_hi": scheme.description_hi,
                    "description_ta": scheme.description_ta,
                    "eligibility": elig,
                    "eligibility_en": scheme.eligibility,
                    "eligibility_hi": scheme.eligibility_hi,
                    "eligibility_ta": scheme.eligibility_ta,
                    "benefits": ben,
                    "benefits_en": scheme.benefits,
                    "benefits_hi": scheme.benefits_hi,
                    "benefits_ta": scheme.benefits_ta,
                    "duration": scheme.duration,
                    "is_demo": scheme.is_demo,
                    "match_score": match_score,
                },
                "match_score": match_score,
                "reasons": reasons,
            })
        log_activity(db, user_id, "opportunities_matched", f"{len(result)} matches found")
        return {"user_id": user_id, "matches": result}

    # Fallback to demo data
    demo_result = []
    for idx, s in enumerate(DEMO_SCHEMES, start=1):
        lang_name = s.get(f"name_{language}") or s["name"] if language != "en" else s["name"]
        lang_desc = s.get(f"description_{language}") or s["description"] if language != "en" else s["description"]
        lang_elig = s.get(f"eligibility_{language}") or s["eligibility"] if language != "en" else s["eligibility"]
        lang_ben = s.get(f"benefits_{language}") or s["benefits"] if language != "en" else s["benefits"]

        reasons = _get_demo_reasons(language)
        demo_result.append({
            "scheme": {
                "id": idx,
                "name": lang_name,
                "name_en": s["name"],
                "name_hi": s.get("name_hi"),
                "name_ta": s.get("name_ta"),
                "category": s["category"],
                "district": s["district"],
                "description": lang_desc,
                "description_en": s["description"],
                "description_hi": s.get("description_hi"),
                "description_ta": s.get("description_ta"),
                "eligibility": lang_elig,
                "eligibility_en": s["eligibility"],
                "eligibility_hi": s.get("eligibility_hi"),
                "eligibility_ta": s.get("eligibility_ta"),
                "benefits": lang_ben,
                "benefits_en": s["benefits"],
                "benefits_hi": s.get("benefits_hi"),
                "benefits_ta": s.get("benefits_ta"),
                "duration": s["duration"],
                "is_demo": True,
                "match_score": s["match_score"],
            },
            "match_score": s["match_score"],
            "reasons": reasons,
        })
    return {"user_id": user_id, "matches": demo_result}


def _get_match_reasons(skills_data, scheme, language: str):
    reasons = {
        "en": [
            "Your food production experience matches this scheme's focus area.",
            "Located in your district — local support available.",
            "Skill Training and Business Development included.",
        ],
        "hi": [
            "आपका खाद्य उत्पादन अनुभव इस योजना के फोकस क्षेत्र से मेल खाता है।",
            "आपके जिले में स्थित — स्थानीय सहायता उपलब्ध।",
            "कौशल प्रशिक्षण और व्यवसाय विकास शामिल।",
        ],
        "ta": [
            "உங்கள் உணவு உற்பத்தி அனுபவம் இந்த திட்டத்தின் கவனப் பகுதியுடன் பொருந்துகிறது.",
            "உங்கள் மாவட்டத்தில் உள்ளது — உள்ளூர் ஆதரவு கிடைக்கிறது.",
            "திறன் பயிற்சி மற்றும் வணிக வளர்ச்சி சேர்க்கப்பட்டுள்ளது.",
        ],
    }
    return reasons.get(language, reasons["en"])


def _get_demo_reasons(language: str):
    return _get_match_reasons([], None, language)


@router.get("/users/{user_id}/path")
def get_progression_path(user_id: int, language: str = "en", db: Session = Depends(get_db)):
    """Get scheme progression path for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    steps_data = DEMO_PROGRESSION_STEPS.get(language, DEMO_PROGRESSION_STEPS["en"])
    titles = {
        "en": "Your Growth Journey",
        "hi": "आपकी विकास यात्रा",
        "ta": "உங்கள் வளர்ச்சி பயணம்",
    }
    return {
        "user_id": user_id,
        "title": titles.get(language, titles["en"]),
        "title_hi": titles["hi"],
        "title_ta": titles["ta"],
        "steps": steps_data,
        "current_step": 0,
    }


@router.get("/users/{user_id}/passport")
def get_skill_passport(user_id: int, language: str = "en", db: Session = Depends(get_db)):
    """Get the user's skill passport."""
    from datetime import datetime
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Collect verified skills
    verified_skills = []
    seen = set()
    for exp in user.experiences:
        for es in exp.experience_skills:
            if es.skill_id not in seen:
                seen.add(es.skill_id)
                skill_name = es.skill.name
                if language == "hi" and es.skill.name_hi:
                    skill_name = es.skill.name_hi
                elif language == "ta" and es.skill.name_ta:
                    skill_name = es.skill.name_ta

                # Check verification
                verif = db.query(SkillVerification).filter(
                    SkillVerification.user_id == user_id,
                    SkillVerification.skill_id == es.skill_id,
                ).first() if hasattr(db.query(SkillVerification), 'filter') else None

                verified_skills.append({
                    "skill_name": skill_name,
                    "skill_name_en": es.skill.name,
                    "skill_name_hi": es.skill.name_hi,
                    "skill_name_ta": es.skill.name_ta,
                    "confidence": es.confidence,
                    "confidence_level": es.confidence_level,
                    "verified": verif is not None and verif.status == "demonstrated" if verif else False,
                    "verification_status": verif.status if verif else None,
                    "evidence": es.evidence[0].evidence_text if es.evidence else None,
                })

    career_direction = {
        "en": "Food & Beverages Sector — Small Business Growth",
        "hi": "खाद्य और पेय क्षेत्र — लघु व्यवसाय विकास",
        "ta": "உணவு மற்றும் பானங்கள் துறை — சிறு வணிக வளர்ச்சி",
    }

    summary = (user.experiences[0].summary if user.experiences else "") or (
        "Experienced in food production, sales, and small business management." if language == "en"
        else "खाद्य उत्पादन, बिक्री और लघु व्यवसाय प्रबंधन में अनुभवी।" if language == "hi"
        else "உணவு உற்பத்தி, விற்பனை மற்றும் சிறு வணிக நிர்வாகத்தில் அனுபவம்."
    )

    return {
        "user_id": user_id,
        "user_name": user.name or ("User" if language == "en" else "उपयोगकर्ता" if language == "hi" else "பயனர்"),
        "district": user.district,
        "state": user.state,
        "language": user.language,
        "verified_skills": verified_skills if verified_skills else _demo_passport_skills(language),
        "experience_summary": summary,
        "career_direction": career_direction.get(language, career_direction["en"]),
        "career_direction_hi": career_direction["hi"],
        "career_direction_ta": career_direction["ta"],
        "total_skills": len(verified_skills) if verified_skills else 6,
        "verified_count": sum(1 for s in verified_skills if s.get("verified")) if verified_skills else 1,
        "generated_at": datetime.utcnow().isoformat(),
    }


def _demo_passport_skills(language: str):
    from app.ai.demo_data import DEMO_SKILLS
    result = []
    for s in DEMO_SKILLS:
        name = s.get(f"name_{language}") or s["name"] if language != "en" else s["name"]
        result.append({
            "skill_name": name,
            "skill_name_en": s["name"],
            "skill_name_hi": s["name_hi"],
            "skill_name_ta": s["name_ta"],
            "confidence": s["confidence"],
            "confidence_level": s["confidence_level"],
            "verified": s["name"] == "Customer Handling",
            "verification_status": "demonstrated" if s["name"] == "Customer Handling" else None,
            "evidence": s["evidence"].get(language, s["evidence"]["en"]),
        })
    return result


@router.post("/opportunities/explain")
def explain_opportunity(data: dict, db: Session = Depends(get_db)):
    """Generate spoken explanation for an opportunity."""
    language = data.get("language", "en")
    content = data.get("content", "")
    explanation = generate_spoken_explanation(content, language)
    return {"explanation": explanation, "language": language}


@router.get("/recruiter/candidates")
def get_recruiter_candidates(language: str = "en", db: Session = Depends(get_db)):
    """Get all candidates for the recruiter talent portal, including any verified users who have earned their skill passport."""
    from app.models.models import SkillVerification, VerificationStatus, User

    candidates = []

    # 1. Query registered users with verified skills in the DB
    try:
        users = db.query(User).all()
        for u in users:
            verifs = db.query(SkillVerification).filter(
                SkillVerification.user_id == u.id,
                SkillVerification.status.in_([
                    VerificationStatus.DEMONSTRATED,
                    "demonstrated",
                    VerificationStatus.PARTIALLY_DEMONSTRATED,
                    "partially_demonstrated"
                ])
            ).all()

            if verifs:
                scores = [v.score for v in verifs if v.score]
                avg_score = int(sum(scores) / len(scores)) if scores else 95

                primary_verif = verifs[0] if verifs else None
                primary_skill_name = primary_verif.skill.name if primary_verif and primary_verif.skill else "Vocational Specialist"
                primary_skill_hi = getattr(primary_verif.skill, "name_hi", primary_skill_name) if primary_verif and primary_verif.skill else primary_skill_name
                primary_skill_ta = getattr(primary_verif.skill, "name_ta", primary_skill_name) if primary_verif and primary_verif.skill else primary_skill_name

                cat_name = primary_verif.skill.category.name if primary_verif and primary_verif.skill and primary_verif.skill.category else "Food Production"

                skill_list = []
                seen_skills = set()
                for v in verifs:
                    if v.skill and v.skill.name not in seen_skills:
                        seen_skills.add(v.skill.name)
                        skill_list.append({
                            "name": v.skill.name,
                            "score": int(v.score) if v.score else 92
                        })
                if not skill_list:
                    skill_list = [{"name": primary_skill_name, "score": avg_score}]

                summary = u.experiences[0].summary if u.experiences and u.experiences[0].summary else f"Verified candidate with demonstrated expertise in {primary_skill_name}."
                voice_bio = summary

                candidates.append({
                    "id": f"user-{u.id}",
                    "user_id": u.id,
                    "name": u.name or f"Candidate #{u.id}",
                    "district": u.district or "Chennai",
                    "state": u.state or "Tamil Nadu",
                    "category": cat_name,
                    "verified_score": avg_score,
                    "primary_skill": primary_skill_name,
                    "primary_skill_hi": primary_skill_hi,
                    "primary_skill_ta": primary_skill_ta,
                    "experience_years": 3,
                    "phone": "+91 94440 98765",
                    "verified_badge": True,
                    "has_passport": True,
                    "passport_id": f"ANUBHAV-SKILL-PASS-{u.id:04d}",
                    "is_registered_user": True,
                    "skills": skill_list,
                    "summary": summary,
                    "summary_hi": summary,
                    "summary_ta": summary,
                    "voice_bio": voice_bio,
                    "voice_bio_hi": voice_bio,
                    "voice_bio_ta": voice_bio,
                })
    except Exception as e:
        print(f"[Recruiter] Error fetching DB users: {e}")

    # 2. Benchmark MSME candidates
    benchmark_candidates = [
        {
            "id": 1,
            "name": "Kavitha M.",
            "district": "Chennai",
            "state": "Tamil Nadu",
            "category": "Baking & Confectionery",
            "verified_score": 96,
            "primary_skill": "Baking & Cake Decoration",
            "primary_skill_hi": "बेकिंग और केक सजावट",
            "primary_skill_ta": "பேக்கிங் மற்றும் கேக் அலங்காரம்",
            "experience_years": 4,
            "phone": "+91 98765 43210",
            "verified_badge": True,
            "has_passport": True,
            "passport_id": "ANUBHAV-SKILL-PASS-1001",
            "skills": [
                {"name": "Baking & Cake Decoration", "score": 96},
                {"name": "Commercial Oven Operations", "score": 92},
                {"name": "Customer Sales", "score": 85},
            ],
            "summary": "4 years home bakery operation, custom birthday cake decoration, and confectionery baking.",
            "summary_hi": "गृह बेकरी संचालन, कस्टम केक सजावट और पेस्ट्री बेकिंग में 4 साल का अनुभव।",
            "summary_ta": "4 ஆண்டுகள் கேக் பேக்கிங், அலங்காரம் மற்றும் பேக்கரி தயாரிப்புகள் செய்யும் அனுபவம்.",
            "voice_bio": "I bake custom birthday cakes, pastries, muffins, and operate commercial baking ovens safely.",
            "voice_bio_hi": "मैं कस्टम बर्थडे केक, पेस्ट्री, मफिन बेक करती हूँ और ओवन तापमान संभालती हूँ।",
            "voice_bio_ta": "நான் பிறந்தநாள் கேக்குகள், பேஸ்ட்ரிகள் தயாரித்து வர்த்தக ஓவன் மேலாண்மை செய்கிறேன்.",
        },
        {
            "id": 2,
            "name": "Meena R.",
            "district": "Chennai",
            "state": "Tamil Nadu",
            "category": "Textile & Apparel",
            "verified_score": 95,
            "primary_skill": "Tailoring & Garment Stitching",
            "primary_skill_hi": "सिलाई और वस्त्र निर्माण",
            "primary_skill_ta": "தையல் மற்றும் ஆடை தயாரிப்பு",
            "experience_years": 6,
            "phone": "+91 98123 45678",
            "verified_badge": True,
            "has_passport": True,
            "passport_id": "ANUBHAV-SKILL-PASS-1002",
            "skills": [
                {"name": "Tailoring & Garment Construction", "score": 95},
                {"name": "Aari & Zardozi Embroidery", "score": 90},
                {"name": "Fabric Pattern Cutting", "score": 88},
            ],
            "summary": "6 years boutique tailoring, custom blouse designing, and Aari embroidery expertise.",
            "summary_hi": "बुटीक सिलाई, ब्लाउज डिजाइनिंग और आरी कढ़ाई में 6 साल का अनुभव।",
            "summary_ta": "6 ஆண்டுகள் பிளவுஸ் டிசைனிங், துணி வெட்டுதல் மற்றும் ஆரி எம்பிராய்டரி அனுபவம்.",
            "voice_bio": "6 years experience stitching bridal blouses, salwar suits, pattern cutting, and decorative Aari embroidery.",
            "voice_bio_hi": "6 साल से ब्राइडल ब्लाउज, सलवार सूट, कटाई और आरी कढ़ाई का काम कर रही हूँ।",
            "voice_bio_ta": "6 வருடங்களாக பிளவுஸ் தையல், ஆடை வெட்டுதல் மற்றும் ஆரி வேலை செய்கிறேன்.",
        },
        {
            "id": 3,
            "name": "Lakshmi S.",
            "district": "Coimbatore",
            "state": "Tamil Nadu",
            "category": "Personal Care & Beauty",
            "verified_score": 94,
            "primary_skill": "Bridal Makeup & Beautician",
            "primary_skill_hi": "ब्राइडल मेकअप व सौंदर्य सेवाएं",
            "primary_skill_ta": "மணப்பெண் மேக்கப் மற்றும் ஒப்பனை",
            "experience_years": 5,
            "phone": "+91 97890 12345",
            "verified_badge": True,
            "has_passport": True,
            "passport_id": "ANUBHAV-SKILL-PASS-1003",
            "skills": [
                {"name": "Bridal & Event Makeup Artistry", "score": 94},
                {"name": "Skin Care & Hair Styling", "score": 90},
                {"name": "Threading & Mehendi", "score": 86},
            ],
            "summary": "5 years operating a beauty parlour, bridal makeover, skin facials, and hair styling.",
            "summary_hi": "ब्यूटी पार्लर संचालन, ब्राइडल मेकओवर, फेशियल और हेयर स्टाइलिंग में 5 साल का अनुभव।",
            "summary_ta": "5 ஆண்டுகள் அழகு நிலையம், மணப்பெண் மேக்கப், ஃபேஷியல் மற்றும் முடி அலங்கார அனுபவம்.",
            "voice_bio": "I provide professional bridal makeup, skincare prep, threading, facials, and festive hair styling.",
            "voice_bio_hi": "मैं ब्राइडल मेकअप, फेशियल, थ्रेडिंग और हेयर स्टाइलिंग पेशेवर तरीके से करती हूँ।",
            "voice_bio_ta": "நான் மணப்பெண் ஒப்பனை, சரும பராமரிப்பு மற்றும் முடி அலங்காரம் செய்கிறேன்.",
        },
        {
            "id": 4,
            "name": "Karthik N.",
            "district": "Madurai",
            "state": "Tamil Nadu",
            "category": "Electrical & Electronics",
            "verified_score": 93,
            "primary_skill": "Domestic Electrical Wiring",
            "primary_skill_hi": "घरेलू बिजली वायरिंग व मरम्मत",
            "primary_skill_ta": "மின்சார வயரிங் மற்றும் பழுது நீக்கம்",
            "experience_years": 5,
            "phone": "+91 96543 21098",
            "verified_badge": True,
            "has_passport": True,
            "passport_id": "ANUBHAV-SKILL-PASS-1004",
            "skills": [
                {"name": "Domestic Electrical Wiring", "score": 93},
                {"name": "Appliance Repair", "score": 86},
                {"name": "Switchboard & Motor Fit", "score": 82},
            ],
            "summary": "5 years house electrical wiring, ceiling fan fitting, and appliance troubleshooting.",
            "summary_hi": "घरेलू वायरिंग, पंखे लगाने और बिजली उपकरण सुधार में 5 साल का अनुभव।",
            "summary_ta": "5 ஆண்டுகள் வீட்டு வயரிங், சுவிட்ச்போர்டு மற்றும் மோட்டார் பழுது நீக்கும் அனுபவம்.",
            "voice_bio": "5 years installing domestic wiring circuits, main switchboards, ceiling fans, and motor diagnostics.",
            "voice_bio_hi": "5 वर्षों से घरेलू वायरिंग, स्विचबोर्ड और बिजली उपकरण मरम्मत का काम कर रहा हूँ।",
            "voice_bio_ta": "5 ஆண்டுகளாக வீட்டு மின்சார வயரிங் மற்றும் சாதனங்கள் பழுதுபார்த்தல் செய்து வருகிறேன்.",
        },
    ]

    return candidates + benchmark_candidates


# Import here to avoid circular
from app.models.models import SkillVerification

