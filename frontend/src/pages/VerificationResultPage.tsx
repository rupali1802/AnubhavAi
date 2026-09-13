import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, ArrowRight, AlertTriangle, RefreshCw, BookOpen, Info, Sparkles, Award, Building2 } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { ShapVisualization } from '../components/ui/ShapVisualization';
import type { Language } from '../types';

export default function VerificationResultPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { verificationResult: result, userId } = useApp();

  if (!result) {
    navigate('/app/verify');
    return null;
  }

  const currentLang = (result.language || i18n.language || 'en') as Language;
  const isPass = result.status === 'demonstrated' || result.status === 'partially_demonstrated';
  const score = typeof result.score === 'number' ? result.score : Math.round((result.score || 0) * 100);

  const statusMap: Record<string, string> = {
    demonstrated: t('result.status.demonstrated'),
    partially_demonstrated: t('result.status.partially_demonstrated'),
    needs_improvement: t('result.status.needs_improvement'),
    no_evidence: t('result.status.no_evidence'),
  };
  const statusLabel = statusMap[result.status] || t('result.status.demonstrated');

  const dimensionLabels: Record<string, string> = {
    'Problem Understanding': t('result.dimensions.problemUnderstanding'),
    'Communication': t('result.dimensions.communication'),
    'Decision Making': t('result.dimensions.decisionMaking'),
    'Empathy': t('result.dimensions.empathy'),
  };

  // Branch A: NO_EVIDENCE (User answered "I don't know" or provided no evidence)
  if (result.status === 'no_evidence') {
    return (
      <div className="p-6 max-w-2xl mx-auto animate-fade-in">
        {/* Status banner - Amber/Warning */}
        <div className="rounded-2xl p-7 mb-6 text-center bg-amber-50 border border-amber-200 shadow-sm">
          <AlertTriangle size={44} className="text-amber-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {t('result.noEvidence.title')}
          </h1>
          <div className="mt-2 inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wide">
            {t('result.noEvidence.status')}
          </div>
        </div>

        {/* Explanation card */}
        <div className="card mb-6 border-l-4 border-l-amber-400">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{t('result.explanation')}</h3>
          <p className="text-sm text-text-primary leading-relaxed">{result.explanation}</p>
          <div className="mt-4 p-3 bg-amber-50/60 rounded-xl text-xs text-amber-900 flex items-center gap-2 border border-amber-200/60">
            <Info size={16} className="text-amber-600 shrink-0" />
            <span>{t('result.noEvidence.inferredNote')}</span>
          </div>
        </div>

        {/* Actions for no_evidence */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => navigate('/app/verify', { state: { retry: true } })} 
            className="btn-primary flex-1 justify-center py-3 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            {t('result.noEvidence.tryAnother')}
          </button>
          <button 
            onClick={() => navigate('/app/gap')} 
            className="btn-secondary justify-center py-3 flex items-center gap-2"
          >
            <BookOpen size={16} />
            {t('result.noEvidence.learnRetry')}
          </button>
          <button 
            onClick={() => navigate('/app/gap')} 
            className="btn-ghost justify-center py-3 text-text-muted"
          >
            {t('result.noEvidence.skipForNow')}
          </button>
        </div>
      </div>
    );
  }

  const hasDimensions = result.dimensions && Object.keys(result.dimensions).length > 0;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      {/* Status banner */}
      <div className={`rounded-2xl p-7 mb-6 text-center ${isPass ? 'bg-success-50 border border-success-200' : 'bg-red-50 border border-red-200'}`}>
        {isPass
          ? <CheckCircle size={40} className="text-success-600 mx-auto mb-3" />
          : <XCircle size={40} className="text-danger-500 mx-auto mb-3" />}
        <h1 className="text-2xl font-bold text-text-primary mb-1">{statusLabel}</h1>
        {score > 0 && (
          <p className="text-5xl font-bold mt-3 mb-1" style={{ color: isPass ? '#16a34a' : '#dc2626' }}>
            {score}%
          </p>
        )}
        <p className="text-sm text-text-muted">{t('result.confidence')}</p>
      </div>

      {/* Real SHAP Visualization */}
      {result.shap_data && (
        <ShapVisualization shapData={result.shap_data} language={currentLang} />
      )}

      {/* SHAP LLM Narrative Explanation */}
      {result.shap_explanation && (
        <div className="card mb-6 border-l-4 border-l-indigo-500 bg-indigo-50/30">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles size={16} className="text-indigo-600" />
            {currentLang === 'ta' && 'SHAP மாதிரி விளக்கம் (Model Explanation)'}
            {currentLang === 'hi' && 'SHAP मॉडल व्याख्या (Model Explanation)'}
            {currentLang === 'en' && 'SHAP Model Explanation'}
          </h3>
          <p className="text-sm text-slate-800 leading-relaxed font-medium">
            {result.shap_explanation}
          </p>
        </div>
      )}

      {/* Dimensions */}
      {hasDimensions && (
        <div className="card mb-6">
          <h3 className="section-heading mb-4">{t('result.evaluation')}</h3>
          <div className="space-y-4">
            {Object.entries(result.dimensions).map(([dim, dimScore]) => {
              const pct = typeof dimScore === 'number' ? (dimScore <= 1 ? Math.round(dimScore * 100) : dimScore) : 0;
              return (
                <div key={dim}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary">
                      {dimensionLabels[dim] || dim}
                    </span>
                    <span className="text-sm font-bold text-text-secondary">{pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${pct >= 75 ? 'bg-success-600' : pct >= 50 ? 'bg-warning-600' : 'bg-danger-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overall Explanation */}
      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-text-muted mb-2">{t('result.explanation')}</h3>
        <p className="text-sm text-text-primary leading-relaxed">{result.explanation}</p>
      </div>

      {/* Skill Passport & Recruiter Portal Live Banner */}
      {isPass && (
        <div className="card mb-6 border-2 border-primary-500 bg-gradient-to-br from-primary-50/70 via-white to-emerald-50/50 shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md">
              <Award size={26} />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="badge bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider">
                  {currentLang === 'hi' ? 'स्किल पासपोर्ट जारी' : currentLang === 'ta' ? 'திறன் பாஸ்போர்ட் வழங்கப்பட்டது' : 'Skill Passport Issued'}
                </span>
                <span className="badge bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {currentLang === 'hi' ? 'भर्ती पोर्टल पर लाइव' : currentLang === 'ta' ? 'பணியமர்த்துநர் போர்ட்டலில் நேரலை' : 'Live on Recruiter Portal'}
                </span>
              </div>
              <h3 className="text-base font-bold text-text-primary">
                {currentLang === 'hi'
                  ? 'सत्यापित कौशल आपके आधिकारिक स्किल पासपोर्ट और भर्तीकर्ता पोर्टल में शामिल हो गया है!'
                  : currentLang === 'ta'
                  ? 'சரிபார்க்கப்பட்ட திறன் உங்கள் அதிகாரப்பூர்வ திறன் பாஸ்போர்ட் மற்றும் பணியமர்த்துநர் போர்ட்டலில் சேர்க்கப்பட்டது!'
                  : 'Verified Skill Added to Your Skill Passport & Included on Recruiter Portal!'}
              </h3>
              <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                {currentLang === 'hi'
                  ? 'बधाई हो! आपकी सत्यापित प्रोफ़ाइल अब एमएसएमई (MSME) और भर्तीकर्ता पोर्टल पर सक्रिय है ताकि नियोक्ता आपको वास्तविक कौशल प्रमाण के आधार पर सीधे काम पर रख सकें।'
                  : currentLang === 'ta'
                  ? 'வாழ்த்துகள்! உங்கள் சரிபார்க்கப்பட்ட சுயவிவரம் இப்போது குறுந்தொழில் மற்றும் பணியமர்த்துநர் போர்ட்டலில் நேரடியாக பட்டியலிடப்பட்டுள்ளது.'
                  : 'Congratulations! Your verified credential has been added to your AnubhavAI Skill Passport and published directly onto the Recruiter & MSME Talent Portal for employers to hire you.'}
              </p>
              <div className="flex flex-wrap gap-2.5 mt-4">
                <button
                  onClick={() => navigate(`/recruiter?highlight=user-${userId || 1}`)}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold shadow-xs hover:scale-102 transition-transform"
                >
                  <Building2 size={15} />
                  {currentLang === 'hi' ? 'भर्तीकर्ता पोर्टल पर अपनी प्रोफ़ाइल देखें' : currentLang === 'ta' ? 'பணியமர்த்துநர் போர்ட்டலில் பார்க்கவும்' : 'View on Recruiter Portal'}
                </button>
                <button
                  onClick={() => navigate('/app/passport')}
                  className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
                >
                  <Award size={15} />
                  {currentLang === 'hi' ? 'अपना स्किल पासपोर्ट देखें' : currentLang === 'ta' ? 'திறன் பாஸ்போர்ட்டைப் பார்க்கவும்' : 'View Skill Passport'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => navigate('/app/gap')} className="btn-primary flex-1 justify-center">
          {t('result.nextStep')} <ArrowRight size={16} />
        </button>
        <button onClick={() => navigate('/app/verify', { state: { retry: true } })} className="btn-secondary">
          {t('result.verifyAnother')}
        </button>
      </div>
    </div>
  );
}
