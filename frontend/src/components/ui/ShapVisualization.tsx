import React from 'react';
import { TrendingUp, TrendingDown, HelpCircle, Activity } from 'lucide-react';
import type { SHAPData, Language } from '../../types';

interface ShapVisualizationProps {
  shapData: SHAPData;
  language: Language;
}

const FEATURE_TRANSLATIONS: Record<string, Record<Language, string>> = {
  'Experience Evidence': {
    en: 'Experience Evidence Strength',
    hi: 'अनुभव प्रमाण शक्ति',
    ta: 'அனுபவ சான்றுகளின் பலம்',
  },
  'Relevant Experience Duration': {
    en: 'Relevant Experience Duration',
    hi: 'प्रासंगिक अनुभव की अवधि',
    ta: 'தொடர்புடைய அனுபவ காலம்',
  },
  'Problem Diagnosis': {
    en: 'Problem Diagnosis',
    hi: 'समस्या निदान',
    ta: 'சிக்கல் கண்டறிதல்',
  },
  'Technical Understanding': {
    en: 'Technical Understanding',
    hi: 'तकनीकी समझ',
    ta: 'தொழில்நுட்ப புரிதல்',
  },
  'Troubleshooting Approach': {
    en: 'Troubleshooting Approach',
    hi: 'समस्या निवारण दृष्टिकोण',
    ta: 'பழுதுநீக்கும் அணுகுமுறை',
  },
  'Safety Awareness': {
    en: 'Safety Awareness',
    hi: 'सुरक्षा जागरूकता',
    ta: 'பாதுகாப்பு விழிப்புணர்வு',
  },
  'Recipe & Technique': {
    en: 'Recipe & Technique',
    hi: 'रेसिपी व तकनीक',
    ta: 'சமையல் குறிப்பு & நுட்பம்',
  },
  'Hygiene & Safety': {
    en: 'Hygiene & Safety',
    hi: 'स्वच्छता व सुरक्षा',
    ta: 'சுகாதாரம் & பாதுகாப்பு',
  },
  'Process Control': {
    en: 'Process Control',
    hi: 'प्रक्रिया नियंत्रण',
    ta: 'செயல்முறை கட்டுப்பாடு',
  },
  'Customer Service': {
    en: 'Customer Service',
    hi: 'ग्राहक सेवा',
    ta: 'வாடிக்கையாளர் சேவை',
  },
  'Measurement & Pattern': {
    en: 'Measurement & Pattern',
    hi: 'माप व पैटर्न',
    ta: 'அளவு & பேட்டர்ன்',
  },
  'Craftsmanship': {
    en: 'Craftsmanship',
    hi: 'कारीगरी',
    ta: 'கைவினைத்திறன்',
  },
  'Material Handling': {
    en: 'Material Handling',
    hi: 'सामग्री प्रबंधन',
    ta: 'பொருட்கள் மேலாண்மை',
  },
  'Client Customization': {
    en: 'Client Customization',
    hi: 'ग्राहक कस्टमाइज़ेशन',
    ta: 'வாடிக்கையாளர் விருப்பம்',
  },
  'Client Consultation': {
    en: 'Client Consultation',
    hi: 'क्लाइंट परामर्श',
    ta: 'வாடிக்கையாளர் ஆலோசனை',
  },
  'Technique & Precision': {
    en: 'Technique & Precision',
    hi: 'तकनीक व सटीकता',
    ta: 'நுட்பம் & துல்லியம்',
  },
  'Hygiene & Skin Safety': {
    en: 'Hygiene & Skin Safety',
    hi: 'स्वच्छता व त्वचा सुरक्षा',
    ta: 'சுகாதாரம் & சரும பாதுகாப்பு',
  },
  'Product Application': {
    en: 'Product Application',
    hi: 'उत्पाद अनुप्रयोग',
    ta: 'தயாரிப்பு பயன்பாடு',
  },
  'Problem Understanding': {
    en: 'Problem Understanding',
    hi: 'समस्या समझ',
    ta: 'பிரச்சனை புரிதல்',
  },
  'Communication': {
    en: 'Communication',
    hi: 'संचार',
    ta: 'தொடர்பு திறன்',
  },
  'Decision Making': {
    en: 'Decision Making',
    hi: 'निर्णय लेने की क्षमता',
    ta: 'முடிவெடுக்கும் திறன்',
  },
  'Empathy': {
    en: 'Empathy',
    hi: 'सहानुभूति',
    ta: 'காரணிகள் உணர்தல்',
  },
};

