import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Mic, Globe, Sparkles } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import type { Language } from '../types';
import heroIllustrationClean from '../assets/hero_illustration_clean.png';

const LANGS = [
  { code: 'ta', native: 'தமிழ்', label: 'Tamil' },
  { code: 'hi', native: 'हिंदी', label: 'Hindi' },
  { code: 'en', native: 'English', label: 'English' },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setLanguage, language } = useApp();

  const handleStart = () => navigate('/app');
  const handleLangSelect = async (lang: Language) => {
    await setLanguage(lang);
  };
  const handleHeaderLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
  };

  return (
    <div className="landing-page min-h-screen bg-[#f8fafa]">
      {/* Header */}
      <header className="border-b border-[#dcecef] bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-[#24566a]">AnubhavAI</span>
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-5 text-sm text-text-secondary">
              <button onClick={handleStart} className="hover:text-text-primary transition-colors">
                {t('nav.home')}
              </button>
              <button onClick={() => navigate('/app/story')} className="hover:text-text-primary transition-colors">
                {t('nav.tellStory')}
              </button>
            </nav>
            <div className="landing-header-languages" aria-label={t('landing.chooseLanguage')}>
              {LANGS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleHeaderLanguageChange(lang.code as Language)}
                  className={language === lang.code ? 'active' : ''}
                  aria-label={`Switch to ${lang.label}`}
                >
                  {lang.native}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 lg:pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-full
                            text-xs font-medium text-primary-700 mb-6">
              <Globe size={13} />
              <span>{t('landing.chooseLanguage')}</span>
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight text-[#17212b] sm:text-6xl">
              AnubhavAI
            </h1>
            <p className="mb-4 text-2xl font-semibold text-[#2f6678]">
              {t('landing.tagline')}
            </p>
            <p className="text-base text-text-secondary leading-relaxed mb-8 max-w-md">
              {t('landing.subtitle')}
            </p>

            {/* CTA */}
            <div className="mb-8 flex flex-wrap gap-3">
              <button onClick={handleStart} className="btn-primary text-base px-6 py-3">
                {t('landing.startSkills')}
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Language selector */}
            <div className="flex items-center gap-3">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLangSelect(l.code as Language)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                    ${language === l.code
                      ? 'bg-primary-700 text-white border-primary-700'
                      : 'bg-white text-text-secondary border-surface-border hover:border-primary-300 hover:text-primary-700'
                    }`}
                >
                  {l.native}
                </button>
              ))}
            </div>
          </div>

          <div className="landing-visual hidden min-h-[30rem] lg:block">
            <div className="landing-visual-card">
              <div className="absolute left-8 top-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#dcecef]">
                <Sparkles size={14} /> {t('landing.howItWorks')}
              </div>
              <img src={heroIllustrationClean} alt="A person discovering skills and opportunities" className="landing-hero-image object-contain max-h-72 w-auto mx-auto" />
              <div className="landing-visual-note">
                <p className="text-lg font-semibold text-[#17212b]">{t('landing.step1Title')}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#64748b]">{t('landing.step1Desc')}</p>
              </div>
              <div className="landing-visual-chip"><Mic size={14} /> {t('landing.cta')}</div>
              <div className="landing-visual-orbit landing-visual-orbit-one" />
              <div className="landing-visual-orbit landing-visual-orbit-two" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-t border-[#dcecef] bg-white">
        <div className="max-w-6xl mx-auto px-5 py-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-text-primary">1,00,000+</p>
              <p className="text-xs text-text-muted mt-1">{t('landing.stat1')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">500+</p>
              <p className="text-xs text-text-muted mt-1">{t('landing.stat2')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">28+</p>
              <p className="text-xs text-text-muted mt-1">{t('landing.districtsLabel')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Flow strip */}
      <section className="bg-primary-700 text-white py-5">
        <div className="max-w-4xl mx-auto px-5">
          <div className="flex items-center justify-center gap-3 flex-wrap text-sm font-medium">
            {['experience', 'skills', 'proof', 'opportunity'].map((key, i, arr) => (
              <span key={key} className="flex items-center gap-3">
                <span className="capitalize">{t(`landing.flow.${key}`)}</span>
                {i < arr.length - 1 && <ArrowRight size={14} className="text-primary-300" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border py-8">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between text-xs text-text-muted">
          <span>AnubhavAI — {t('landing.tagline')}</span>
          <span>{t('landing.footerMsg')}</span>
        </div>
      </footer>
    </div>
  );
}
