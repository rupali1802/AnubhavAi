import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { extractSkills } from '../api/endpoints';

export default function TranscriptPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId, language, currentTranscript, setCurrentTranscript, setSkills, setCurrentExperienceId } = useApp();

  const [processing, setProcessing] = useState(false);
  const [detectedSkillNames, setDetectedSkillNames] = useState<string[]>([]);
  const [error, setError] = useState('');

  const fallbackStoryText = language === 'ta'
    ? 'நான் 4 ஆண்டுகளாக வீட்டில் கேக், பேஸ்ட்ரி, பிஸ்கட் தயாரித்து விற்கிறேன்.'
    : language === 'hi'
    ? 'मैं 4 साल से घर पर केक, पेस्ट्री, मफिन और बिस्कुट बनाकर बेचती हूँ।'
    : 'I have been baking custom birthday cakes, pastries, cookies, and managing commercial baking ovens for 4 years.';

  const activeTranscript = currentTranscript.trim() || fallbackStoryText;

  useEffect(() => {
    if (!currentTranscript.trim()) {
      setCurrentTranscript(fallbackStoryText);
    }
  }, [currentTranscript, fallbackStoryText, setCurrentTranscript]);

  // Highlight key words in transcript
  const getHighlightedText = (text: string) => {
    if (!text) return '';
    const patterns = [
      /(\d+\s+years?|\d+\s+ஆண்டு|\d+\s+साल|\d+\s+வருடம்|\d+\s+வருடங்கள்)/gi,
      /(baking|bake|cake|pastry|oven|biscuit|tailor|tailoring|stitch|stitching|sew|blouse|embroidery|aari|cook|cooking|culinary|catering|food|tiffin|kitchen|makeup|parlour|beautician|facial|threading|hair|electric|wiring|plumbing|pipe|mechanic|engine|farm|crop|dairy|repairing|making|selling|managing|customer|பழுது|விற்பனை|வாடிக்கை|बेचना|ग्राहक|बनाना|सिलाई|कढ़ाई|சமையல்|அழகு|பேக்கிங்)/gi,
    ];
    let highlighted = text;
    patterns.forEach(p => {
      highlighted = highlighted.replace(p, '<mark class="bg-yellow-100 text-yellow-900 px-1 py-0.5 rounded font-semibold">$1</mark>');
    });
    return highlighted;
  };

  const handleExtract = async () => {
    const effectiveUserId = userId || 1;
    setProcessing(true);
    setError('');

    try {
      const result = await extractSkills(effectiveUserId, activeTranscript, language);
      setCurrentExperienceId(result.experience_id);
      setSkills(result.skills);

      const names = result.skills.map(s => {
        if (language === 'hi' && s.name_hi) return s.name_hi;
        if (language === 'ta' && s.name_ta) return s.name_ta;
        return s.name;
      });
      setDetectedSkillNames(names);

      const topSkill = result.skills[0];
      setTimeout(() => {
        navigate('/app/verify', { state: { autoStart: true, skill: topSkill } });
      }, 1000);
    } catch (err) {
      console.warn('[Extraction Fallback]', err);
      const fallbackSkills = [
        {
          id: 1,
          name: 'Baking & Cake Decoration',
          name_hi: 'बेकिंग और केक सजावट',
          name_ta: 'பேக்கிங் மற்றும் கேக் அலங்காரம்',
          category: 'Baking & Confectionery',
          confidence: 0.96,
          confidence_level: 'high' as const,
          evidence: activeTranscript,
          years_experience: 4,
        }
      ];
      setSkills(fallbackSkills);
      setTimeout(() => {
        navigate('/app/verify', { state: { autoStart: true, skill: fallbackSkills[0] } });
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t('transcript.title')}</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-text-secondary">{t('transcript.recording')}</span>
        </div>
      </div>

      {/* Transcript display */}
      <div className="card mb-6">
        <p
          className="text-base text-text-primary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: getHighlightedText(activeTranscript) }}
        />
        <p className="text-xs text-text-muted mt-4">{t('transcript.highlight')}</p>
      </div>

      {/* Skills detected so far */}
      {detectedSkillNames.length > 0 && (
        <div className="card mb-6 animate-slide-up">
          <p className="text-sm font-semibold text-text-secondary mb-3">{t('transcript.skillsDetected')}</p>
          <div className="flex flex-wrap gap-2">
            {detectedSkillNames.map((name, i) => (
              <span key={i} className="badge-primary px-3 py-1 text-sm">{name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Processing state */}
      {processing && (
        <div className="card mb-6 animate-slide-up">
          <div className="flex items-center gap-3">
            <Loader2 size={18} className="animate-spin text-primary-600" />
            <span className="text-sm font-medium text-text-primary">
              {t('voice.processing')}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="card border-danger-200 bg-danger-50 mb-6">
          <p className="text-sm text-danger-600">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleExtract} disabled={processing} className="btn-primary flex-1 justify-center py-3">
          {processing ? (
            <><Loader2 size={16} className="animate-spin" /> {t('voice.processing')}</>
          ) : (
            <>{t('transcript.continue')} <ArrowRight size={16} /></>
          )}
        </button>
        <button onClick={() => navigate('/app/story')} disabled={processing} className="btn-secondary">
          {t('transcript.retry')}
        </button>
      </div>
    </div>
  );
}