export const ShapVisualization: React.FC<ShapVisualizationProps> = ({ shapData, language }) => {
  if (!shapData || !shapData.contributions || shapData.contributions.length === 0) {
    return null;
  }

  // Find max magnitude for scaling bar widths
  const maxMag = Math.max(...shapData.contributions.map((c) => c.abs_magnitude), 1.0);

  const getFeatureLabel = (rawName: string): string => {
    if (FEATURE_TRANSLATIONS[rawName] && FEATURE_TRANSLATIONS[rawName][language]) {
      return FEATURE_TRANSLATIONS[rawName][language];
    }
    return rawName;
  };

  const getSectionTitle = (): string => {
    if (language === 'ta') return 'மதிப்பெண் கணக்கீடு பின்னணி (SHAP)';
    if (language === 'hi') return 'स्कोर कारण विश्लेषण (SHAP)';
    return 'Why this score? (SHAP Analysis)';
  };

  const getPosHeading = (): string => {
    if (language === 'ta') return 'நேர்மறை பங்களிப்புகள் (+)';
    if (language === 'hi') return 'सकारात्मक योगदान (+)';
    return 'Factors Increasing Confidence (+)';
  };

  const getNegHeading = (): string => {
    if (language === 'ta') return 'நம்பிக்கையை குறைக்கும் காரணிகள் (-)';
    if (language === 'hi') return 'विश्वास कम करने वाले कारक (-)';
    return 'Factors Reducing Confidence (-)';
  };

  return (
    <div className="card mb-6 bg-gradient-to-br from-slate-900/90 to-slate-950 text-white border border-slate-800 shadow-xl overflow-hidden rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Activity size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              {getSectionTitle()}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'ta' && 'உண்மையான ML மாதிரி கணிப்பு அடிப்படையிலான SHAP பங்களிப்பு'}
              {language === 'hi' && 'वास्तविक ML मॉडल भविष्यवाणी पर आधारित SHAP योगदान'}
              {language === 'en' && 'Exact ML model feature contributions calculated using SHAP'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">
            {language === 'ta' ? 'அடிப்படை மாதிரி மதிப்பெண்' : language === 'hi' ? 'बेस मॉडल स्कोर' : 'Model Base Score'}
          </span>
          <span className="text-sm font-semibold text-slate-300">
            {shapData.base_value}% → <strong className="text-emerald-400">{shapData.final_score}%</strong>
          </span>
        </div>
      </div>

      {/* Positive & Negative Factors Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Positive Factors */}
        <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-3">
            <TrendingUp size={16} />
            <span>{getPosHeading()}</span>
          </div>
          {shapData.positive_factors.length > 0 ? (
            <ul className="space-y-2">
              {shapData.positive_factors.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between text-xs text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">+</span>
                    {getFeatureLabel(item.feature)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    +{item.shap_value}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">None</p>
          )}
        </div>

        {/* Negative Factors */}
        <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-3">
            <TrendingDown size={16} />
            <span>{getNegHeading()}</span>
          </div>
          {shapData.negative_factors.length > 0 ? (
            <ul className="space-y-2">
              {shapData.negative_factors.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between text-xs text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">-</span>
                    {getFeatureLabel(item.feature)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    {item.shap_value}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {language === 'ta' && 'மதிப்பெண்ணைக் குறைக்கும் காரணிகள் ஏதுமில்லை'}
              {language === 'hi' && 'कोई स्कोर कम करने वाला कारक नहीं'}
              {language === 'en' && 'No factors reducing confidence'}
            </p>
          )}
        </div>
      </div>

      {/* SHAP Waterfall / Contribution Bar Visualization */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <HelpCircle size={14} />
          {language === 'ta' && 'SHAP பங்களிப்பு வரைபடம் (Contribution Magnitude)'}
          {language === 'hi' && 'SHAP योगदान प्रभाव चार्ट (Contribution Magnitude)'}
          {language === 'en' && 'Feature Contribution Impact Graph'}
        </h4>

        <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          {shapData.contributions.map((item, idx) => {
            const isPos = item.shap_value >= 0;
            const barWidthPct = Math.min(100, Math.max(12, (item.abs_magnitude / maxMag) * 100));

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">{getFeatureLabel(item.feature)}</span>
                  <span className={`font-bold ${isPos ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isPos ? `+${item.shap_value}%` : `${item.shap_value}%`}
                  </span>
                </div>
                {/* Bar */}
                <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isPos ? 'bg-gradient-to-r from-emerald-600 to-teal-400' : 'bg-gradient-to-r from-amber-600 to-red-500'
                    }`}
                    style={{ width: `${barWidthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
