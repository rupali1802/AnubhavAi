import { useState, useEffect, createContext, useContext } from 'react';
import type { Language, User, ExtractedSkill, VerificationResult } from '../types';
import { createOrGetUser } from '../api/endpoints';
import { getOrCreateDeviceId } from '../services/voice';
import { changeLanguage, getCurrentLang } from '../i18n';

export type TextSize = 'small' | 'medium' | 'large';

interface AppContextType {
  user: User | null;
  language: Language;
  userId: number | null;
  deviceId: string;
  currentExperienceId: number | null;
  currentTranscript: string;
  skills: ExtractedSkill[];
  verificationResult: VerificationResult | null;
  textSize: TextSize;
  setLanguage: (lang: Language) => Promise<void>;
  setCurrentExperienceId: (id: number) => void;
  setCurrentTranscript: (t: string) => void;
  setSkills: (skills: ExtractedSkill[]) => void;
  setVerificationResult: (r: VerificationResult | null) => void;
  setTextSize: (size: TextSize) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};

export { AppContext };

export const useAppState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLangState] = useState<Language>((getCurrentLang() as Language) || 'en');
  const [currentExperienceId, setCurrentExperienceId] = useState<number | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [skills, setSkillsState] = useState<ExtractedSkill[]>(() => {
    try {
      const saved = localStorage.getItem('anubhavai_skills');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [verificationResult, setVerificationResultState] = useState<VerificationResult | null>(() => {
    try {
      const saved = localStorage.getItem('anubhavai_verification_result');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setSkills = (newSkills: ExtractedSkill[]) => {
    setSkillsState(newSkills);
    try {
      localStorage.setItem('anubhavai_skills', JSON.stringify(newSkills));
    } catch (_) {}
  };

  const setVerificationResult = (r: VerificationResult | null) => {
    setVerificationResultState(r);
    try {
      if (r) {
        localStorage.setItem('anubhavai_verification_result', JSON.stringify(r));
      } else {
        localStorage.removeItem('anubhavai_verification_result');
      }
    } catch (_) {}
  };
  const [textSize, setTextSizeState] = useState<TextSize>(
    (localStorage.getItem('anubhavai_text_size') as TextSize) || 'medium'
  );
  const [isLoading, setIsLoading] = useState(true);

  const deviceId = getOrCreateDeviceId();

  const applyTextSize = (size: TextSize) => {
    setTextSizeState(size);
    localStorage.setItem('anubhavai_text_size', size);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-text-size', size);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const savedLang = (localStorage.getItem('anubhavai_lang') as Language) || 'en';
        const savedTextSize = (localStorage.getItem('anubhavai_text_size') as TextSize) || 'medium';
        setLangState(savedLang);
        applyTextSize(savedTextSize);
        const u = await createOrGetUser(deviceId, savedLang);
        setUser(u);
      } catch (err) {
        console.warn('[App] Backend unavailable, running in offline mode');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLangState(lang);
    changeLanguage(lang);
    if (user) {
      try {
        const { updateUser } = await import('../api/endpoints');
        await updateUser(user.id, { language: lang });
        setUser({ ...user, language: lang });
      } catch (_) {}
    }
  };

  return {
    user,
    language,
    userId: user?.id ?? 1,
    deviceId,
    currentExperienceId,
    currentTranscript,
    skills,
    verificationResult,
    textSize,
    setLanguage,
    setCurrentExperienceId,
    setCurrentTranscript,
    setSkills,
    setVerificationResult,
    setTextSize: applyTextSize,
    isLoading,
  };
};
