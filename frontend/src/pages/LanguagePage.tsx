import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import type { Language } from '../types';

const LANGUAGES = [
  {
    code: 'ta',
    name: 'தமிழ்',
    descKey: 'language.tamil_desc',
  },
  {
    code: 'hi',
    name: 'हिंदी',
    descKey: 'language.hindi_desc',
  },
  {
    code: 'en',
    name: 'English',
    descKey: 'language.english_desc',
  },
];

export default function LanguagePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, setLanguage } = useApp();

  const handleSelect = async (lang: Language) => {
    await setLanguage(lang);
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-surface-border">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            {t('common.back')}
          </button>
          <span className="text-base font-bold text-primary-700 ml-auto">AnubhavAI</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-xl">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {t('language.select')}
            </h1>
            <p className="text-text-secondary text-sm">{t('language.subtitle')}</p>
          </div>

          {/* Language cards */}
          <div className="space-y-3 mb-10">
            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code as Language)}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200
                    ${isSelected
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-surface-border bg-white hover:border-primary-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xl font-bold ${isSelected ? 'text-primary-700' : 'text-text-primary'}`}>
                        {lang.name}
                      </p>
                      <p className="text-sm text-text-muted mt-0.5">{t(lang.descKey)}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary-700 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quote */}
          <div className="text-center border-t border-surface-border pt-6">
            <p className="text-sm text-text-secondary italic">
              {t('language.quote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
