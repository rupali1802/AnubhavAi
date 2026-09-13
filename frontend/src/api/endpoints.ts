import client from './client';
import type {
  User, SkillExtractionResult, VerificationScenario,
  VerificationResult, SkillGapAnalysis, ProgressionPath,
  SkillPassport, AdminStats, Language
} from '../types';

// ── User ──────────────────────────────────────────────────────────────────────

export const createOrGetUser = async (deviceId: string, language: Language): Promise<User> => {
  const res = await client.post('/api/users/device', { device_id: deviceId, language });
  return res.data;
};

export const updateUser = async (userId: number, data: Partial<User>): Promise<User> => {
  const res = await client.patch(`/api/users/${userId}`, data);
  return res.data;
};

// ── Voice / Experience ─────────────────────────────────────────────────────────

export const saveTranscript = async (
  userId: number, text: string, language: Language
): Promise<{ experience_id: number; transcript: string }> => {
  const res = await client.post('/api/voice/transcribe', {
    user_id: userId, text, language,
  });
  return res.data;
};

// ── Skill Extraction ──────────────────────────────────────────────────────────

export const extractSkills = async (
  userId: number, text: string, language: Language
): Promise<SkillExtractionResult> => {
  const res = await client.post('/api/skills/extract', {
    user_id: userId, text, language,
  });
  return res.data;
};

export const getUserSkills = async (userId: number) => {
  const res = await client.get(`/api/users/${userId}/skills`);
  return res.data;
};

export const getUserEvidence = async (userId: number) => {
  const res = await client.get(`/api/users/${userId}/evidence`);
  return res.data;
};

// ── Verification ──────────────────────────────────────────────────────────────

export const startVerification = async (
  userId: number, skillId: number, language: Language
): Promise<VerificationScenario> => {
  const res = await client.post(`/api/skills/${skillId}/verify`, {
    user_id: userId, skill_id: skillId, language,
  });
  return res.data;
};

export const evaluateVerification = async (
  verificationId: number, userResponse: string, language: Language
): Promise<VerificationResult> => {
  const res = await client.post('/api/verification/evaluate', {
    verification_id: verificationId, user_response: userResponse, language,
  });
  return res.data;
};

// ── Skill Gap ─────────────────────────────────────────────────────────────────

export const getSkillGaps = async (userId: number, language: Language): Promise<SkillGapAnalysis> => {
  const res = await client.get(`/api/users/${userId}/skill-gaps`, { params: { language } });
  return res.data;
};

// ── Opportunities ─────────────────────────────────────────────────────────────

export const getOpportunities = async (userId: number, language: Language) => {
  const res = await client.get('/api/opportunities/recommendations', {
    params: { user_id: userId, language },
  });
  return res.data;
};

export const explainOpportunity = async (content: string, language: Language): Promise<string> => {
  const res = await client.post('/api/opportunities/explain', { content, language });
  return res.data.explanation;
};

// ── Path ──────────────────────────────────────────────────────────────────────

export const getProgressionPath = async (userId: number, language: Language): Promise<ProgressionPath> => {
  const res = await client.get(`/api/users/${userId}/path`, { params: { language } });
  return res.data;
};

// ── Passport ──────────────────────────────────────────────────────────────────

export const getSkillPassport = async (userId: number, language: Language): Promise<SkillPassport> => {
  const res = await client.get(`/api/users/${userId}/passport`, { params: { language } });
  return res.data;
};

// ── Recruiter ─────────────────────────────────────────────────────────────────

export const getRecruiterCandidates = async (language?: Language): Promise<any[]> => {
  const res = await client.get('/api/recruiter/candidates', { params: { language } });
  return res.data;
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminLogin = async (username: string, password: string): Promise<string> => {
  const res = await client.post('/api/admin/login', { username, password });
  return res.data.access_token;
};

export const getAdminStats = async (): Promise<AdminStats> => {
  const res = await client.get('/api/admin/stats');
  return res.data;
};

export const getAdminUsers = async () => {
  const res = await client.get('/api/admin/users');
  return res.data;
};

export const getAdminSkills = async () => {
  const res = await client.get('/api/admin/skills');
  return res.data;
};

export const getAdminSchemes = async () => {
  const res = await client.get('/api/admin/schemes');
  return res.data;
};

export const createScheme = async (data: object) => {
  const res = await client.post('/api/admin/schemes', data);
  return res.data;
};

export const updateScheme = async (id: number, data: object) => {
  const res = await client.put(`/api/admin/schemes/${id}`, data);
  return res.data;
};

export const deleteScheme = async (id: number) => {
  const res = await client.delete(`/api/admin/schemes/${id}`);
  return res.data;
};

export const getAdminActivity = async () => {
  const res = await client.get('/api/admin/activity');
  return res.data;
};
