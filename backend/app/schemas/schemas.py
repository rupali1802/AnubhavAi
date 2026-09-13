from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class LanguageCode(str, Enum):
    EN = "en"
    HI = "hi"
    TA = "ta"


class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class VerificationStatus(str, Enum):
    DEMONSTRATED = "demonstrated"
    PARTIALLY_DEMONSTRATED = "partially_demonstrated"
    NEEDS_IMPROVEMENT = "needs_improvement"
    NO_EVIDENCE = "no_evidence"
    PENDING = "pending"


# ── User ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    device_id: str
    language: LanguageCode = LanguageCode.EN
    district: Optional[str] = "Chennai"
    state: Optional[str] = "Tamil Nadu"
    name: Optional[str] = None


class UserUpdate(BaseModel):
    language: Optional[LanguageCode] = None
    district: Optional[str] = None
    state: Optional[str] = None
    name: Optional[str] = None


class UserOut(BaseModel):
    id: int
    device_id: str
    name: Optional[str]
    district: Optional[str]
    state: Optional[str]
    language: LanguageCode
    created_at: datetime

    class Config:
        from_attributes = True


# ── Experience ─────────────────────────────────────────────────────────────────

class ExperienceCreate(BaseModel):
    user_id: int
    raw_text: str
    language: LanguageCode = LanguageCode.EN
    audio_duration: Optional[float] = None


class ExperienceOut(BaseModel):
    id: int
    user_id: int
    raw_text: str
    language: LanguageCode
    summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Skills ────────────────────────────────────────────────────────────────────

class SkillOut(BaseModel):
    id: int
    name: str
    name_hi: Optional[str]
    name_ta: Optional[str]
    description: Optional[str]
    description_hi: Optional[str]
    description_ta: Optional[str]
    category: Optional[str] = None

    class Config:
        from_attributes = True


class SkillEvidenceOut(BaseModel):
    id: int
    evidence_text: str
    evidence_text_hi: Optional[str]
    evidence_text_ta: Optional[str]
    confidence: float
    source: str

    class Config:
        from_attributes = True


class ExperienceSkillOut(BaseModel):
    id: int
    skill: SkillOut
    confidence: float
    confidence_level: ConfidenceLevel
    years_experience: Optional[float]
    evidence: List[SkillEvidenceOut] = []

    class Config:
        from_attributes = True


# ── Skill Extraction ──────────────────────────────────────────────────────────

class ExtractedSkillItem(BaseModel):
    name: str
    name_hi: Optional[str] = None
    name_ta: Optional[str] = None
    category: str
    confidence: float
    confidence_level: ConfidenceLevel
    evidence: str
    evidence_hi: Optional[str] = None
    evidence_ta: Optional[str] = None
    years_experience: Optional[float] = None


class SkillExtractionResult(BaseModel):
    experience_id: int
    summary: str
    skills: List[ExtractedSkillItem]
    clarification_needed: bool = False
    clarification_question: Optional[str] = None


# ── Verification ──────────────────────────────────────────────────────────────

class VerificationCreate(BaseModel):
    user_id: int
    skill_id: int
    language: LanguageCode = LanguageCode.EN


class VerificationScenarioOut(BaseModel):
    id: int
    skill_id: int
    skill_name: str
    scenario: str
    question: str
    language: LanguageCode
    scenario_hi: Optional[str] = None
    question_hi: Optional[str] = None
    scenario_ta: Optional[str] = None
    question_ta: Optional[str] = None


class VerificationEvaluate(BaseModel):
    verification_id: int
    user_response: str
    language: LanguageCode = LanguageCode.EN


class VerificationResultOut(BaseModel):
    id: int
    skill_id: int
    skill_name: str
    status: VerificationStatus
    score: float
    dimensions: Dict[str, float]
    explanation: str
    shap_data: Optional[Dict[str, Any]] = None
    shap_explanation: Optional[str] = None
    language: LanguageCode

    class Config:
        from_attributes = True


