import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';
import type { Language } from '../types';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { language, setLanguage, textSize, setTextSize } = useApp();
  const [speechRate, setSpeechRate] = useState(
    Number(localStorage.getItem('anubhavai_speech_rate') || 0.9)
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('anubhavai_speech_rate', String(speechRate));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearSession = () => {
    if (window.confirm('Clear all session data?')) {
      const lang = localStorage.getItem('anubhavai_lang');
      const deviceId = localStorage.getItem('anubhavai_device_id');
      localStorage.clear();
      if (lang) localStorage.setItem('anubhavai_lang', lang);
      if (deviceId) localStorage.setItem('anubhavai_device_id', deviceId);
      window.location.reload();
    }
  };

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'ta', label: 'தமிழ்' },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-6">{t('settings.title')}</h1>

      <div className="space-y-5">
        {/* Language */}
        <div className="card">
          <h3 className="text-base font-semibold text-text-primary mb-1">{t('settings.language')}</h3>
          <p className="text-sm text-text-muted mb-4">{t('settings.languageDesc')}</p>
          <div className="grid grid-cols-3 gap-3">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code as Language)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all
                  ${language === l.code
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-surface-border bg-white text-text-secondary hover:border-primary-300'
                  }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Voice settings */}
        <div className="card">
          <h3 className="text-base font-semibold text-text-primary mb-4">{t('settings.voice')}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="label m-0">{t('settings.voiceRate')}</label>
                <span className="text-sm text-text-muted">{speechRate.toFixed(1)}x</span>
              </div>
              <input
                type="range" min="0.5" max="1.5" step="0.1"
                value={speechRate}
                onChange={e => setSpeechRate(Number(e.target.value))}
                className="w-full accent-primary-600"
              />
            </div>
          </div>
        </div>

        {/* Text size */}
        <div className="card">
          <h3 className="text-base font-semibold text-text-primary mb-1">{t('settings.textSize')}</h3>
          <p className="text-sm text-text-muted mb-4">{t('settings.textSizeDesc')}</p>
          <div className="grid grid-cols-3 gap-3">
            {(['small', 'medium', 'large'] as const).map(size => (
              <button
                key={size}
                onClick={() => setTextSize(size)}
                className={`p-3 rounded-xl border-2 transition-all
                  ${textSize === size
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-surface-border bg-white text-text-secondary hover:border-primary-300'
                  } ${size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'}`}
              >
                {t(`settings.${size}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="card">
          <h3 className="text-base font-semibold text-text-primary mb-1">{t('settings.privacy')}</h3>
          <p className="text-sm text-text-muted mb-4">{t('settings.privacyDesc')}</p>
          <button
            onClick={handleClearSession}
            className="btn-secondary text-danger-600 border-danger-200 hover:bg-danger-50"
          >
            {t('settings.clearSession')}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={handleSave} className="btn-primary">
          {saved ? 'Saved!' : t('settings.save')}
        </button>
      </div>
    </div>
  );
}
