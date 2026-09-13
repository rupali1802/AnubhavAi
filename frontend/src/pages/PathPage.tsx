import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, Lock } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { getProgressionPath } from '../api/endpoints';
import type { PathStep } from '../types';

const DEMO_STEPS: PathStep[] = [
  { step: 1, title: 'Tell Your Story', title_hi: 'अपनी कहानी बताएं', title_ta: 'உங்கள் கதை சொல்லுங்கள்', description: 'Record your experience using voice', description_hi: 'आवाज़ का उपयोग करके अपना अनुभव रिकॉर्ड करें', description_ta: 'குரல் பயன்படுத்தி உங்கள் அனுபவத்தை பதிவு செய்யுங்கள்', duration: '5 min', status: 'completed', unlocks: 'Skill Discovery', unlocks_hi: 'कौशल खोज', unlocks_ta: 'திறன் கண்டறிதல்' },
  { step: 2, title: 'Discover Skills', title_hi: 'कौशल खोजें', title_ta: 'திறன்களை கண்டறியுங்கள்', description: 'See skills from your experience', description_hi: 'अपने अनुभव से कौशल देखें', description_ta: 'உங்கள் அனுபவத்திலிருந்து திறன்களை காண்க', duration: '2 min', status: 'completed', unlocks: 'Verification Challenge', unlocks_hi: 'सत्यापन चुनौती', unlocks_ta: 'சரிபார்ப்பு சவால்' },
  { step: 3, title: 'Verify a Skill', title_hi: 'एक कौशल सत्यापित करें', title_ta: 'ஒரு திறனை சரிபார்க்கவும்', description: 'Answer a real-world scenario by voice', description_hi: 'आवाज़ से एक वास्तविक परिदृश्य का उत्तर दें', description_ta: 'குரலில் ஒரு நடைமுறை சூழ்நிலைக்கு பதிலளிக்கவும்', duration: '10 min', status: 'current', unlocks: 'Scheme Matching', unlocks_hi: 'योजना मिलान', unlocks_ta: 'திட்டப் பொருத்தம்' },
  { step: 4, title: 'Match to Opportunities', title_hi: 'अवसरों से मिलान करें', title_ta: 'வாய்ப்புகளுடன் பொருத்தவும்', description: 'Get matched to government schemes and training', description_hi: 'सरकारी योजनाओं और प्रशिक्षण से मिलान पाएं', description_ta: 'அரசு திட்டங்கள் மற்றும் பயிற்சியுடன் பொருத்தப்படுங்கள்', duration: '5 min', status: 'upcoming', unlocks: 'Skill Passport', unlocks_hi: 'कौशल पासपोर्ट', unlocks_ta: 'திறன் பாஸ்போர்ட்' },
  { step: 5, title: 'Get Your Skill Passport', title_hi: 'अपना कौशल पासपोर्ट पाएं', title_ta: 'உங்கள் திறன் பாஸ்போர்ட் பெறுங்கள்', description: 'Download your verified skill certificate', description_hi: 'अपना सत्यापित कौशल प्रमाण पत्र डाउनलोड करें', description_ta: 'உங்கள் சரிபார்க்கப்பட்ட திறன் சான்றிதழை பதிவிறக்கவும்', duration: '1 min', status: 'upcoming', unlocks: 'Opportunities Unlocked', unlocks_hi: 'अवसर अनलॉक हुए', unlocks_ta: 'வாய்ப்புகள் திறக்கப்பட்டன' },
];

export default function PathPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId, language } = useApp();

  const [steps, setSteps] = useState<PathStep[]>(DEMO_STEPS);

  useEffect(() => {
    if (userId) {
      getProgressionPath(userId, language)
        .then(data => {
          if (data.steps?.length) {
            setSteps(data.steps);
          }
        })
        .catch(() => {});
    }
  }, [userId, language]);

  const getStepTitle = (s: PathStep) => {
    if (language === 'hi' && s.title_hi) return s.title_hi;
    if (language === 'ta' && s.title_ta) return s.title_ta;
    return s.title;
  };

  const getStepDesc = (s: PathStep) => {
    if (language === 'hi' && s.description_hi) return s.description_hi;
    if (language === 'ta' && s.description_ta) return s.description_ta;
    return s.description;
  };

  const getUnlocks = (s: PathStep) => {
    if (language === 'hi' && s.unlocks_hi) return s.unlocks_hi;
    if (language === 'ta' && s.unlocks_ta) return s.unlocks_ta;
    return s.unlocks;
  };

  const stepTarget = ['/app/story', '/app/skills', '/app/verify', '/app/opportunities', '/app/passport'];

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-1">{t('path.title')}</h1>
      <p className="text-text-secondary text-sm mb-8">{t('path.subtitle')}</p>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-6 bottom-6 w-px bg-surface-border" />

        <div className="space-y-4">
          {steps.map((step, i) => {
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';
            const isUpcoming = step.status === 'upcoming';

            return (
              <div key={step.step} className={`relative flex gap-4 ${isUpcoming ? 'opacity-60' : ''}`}>
                {/* Step icon */}
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white
                  ${isCompleted ? 'border-success-500 bg-success-50' :
                    isCurrent ? 'border-primary-600 bg-primary-50' :
                    'border-gray-200 bg-white'}`}>
                  {isCompleted ? (
                    <CheckCircle2 size={20} className="text-success-600" />
                  ) : isCurrent ? (
                    <span className="text-sm font-bold text-primary-700">{step.step}</span>
                  ) : (
                    <Lock size={16} className="text-gray-400" />
                  )}
                </div>

                {/* Step content */}
                <div className={`flex-1 card mb-0 ${isCurrent ? 'border-primary-300 bg-primary-50/30' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isCompleted && <span className="badge-high text-2xs">{t('path.completed')}</span>}
                        {isCurrent && <span className="badge-primary text-2xs">{t('path.current')}</span>}
                        {isUpcoming && <span className="text-2xs badge bg-gray-100 text-gray-500">{t('path.upcoming')}</span>}
                      </div>
                      <h3 className="text-sm font-semibold text-text-primary">{getStepTitle(step)}</h3>
                      <p className="text-xs text-text-muted mt-0.5">{getStepDesc(step)}</p>
                      <div className="flex items-center gap-1 mt-2 text-2xs text-text-muted">
                        <Clock size={11} />
                        <span>{step.duration}</span>
                        {step.unlocks && (
                          <><span className="mx-1">·</span><span>{t('path.unlocks')}: {getUnlocks(step)}</span></>
                        )}
                      </div>
                    </div>
                    {(isCurrent || isCompleted) && (
                      <button
                        onClick={() => navigate(stepTarget[i] || '/app')}
                        className={`text-xs font-medium shrink-0 px-3 py-1.5 rounded-lg
                          ${isCurrent ? 'bg-primary-700 text-white hover:bg-primary-800' : 'bg-white border border-surface-border text-text-secondary hover:bg-gray-50'}
                          transition-colors`}
                      >
                        {isCurrent ? t('path.start') : t('path.viewDetails')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