# ── Skill Gap ─────────────────────────────────────────────────────────────────

class SkillGapItem(BaseModel):
    skill_id: int
    skill_name: str
    skill_name_hi: Optional[str]
    skill_name_ta: Optional[str]
    current_score: float
    target_score: float
    priority: int
    reason: Optional[str]
    reason_hi: Optional[str]
    reason_ta: Optional[str]


class SkillGapAnalysis(BaseModel):
    user_id: int
    current_skills: List[ExperienceSkillOut]
    gaps: List[SkillGapItem]
    top_gap: Optional[SkillGapItem]


# ── Schemes / Opportunities ───────────────────────────────────────────────────

class SchemeOut(BaseModel):
    id: int
    name: str
    name_hi: Optional[str]
    name_ta: Optional[str]
    category: Optional[str]
    district: Optional[str]
    description: Optional[str]
    description_hi: Optional[str]
    description_ta: Optional[str]
    eligibility: Optional[str]
    eligibility_hi: Optional[str]
    eligibility_ta: Optional[str]
    duration: Optional[str]
    benefits: Optional[str]
    benefits_hi: Optional[str]
    benefits_ta: Optional[str]
    is_demo: bool
    match_score: float = 0.0

    class Config:
        from_attributes = True


class OpportunityMatch(BaseModel):
    scheme: SchemeOut
    match_score: float
    reasons: List[str]
    reasons_hi: Optional[List[str]] = None
    reasons_ta: Optional[List[str]] = None
    missing_requirements: List[str]
    next_steps: List[str]


class OpportunityMatchList(BaseModel):
    user_id: int
    matches: List[OpportunityMatch]


# ── Progression Path ──────────────────────────────────────────────────────────

class PathStep(BaseModel):
    step: int
    title: str
    title_hi: Optional[str]
    title_ta: Optional[str]
    description: str
    description_hi: Optional[str]
    description_ta: Optional[str]
    duration: str
    status: str  # current, upcoming, completed
    unlocks: Optional[str]
    unlocks_hi: Optional[str]
    unlocks_ta: Optional[str]


class ProgressionPathOut(BaseModel):
    user_id: int
    title: str
    title_hi: Optional[str]
    title_ta: Optional[str]
    steps: List[PathStep]
    current_step: int


# ── Skill Passport ────────────────────────────────────────────────────────────

class PassportSkill(BaseModel):
    skill_name: str
    skill_name_hi: Optional[str]
    skill_name_ta: Optional[str]
    confidence: float
    confidence_level: ConfidenceLevel
    verified: bool
    verification_status: Optional[VerificationStatus]
    evidence: Optional[str]


class SkillPassportOut(BaseModel):
    user_id: int
    user_name: Optional[str]
    district: Optional[str]
    state: Optional[str]
    language: LanguageCode
    verified_skills: List[PassportSkill]
    experience_summary: str
    career_direction: str
    career_direction_hi: Optional[str]
    career_direction_ta: Optional[str]
    recommended_opportunities: List[SchemeOut]
    total_skills: int
    verified_count: int
    generated_at: datetime


# ── Admin ─────────────────────────────────────────────────────────────────────

class AdminLogin(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminStats(BaseModel):
    total_users: int
    total_experiences: int
    total_skills_discovered: int
    total_skills_verified: int
    total_opportunities_matched: int


# ── Voice ─────────────────────────────────────────────────────────────────────

class TranscribeRequest(BaseModel):
    text: str  # browser-side transcript
    language: LanguageCode = LanguageCode.EN
    user_id: int


class TranscribeResult(BaseModel):
    transcript: str
    language: LanguageCode
    detected_phrases: List[str]
    experience_id: int


# ── Activity ──────────────────────────────────────────────────────────────────

class ActivityOut(BaseModel):
    id: int
    activity_type: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
