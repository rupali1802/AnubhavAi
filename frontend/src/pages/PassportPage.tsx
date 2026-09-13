import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, Share2, ShieldCheck, Award, Building2 } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { getSkillPassport } from '../api/endpoints';
import type { SkillPassport } from '../types';

export default function PassportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId, language, user, skills } = useApp();
  const [passport, setPassport] = useState<SkillPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const passportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      getSkillPassport(userId, language)
        .then((p) => {
          setPassport(p);
          try {
            localStorage.setItem('anubhavai_has_passport', 'true');
            localStorage.setItem('anubhavai_user_passport', JSON.stringify(p));
          } catch (_) {}
        })
        .catch(() => buildDemoPassport())
        .finally(() => setLoading(false));
    } else {
      buildDemoPassport();
      setLoading(false);
    }
  }, [userId, language]);

  const buildDemoPassport = () => {
    const displaySkills = skills.length > 0 ? skills : [
      { name: 'Baking & Cake Decoration', name_hi: 'बेकिंग और केक सजावट', name_ta: 'பேக்கிங் மற்றும் கேக் அலங்காரம்', confidence: 0.96, confidence_level: 'high' as const, verified: true },
      { name: 'Tailoring & Garment Construction', name_hi: 'सिलाई और वस्त्र निर्माण', name_ta: 'தையல் மற்றும் ஆடை தயாரிப்பு', confidence: 0.94, confidence_level: 'high' as const, verified: true },
      { name: 'Bridal & Event Makeup Artistry', name_hi: 'ब्राइडल व इवेंट मेकअप', name_ta: 'மணப்பெண் மேக்கப்', confidence: 0.92, confidence_level: 'high' as const, verified: false },
      { name: 'Domestic Electrical Wiring', name_hi: 'घरेलू बिजली वायरिंग', name_ta: 'வீட்டு மின்சார வயரிங்', confidence: 0.88, confidence_level: 'high' as const, verified: false },
    ];

    const firstSkill = displaySkills[0]?.name || '';
    let direction = 'Micro-Enterprise & Skilled Specialist';
    if (firstSkill.includes('Baking')) direction = 'Baking & Confectionery Entrepreneur';
    else if (firstSkill.includes('Tailor')) direction = 'Textile & Apparel Boutique Specialist';
    else if (firstSkill.includes('Culinary') || firstSkill.includes('Cook') || firstSkill.includes('Food')) direction = 'Culinary & Catering Entrepreneur';
    else if (firstSkill.includes('Makeup') || firstSkill.includes('Beauty')) direction = 'Bridal Beautician & Cosmetology Specialist';
    else if (firstSkill.includes('Electrical')) direction = 'Licensed Domestic Electrician & Technician';
    else if (firstSkill.includes('Plumb')) direction = 'Sanitary & Pipeline Specialist';

    const LOCALIZED_DIRECTIONS: Record<string, { hi: string; ta: string }> = {
      'Baking & Confectionery Entrepreneur': { hi: 'बेकिंग और कन्फेक्शनरी उद्यमी', ta: 'பேக்கிங் மற்றும் பேக்கரி தொழில்முனைவோர்' },
      'Textile & Apparel Boutique Specialist': { hi: 'वस्त्र और बुटीक विशेषज्ञ', ta: 'ஜவுளி மற்றும் ஆடை பட்டறை நிபுணர்' },
      'Culinary & Catering Entrepreneur': { hi: 'कैटरिंग और पाक कला उद्यमी', ta: 'சமையல் & கேட்டரிங் தொழில் முனைவோர்' },
      'Bridal Beautician & Cosmetology Specialist': { hi: 'ब्राइडल ब्यूटीशियन व सौंदर्य विशेषज्ञ', ta: 'மணப்பெண் மேக்கப் நிபுணர்' },
      'Licensed Domestic Electrician & Technician': { hi: 'घरेलू बिजली तकनीशियन', ta: 'வீட்டு மின்சார நிபுணர்' },
      'Sanitary & Pipeline Specialist': { hi: 'प्लंबिंग व सेनेटरी विशेषज्ञ', ta: 'குழாய் பழுது நிபுணர்' },
      'Micro-Enterprise & Skilled Specialist': { hi: 'सूक्ष्म व्यवसाय व कुशल विशेषज्ञ', ta: 'சிறு தொழில் மற்றும் திறன் நிபுணர்' },
    };

    const localizedDir = language === 'hi'
      ? LOCALIZED_DIRECTIONS[direction]?.hi || 'खाद्य और पेय क्षेत्र — लघु व्यवसाय विकास'
      : language === 'ta'
      ? LOCALIZED_DIRECTIONS[direction]?.ta || 'உணவு மற்றும் பானங்கள் துறை — சிறு வணிக வளர்ச்சி'
      : direction;

    const locDistrict = language === 'hi' ? 'चेन्नई' : language === 'ta' ? 'சென்னை' : 'Chennai';
    const locState = language === 'hi' ? 'तमिलनाडु' : language === 'ta' ? 'தமிழ்நாடு' : 'Tamil Nadu';

    setPassport({
      user_id: userId || 0,
      user_name: user?.name || (language === 'ta' ? 'பயனர்' : language === 'hi' ? 'उपयोगकर्ता' : 'Demo User'),
      district: locDistrict,
      state: locState,
      language,
      verified_skills: displaySkills.map(s => ({
        skill_name: language === 'ta' ? (s as any).name_ta || s.name : language === 'hi' ? (s as any).name_hi || s.name : s.name,
        skill_name_en: s.name,
        skill_name_hi: (s as any).name_hi || s.name,
        skill_name_ta: (s as any).name_ta || s.name,
        confidence: s.confidence,
        confidence_level: s.confidence_level,
        verified: s.verified || false,
        verification_status: s.verified ? 'demonstrated' : 'pending',
        evidence: language === 'hi' ? 'वाक् अनुभव विवरण से निकाला गया।' : language === 'ta' ? 'குரல் அனுபவ விவரத்திலிருந்து பிரித்தெடுக்கப்பட்டது.' : 'Extracted from voice experience narrative.',
      })),
      experience_summary: (() => {
        if (displaySkills.length > 0) {
          const names = displaySkills.map(d => (language === 'hi' ? (d as any).name_hi || d.name : language === 'ta' ? (d as any).name_ta || d.name : d.name)).join(', ');
          return language === 'hi'
            ? `व्यावहारिक कार्य अनुभव और सत्यापित कौशल: ${names}।`
            : language === 'ta'
            ? `நடைமுறை பணி அனுபவம் மற்றும் சரிபார்க்கப்பட்ட திறன்கள்: ${names}.`
            : `Demonstrated practical expertise in ${names}.`;
        }
        return language === 'ta'
          ? 'நடைமுறை பணி அனுபவம் மற்றும் சரிபார்க்கப்பட்ட திறன்கள்.'
          : language === 'hi'
          ? 'व्यावहारिक कार्य अनुभव और सत्यापित कौशल।'
          : 'Practical work experience and verified trade capabilities.';
      })(),
      career_direction: localizedDir,
      recommended_opportunities: [],
      total_skills: displaySkills.length,
      verified_count: displaySkills.filter(s => (s as any).verified).length,
      generated_at: new Date().toISOString(),
    });
  };

  const handleDownload = () => window.print();

  if (loading) {
    return <div className="p-6 text-center text-text-muted">{t('common.loading')}</div>;
  }

  if (!passport) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-text-primary">{t('passport.title')}</h1>
        <div className="flex gap-2">
          <button onClick={handleDownload} className="btn-secondary text-xs py-2 px-3">
            <Download size={14} /> {t('passport.download')}
          </button>
        </div>
      </div>

      {/* Recruiter Portal Integration Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-primary-50 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {language === 'hi' ? 'भर्तीकर्ता पोर्टल पर सक्रिय' : language === 'ta' ? 'பணியமர்த்துநர் போர்ட்டலில் நேரலை' : 'Live on Recruiter Portal'}
              </span>
              <span className="badge bg-emerald-100 text-emerald-800 text-2xs font-semibold">
                ANUBHAV-SKILL-PASS-{String(passport.user_id || 1).padStart(4, '0')}
              </span>
            </div>
            <p className="text-xs text-emerald-800/90 mt-0.5">
              {language === 'hi'
                ? 'आपका सत्यापित स्किल पासपोर्ट अब नियोक्ताओं और एमएसएमई (MSME) को भर्ती पोर्टल पर दिखाई दे रहा है।'
                : language === 'ta'
                ? 'உங்கள் சரிபார்க்கப்பட்ட திறன் பாஸ்போர்ட் முதலாளிகள் மற்றும் குறுந்தொழில்களுக்கான போர்ட்டலில் கிடைக்கிறது.'
                : 'Your verified Skill Passport is actively published and discoverable by employers on the Recruiter Portal.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/recruiter?highlight=user-${passport.user_id || 1}`)}
          className="btn-primary text-xs py-2 px-3.5 shrink-0 flex items-center gap-1.5 font-bold shadow-xs hover:scale-102 transition-transform"
        >
          <Building2 size={15} />
          {language === 'hi' ? 'पोर्टल पर लिस्टिंग देखें' : language === 'ta' ? 'போர்ட்டலில் பார்க்க' : 'View on Recruiter Portal'}
        </button>
      </div>

      {/* Passport card */}
      <div ref={passportRef} className="bg-white rounded-2xl border-2 border-primary-700 shadow-modal overflow-hidden">
        {/* Header */}
        <div className="bg-primary-700 px-7 py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-primary-200 text-xs font-medium mb-1">AnubhavAI — {t('landing.tagline')}</p>
              <h2 className="text-2xl font-bold">{t('passport.title')}</h2>
            </div>
            <Award size={32} className="text-primary-300" />
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          {/* User info */}
          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-surface-border">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">{t('passport.name')}</p>
              <p className="text-sm font-semibold text-text-primary mt-0.5">{passport.user_name}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">{t('passport.district')}</p>
              <p className="text-sm font-semibold text-text-primary mt-0.5">{passport.district}, {passport.state}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">{t('passport.careerDirection')}</p>
              <p className="text-sm font-semibold text-text-primary mt-0.5">{passport.career_direction}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">{t('passport.totalSkills')}</p>
              <p className="text-sm font-semibold text-text-primary mt-0.5">
                {passport.total_skills} ({passport.verified_count} {t('passport.verified')})
              </p>
            </div>
          </div>

          {/* Experience summary */}
          <div className="mb-6">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">{t('passport.experience')}</p>
            <p className="text-sm text-text-primary leading-relaxed">{passport.experience_summary}</p>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-3">{t('passport.title')}</p>
            <div className="space-y-3">
              {passport.verified_skills.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                    ${s.verified ? 'bg-success-50' : 'bg-gray-100'}`}>
                    <ShieldCheck size={15} className={s.verified ? 'text-success-600' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{s.skill_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.verified && (
                      <span className="badge-high text-2xs">{t('passport.verified')}</span>
                    )}
                    <span className="text-xs text-text-muted">{Math.round(s.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-surface-border flex items-center justify-between">
            <p className="text-xs text-text-muted">{t('passport.generated')}</p>
            <p className="text-xs text-text-muted">
              {new Date(passport.generated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
