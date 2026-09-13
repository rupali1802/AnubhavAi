import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowRight, TrendingUp } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { getSkillGaps } from '../api/endpoints';
import type { SkillGapItem } from '../types';

const DEMO_GAPS = [
  { skill_name_en: 'Pricing & Marketing', skill_name_hi: 'मूल्य निर्धारण', skill_name_ta: 'விலை நிர்ணயம்', current_score: 72, target_score: 90 },
  { skill_name_en: 'Digital Marketing', skill_name_hi: 'डिजिटल मार्केटिंग', skill_name_ta: 'டிஜிட்டல் மார்க்கெட்டிங்', current_score: 30, target_score: 75 },
  { skill_name_en: 'Financial Literacy', skill_name_hi: 'वित्तीय साक्षरता', skill_name_ta: 'நிதி அறிவு', current_score: 45, target_score: 80 },
];

export default function SkillGapPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId, language, skills } = useApp();

  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      getSkillGaps(userId, language)
        .then(data => setGaps(data.gaps || DEMO_GAPS))
        .catch(() => setGaps(DEMO_GAPS))
        .finally(() => setLoading(false));
    } else {
      setGaps(DEMO_GAPS);
    }
  }, [userId, language]);

  const getGapName = (g: any) => {
    if (language === 'hi') return g.skill_name_hi || g.skill_name_en;
    if (language === 'ta') return g.skill_name_ta || g.skill_name_en;
    return g.skill_name_en || g.skill_name;
  };

  const topGap = gaps[0];

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-1">{t('gap.title')}</h1>
      <p className="text-text-secondary text-sm mb-6">{t('gap.subtitle')}</p>

      {/* Current skills snapshot */}
      <div className="card mb-6">
        <h3 className="section-heading mb-4">{t('gap.currentSkills')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {(skills.length > 0 ? skills : [
            { name: 'Food Production', name_hi: 'खाद्य उत्पादन', name_ta: 'உணவு உற்பத்தி', confidence: 0.95, confidence_level: 'high' },
            { name: 'Sales', name_hi: 'बिक्री', name_ta: 'விற்பனை', confidence: 0.90, confidence_level: 'high' },
            { name: 'Customer Handling', name_hi: 'ग्राहक प्रबंधन', name_ta: 'வாடிக்கையாளர் சேவை', confidence: 0.88, confidence_level: 'high' },
            { name: 'Inventory Management', name_hi: 'इन्वेंटरी प्रबंधन', name_ta: 'சரக்கு மேலாண்மை', confidence: 0.72, confidence_level: 'medium' },
          ]).map((s: any, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                s.confidence_level === 'high' ? 'bg-success-500' : 'bg-warning-500'
              }`} />
              <span className="text-sm text-text-primary truncate">
                {language === 'hi' ? s.name_hi || s.name : language === 'ta' ? s.name_ta || s.name : s.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top gap */}
      {topGap && (
        <div className="card border-warning-200 bg-warning-50 mb-6">
          <div className="flex items-start gap-4">
            <TrendingUp size={22} className="text-warning-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-warning-700 uppercase tracking-wider mb-1">{t('gap.topGap')}</p>
              <p className="text-lg font-bold text-text-primary mb-3">{getGapName(topGap)}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-text-muted">
                  <span>{t('gap.currentSkills')}: {topGap.current_score}%</span>
                  <span>{language === 'hi' ? 'लक्ष्य' : language === 'ta' ? 'இலக்கு' : 'Target'}: {topGap.target_score}%</span>
                </div>
                <div className="progress-bar h-3">
                  <div className="progress-fill bg-warning-500" style={{ width: `${topGap.current_score}%` }} />
                  <div className="progress-fill bg-gray-200" style={{ width: `${topGap.target_score - topGap.current_score}%` }} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => navigate('/app/verify')} className="btn-primary text-xs py-1.5 px-3">
                  {t('gap.takeChallenge')}
                </button>
                <button onClick={() => navigate('/app/opportunities')} className="btn-secondary text-xs py-1.5 px-3">
                  {t('gap.viewTraining')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All gaps */}
      {loading ? (
        <div className="flex items-center gap-3 py-8">
          <Loader2 className="animate-spin text-primary-600" size={18} />
          <span className="text-sm text-text-secondary">{t('common.loading')}</span>
        </div>
      ) : (
        <div className="card mb-6">
          <h3 className="section-heading mb-4">{t('gap.skillGap')}</h3>
          <div className="space-y-5">
            {gaps.map((g, i) => {
              const gap = g.target_score - g.current_score;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">{getGapName(g)}</span>
                    <span className="text-xs text-text-muted">Gap: {gap}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
                    <div className="absolute left-0 top-0 h-full bg-primary-500 rounded-full"
                         style={{ width: `${g.current_score}%` }} />
                    <div className="absolute top-0 h-full bg-primary-200 rounded-full"
                         style={{ left: `${g.current_score}%`, width: `${gap}%` }} />
                  </div>
                  <div className="flex justify-between text-2xs text-text-muted mt-1">
                    <span>Current: {g.current_score}%</span>
                    <span>Target: {g.target_score}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => navigate('/app/opportunities')} className="btn-primary flex-1 justify-center">
          {t('nav.opportunities')} <ArrowRight size={16} />
        </button>
        <button onClick={() => navigate('/app/path')} className="btn-secondary">
          {t('nav.myPath')}
        </button>
      </div>
    </div>
  );
}
