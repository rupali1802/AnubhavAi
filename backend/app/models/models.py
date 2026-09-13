from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime,
    ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class LanguageCode(str, enum.Enum):
    EN = "en"
    HI = "hi"
    TA = "ta"


class ConfidenceLevel(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class VerificationStatus(str, enum.Enum):
    DEMONSTRATED = "demonstrated"
    PARTIALLY_DEMONSTRATED = "partially_demonstrated"
    NEEDS_IMPROVEMENT = "needs_improvement"
    NO_EVIDENCE = "no_evidence"
    PENDING = "pending"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    district = Column(String(255), nullable=True, default="Chennai")
    state = Column(String(255), nullable=True, default="Tamil Nadu")
    language = Column(Enum(LanguageCode), default=LanguageCode.EN, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    experiences = relationship("Experience", back_populates="user", cascade="all, delete-orphan")
    skill_verifications = relationship("SkillVerification", back_populates="user", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGap", back_populates="user", cascade="all, delete-orphan")
    user_opportunities = relationship("UserOpportunity", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")


class Experience(Base):
    __tablename__ = "experiences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    raw_text = Column(Text, nullable=False)
    language = Column(Enum(LanguageCode), nullable=False, default=LanguageCode.EN)
    summary = Column(Text, nullable=True)
    audio_duration = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="experiences")
    experience_skills = relationship("ExperienceSkill", back_populates="experience", cascade="all, delete-orphan")


class SkillCategory(Base):
    __tablename__ = "skill_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    skills = relationship("Skill", back_populates="category")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category_id = Column(Integer, ForeignKey("skill_categories.id"), nullable=True)
    description = Column(Text, nullable=True)
    name_hi = Column(String(255), nullable=True)
    name_ta = Column(String(255), nullable=True)
    description_hi = Column(Text, nullable=True)
    description_ta = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("SkillCategory", back_populates="skills")
    experience_skills = relationship("ExperienceSkill", back_populates="skill")
    skill_verifications = relationship("SkillVerification", back_populates="skill")
    skill_gaps = relationship("SkillGap", back_populates="skill")


class ExperienceSkill(Base):
    __tablename__ = "experience_skills"

    id = Column(Integer, primary_key=True, index=True)
    experience_id = Column(Integer, ForeignKey("experiences.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    confidence = Column(Float, default=0.0)
    confidence_level = Column(Enum(ConfidenceLevel), default=ConfidenceLevel.MEDIUM)
    years_experience = Column(Float, nullable=True)

    experience = relationship("Experience", back_populates="experience_skills")
    skill = relationship("Skill", back_populates="experience_skills")
    evidence = relationship("SkillEvidence", back_populates="experience_skill", cascade="all, delete-orphan")


class SkillEvidence(Base):
    __tablename__ = "skill_evidence"

    id = Column(Integer, primary_key=True, index=True)
    experience_skill_id = Column(Integer, ForeignKey("experience_skills.id"), nullable=False, index=True)
    evidence_text = Column(Text, nullable=False)
    evidence_text_hi = Column(Text, nullable=True)
    evidence_text_ta = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)
    source = Column(String(100), default="voice_transcript")

    experience_skill = relationship("ExperienceSkill", back_populates="evidence")


class SkillVerification(Base):
    __tablename__ = "skill_verifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    scenario = Column(Text, nullable=False)
    scenario_hi = Column(Text, nullable=True)
    scenario_ta = Column(Text, nullable=True)
    question = Column(Text, nullable=False)
    question_hi = Column(Text, nullable=True)
    question_ta = Column(Text, nullable=True)
    user_response = Column(Text, nullable=True)
    status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING)
    score = Column(Float, nullable=True)
    dimensions = Column(JSON, nullable=True)
    explanation = Column(Text, nullable=True)
    explanation_hi = Column(Text, nullable=True)
    explanation_ta = Column(Text, nullable=True)
    shap_data = Column(JSON, nullable=True)
    shap_explanation = Column(Text, nullable=True)
    shap_explanation_hi = Column(Text, nullable=True)
    shap_explanation_ta = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="skill_verifications")
    skill = relationship("Skill", back_populates="skill_verifications")


class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    current_score = Column(Float, default=0.0)
    target_score = Column(Float, default=100.0)
    priority = Column(Integer, default=1)
    reason = Column(Text, nullable=True)
    reason_hi = Column(Text, nullable=True)
    reason_ta = Column(Text, nullable=True)

    user = relationship("User", back_populates="skill_gaps")
    skill = relationship("Skill", back_populates="skill_gaps")


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), nullable=False)
    name_hi = Column(String(500), nullable=True)
    name_ta = Column(String(500), nullable=True)
    category = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    description_hi = Column(Text, nullable=True)
    description_ta = Column(Text, nullable=True)
    eligibility = Column(Text, nullable=True)
    eligibility_hi = Column(Text, nullable=True)
    eligibility_ta = Column(Text, nullable=True)
    duration = Column(String(100), nullable=True)
    benefits = Column(Text, nullable=True)
    benefits_hi = Column(Text, nullable=True)
    benefits_ta = Column(Text, nullable=True)
    documents = Column(Text, nullable=True)
    match_score = Column(Float, default=0.0)
    is_demo = Column(Boolean, default=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    requirements = relationship("SchemeRequirement", back_populates="scheme", cascade="all, delete-orphan")
    user_opportunities = relationship("UserOpportunity", back_populates="scheme")


class SchemeRequirement(Base):
    __tablename__ = "scheme_requirements"

    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False, index=True)
    requirement_type = Column(String(100), nullable=False)
    requirement_value = Column(String(500), nullable=False)

    scheme = relationship("Scheme", back_populates="requirements")


class TrainingProgram(Base):
    __tablename__ = "training_programs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), nullable=False)
    name_hi = Column(String(500), nullable=True)
    name_ta = Column(String(500), nullable=True)
    skill_focus = Column(String(255), nullable=True)
    duration = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    description_hi = Column(Text, nullable=True)
    description_ta = Column(Text, nullable=True)
    provider = Column(String(255), nullable=True)
    district = Column(String(100), nullable=True)
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProgressionPath(Base):
    __tablename__ = "progression_paths"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    title_hi = Column(String(500), nullable=True)
    title_ta = Column(String(500), nullable=True)
    steps = Column(JSON, nullable=True)
    current_step = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserOpportunity(Base):
    __tablename__ = "user_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False, index=True)
    match_score = Column(Float, default=0.0)
    reasons = Column(JSON, nullable=True)
    missing_requirements = Column(JSON, nullable=True)
    next_steps = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="user_opportunities")
    scheme = relationship("Scheme", back_populates="user_opportunities")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    activity_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    extra_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="activity_logs")
