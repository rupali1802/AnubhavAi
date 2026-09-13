export type Language = 'en' | 'hi' | 'ta';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type VerificationStatus = 'demonstrated' | 'partially_demonstrated' | 'needs_improvement' | 'no_evidence' | 'pending';

export interface User {
  id: number;
  device_id: string;
  name?: string;
  district?: string;
  state?: string;
  language: Language;
  created_at: string;
}

export interface Experience {
  id: number;
  user_id: number;
  raw_text: string;
  language: Language;
  summary?: string;
  created_at: string;
}

export interface SkillEvidence {
  text: string;
  text_hi?: string;
  text_ta?: string;
  confidence: number;
}

export interface ExtractedSkill {
  id?: number;
  skill_id?: number;
  name: string;
  name_hi?: string;
  name_ta?: string;
  category: string;
  confidence: number;
  confidence_level: ConfidenceLevel;
  years_experience?: number;
  evidence: SkillEvidence[] | string;
  evidence_hi?: string;
  evidence_ta?: string;
  verified?: boolean;
  verification_status?: VerificationStatus;
}

export interface SkillExtractionResult {
  experience_id: number;
  summary: string;
  skills: ExtractedSkill[];
  clarification_needed: boolean;
  clarification_question?: string;
}

export interface VerificationScenario {
  id: number;
  skill_id: number;
  skill_name: string;
  scenario: string;
  question: string;
  language: Language;
}

export interface SHAPContribution {
  feature: string;
  value: number;
  shap_value: number;
  impact: 'positive' | 'negative';
  abs_magnitude: number;
}

export interface SHAPData {
  base_value: number;
  final_score: number;
  contributions: SHAPContribution[];
  positive_factors: SHAPContribution[];
  negative_factors: SHAPContribution[];
}

export interface VerificationResult {
  id: number;
  skill_id: number;
  skill_name: string;
  status: VerificationStatus;
  score: number;
  dimensions: Record<string, number>;
  explanation: string;
  shap_data?: SHAPData | null;
  shap_explanation?: string | null;
  language: Language;
}

export interface SkillGapItem {
  skill_name: string;
  skill_name_en: string;
  skill_name_hi: string;
  skill_name_ta: string;
  current_score: number;
  target_score: number;
}

export interface SkillGapAnalysis {
  user_id: number;
  gaps: SkillGapItem[];
}

export interface SchemeInfo {
  id: number;
  name: string;
  name_en?: string;
  name_hi?: string;
  name_ta?: string;
  category?: string;
  district?: string;
  description?: string;
  description_en?: string;
  description_hi?: string;
  description_ta?: string;
  eligibility?: string;
  eligibility_en?: string;
  eligibility_hi?: string;
  eligibility_ta?: string;
  benefits?: string;
  benefits_en?: string;
  benefits_hi?: string;
  benefits_ta?: string;
  duration?: string;
  is_demo: boolean;
  match_score: number;
  reasons?: string[];
}

export interface OpportunityMatch {
  scheme: SchemeInfo;
  match_score: number;
  reasons: string[];
}

export interface PathStep {
  step: number;
  title: string;
  title_hi?: string;
  title_ta?: string;
  description: string;
  description_hi?: string;
  description_ta?: string;
  duration: string;
  status: 'current' | 'upcoming' | 'completed';
  unlocks?: string;
  unlocks_hi?: string;
  unlocks_ta?: string;
}

export interface ProgressionPath {
  user_id: number;
  title: string;
  title_hi?: string;
  title_ta?: string;
  steps: PathStep[];
  current_step: number;
}

export interface PassportSkill {
  skill_name: string;
  skill_name_en?: string;
  skill_name_hi?: string;
  skill_name_ta?: string;
  confidence: number;
  confidence_level: ConfidenceLevel;
  verified: boolean;
  verification_status?: VerificationStatus;
  evidence?: string;
}

export interface SkillPassport {
  user_id: number;
  user_name?: string;
  district?: string;
  state?: string;
  language: Language;
  verified_skills: PassportSkill[];
  experience_summary: string;
  career_direction: string;
  career_direction_hi?: string;
  career_direction_ta?: string;
  recommended_opportunities: SchemeInfo[];
  total_skills: number;
  verified_count: number;
  generated_at: string;
}

export interface ActivityLog {
  id: number;
  activity_type: string;
  description?: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_experiences: number;
  total_skills_discovered: number;
  total_skills_verified: number;
  total_opportunities_matched: number;
}

// App state
export interface AppState {
  userId: number | null;
  deviceId: string;
  language: Language;
  currentExperienceId: number | null;
  skills: ExtractedSkill[];
  verificationResult: VerificationResult | null;
}
