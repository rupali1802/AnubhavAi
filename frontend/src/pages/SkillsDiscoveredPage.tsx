import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Info, ShieldCheck, Network, Sparkles } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import type { ExtractedSkill } from '../types';

export default function SkillsDiscoveredPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { skills, language } = useApp();
  const [selectedSkill, setSelectedSkill] = useState<ExtractedSkill | null>(null);

  const getSkillName = (s: ExtractedSkill) => {
    if (language === 'hi' && s.name_hi) return s.name_hi;
    if (language === 'ta' && s.name_ta) return s.name_ta;
    return s.name;
  };

  const getEvidence = (s: ExtractedSkill) => {
    if (typeof s.evidence === 'string') return s.evidence;
    if (Array.isArray(s.evidence) && s.evidence.length > 0) {
      const ev = s.evidence[0];
      if (language === 'hi' && ev.text_hi) return ev.text_hi;
      if (language === 'ta' && ev.text_ta) return ev.text_ta;
      return ev.text;
    }
    if (language === 'hi' && s.evidence_hi) return s.evidence_hi;
    if (language === 'ta' && s.evidence_ta) return s.evidence_ta;
    return '';
  };

  const confidenceColor = (level: string) => {
    if (level === 'high') return 'badge-high';
    if (level === 'medium') return 'badge-medium';
    return 'badge-low';
  };

  const confidenceBarColor = (level: string) => {
    if (level === 'high') return 'bg-success-600';
    if (level === 'medium') return 'bg-warning-600';
    return 'bg-danger-500';
  };

  const displaySkills = skills;


  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('skills.title')}</h1>
        <p className="text-text-secondary text-sm mt-1">{t('skills.subtitle')}</p>
      </div>

      {/* Empty State */}
      {displaySkills.length === 0 ? (
        <div className="card text-center py-12 px-6 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">
            {language === 'hi' ? 'कोई कौशल अभी तक दर्ज नहीं किया गया है' : language === 'ta' ? 'இன்னும் திறன்கள் பதிவு செய்யப்படவில்லை' : 'No Skills Extracted Yet'}
          </h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
            {language === 'hi'
              ? 'कृपया अपनी दैनिक कार्य कहानी बोलकर रिकॉर्ड करें ताकि आपके प्रासंगिक कौशल स्वतः पहचाने जा सकें।'
              : language === 'ta'
              ? 'உங்கள் வேலை அனுபவத்தை குரல் மூலம் பதிவு செய்து திறன்களைக் கண்டறியவும்.'
              : 'Please record your voice story to automatically discover skills relevant to your experience.'}
          </p>
          <button onClick={() => navigate('/app/story')} className="btn-primary inline-flex justify-center py-2.5 px-6">
            {language === 'hi' ? 'अपनी कहानी रिकॉर्ड करें' : language === 'ta' ? 'கதையைப் பதிவுசெய்' : 'Record Your Story'}
          </button>
        </div>
      ) : (
        /* Skills grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {displaySkills.map((skill, i) => (
            <div
              key={i}
              className="card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedSkill(skill as ExtractedSkill)}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="badge-primary">{skill.category}</span>
                <span className={confidenceColor(skill.confidence_level)}>
                  {t(`skills.${skill.confidence_level}`)}
                </span>
              </div>

              <h3 className="text-base font-semibold text-text-primary mb-1">
                {getSkillName(skill as ExtractedSkill)}
              </h3>

              <p className="text-xs text-text-muted mb-3 line-clamp-2">
                {t('skills.discoveredFrom')}: &ldquo;{getEvidence(skill as ExtractedSkill)}&rdquo;
              </p>

              {/* Confidence bar */}
              <div className="progress-bar">
                <div
                  className={`progress-fill ${confidenceBarColor(skill.confidence_level)}`}
                  style={{ width: `${Math.round(skill.confidence * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xs text-text-muted">{t('skills.confidence')}</span>
                <span className="text-2xs font-medium text-text-secondary">{Math.round(skill.confidence * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evidence modal */}
      {selectedSkill && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4"
             onClick={() => setSelectedSkill(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-slide-up shadow-modal"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">{getSkillName(selectedSkill)}</h3>
              <span className={confidenceColor(selectedSkill.confidence_level)}>
                {t(`skills.${selectedSkill.confidence_level}`)}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                {t('skills.evidence.evidenceText')}
              </p>
              <p className="text-sm text-text-primary leading-relaxed">
                {getEvidence(selectedSkill)}
              </p>
            </div>

            {selectedSkill.years_experience && (
              <p className="text-sm text-text-secondary mb-4">
                {selectedSkill.years_experience} {t('common.years')} {t('skills.confidence')}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { const sk = selectedSkill; setSelectedSkill(null); navigate('/app/verify', { state: { autoStart: true, skill: sk } }); }}
                className="btn-primary flex-1 justify-center"
              >
                <ShieldCheck size={15} />
                {t('skills.verifySkill')}
              </button>
              <button onClick={() => setSelectedSkill(null)} className="btn-secondary">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => navigate('/app/graph')} className="btn-secondary">
          <Network size={16} />
          {t('skills.viewGraph')}
        </button>
        <button onClick={() => navigate('/app/verify', { state: { autoStart: true, skill: skills[0] } })} className="btn-primary">
          <ShieldCheck size={16} />
          {t('skills.verifySkill')}
          <ChevronRight size={16} />
        </button>
      </div>

      <p className="text-sm text-text-muted mt-6 text-center italic">
        &ldquo;Your everyday experience contains valuable skills.&rdquo;
      </p>
    </div>
  );
}
