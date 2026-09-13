import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search, MapPin, ShieldCheck, Phone, Award, CheckCircle2, Building2,
  ArrowLeft, Home, Sparkles, Filter, ExternalLink, Check
} from 'lucide-react';
import VoicePitchPlayer from '../components/voice/VoicePitchPlayer';
import { useApp } from '../hooks/useApp';
import { getRecruiterCandidates } from '../api/endpoints';
import type { Language } from '../types';

export interface WorkerCandidate {
  id: string | number;
  name: string;
  district: string;
  state: string;
  category: string;
  verified_score: number;
  primary_skill: string;
  primary_skill_hi?: string;
  primary_skill_ta?: string;
  experience_years: number;
  phone: string;
  verified_badge: boolean;
  has_passport?: boolean;
  passport_id?: string;
  is_current_user?: boolean;
  skills: { name: string; score: number }[];
  summary: string;
  summary_hi?: string;
  summary_ta?: string;
  voice_bio: string;
  voice_bio_hi?: string;
  voice_bio_ta?: string;
}

const BENCHMARK_CANDIDATES: WorkerCandidate[] = [
  {
    id: 1,
    name: 'Kavitha M.',
    district: 'Chennai',
    state: 'Tamil Nadu',
    category: 'Baking & Confectionery',
    verified_score: 96,
    primary_skill: 'Baking & Cake Decoration',
    primary_skill_hi: 'बेकिंग और केक सजावट',
    primary_skill_ta: 'பேக்கிங் மற்றும் கேக் அலங்காரம்',
    experience_years: 4,
    phone: '+91 98765 43210',
    verified_badge: true,
    has_passport: true,
    passport_id: 'ANUBHAV-SKILL-PASS-1001',
    skills: [
      { name: 'Baking & Cake Decoration', score: 96 },
      { name: 'Commercial Oven Operations', score: 92 },
      { name: 'Customer Sales', score: 85 },
    ],
    summary: '4 years home bakery operation, custom birthday cake decoration, and confectionery baking.',
    summary_hi: 'गृह बेकरी संचालन, कस्टम केक सजावट और पेस्ट्री बेकिंग में 4 साल का अनुभव।',
    summary_ta: '4 ஆண்டுகள் கேக் பேக்கிங், அலங்காரம் மற்றும் பேக்கரி தயாரிப்புகள் செய்யும் அனுபவம்.',
    voice_bio: 'I bake custom birthday cakes, pastries, muffins, and operate commercial baking ovens safely.',
    voice_bio_hi: 'मैं कस्टम बर्थडे केक, पेस्ट्री, मफिन बेक करती हूँ और ओवन तापमान संभालती हूँ।',
    voice_bio_ta: 'நான் பிறந்தநாள் கேக்குகள், பேஸ்ட்ரிகள் தயாரித்து வர்த்தக ஓவன் மேலாண்மை செய்கிறேன்.',
  },
  {
    id: 2,
    name: 'Meena R.',
    district: 'Chennai',
    state: 'Tamil Nadu',
    category: 'Textile & Apparel',
    verified_score: 95,
    primary_skill: 'Tailoring & Garment Construction',
    primary_skill_hi: 'सिलाई और वस्त्र निर्माण',
    primary_skill_ta: 'தையல் மற்றும் ஆடை தயாரிப்பு',
    experience_years: 6,
    phone: '+91 98123 45678',
    verified_badge: true,
    has_passport: true,
    passport_id: 'ANUBHAV-SKILL-PASS-1002',
    skills: [
      { name: 'Tailoring & Garment Construction', score: 95 },
      { name: 'Aari & Zardozi Embroidery', score: 90 },
      { name: 'Fabric Pattern Cutting', score: 88 },
    ],
    summary: '6 years boutique tailoring, custom blouse designing, and Aari embroidery expertise.',
    summary_hi: 'बुटीक सिलाई, ब्लाउज डिजाइनिंग और आरी कढ़ाई में 6 साल का अनुभव।',
    summary_ta: '6 ஆண்டுகள் பிளவுஸ் டிசைனிங், துணி வெட்டுதல் மற்றும் ஆரி எம்பிராய்டரி அனுபவம்.',
    voice_bio: '6 years experience stitching bridal blouses, salwar suits, pattern cutting, and decorative Aari embroidery.',
    voice_bio_hi: '6 साल से ब्राइडल ब्लाउज, सलवार सूट, कटाई और आरी कढ़ाई का काम कर रही हूँ।',
    voice_bio_ta: '6 வருடங்களாக பிளவுஸ் தையல், ஆடை வெட்டுதல் மற்றும் ஆரி வேலை செய்கிறேன்.',
  },
  {
    id: 3,
    name: 'Lakshmi S.',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    category: 'Personal Care & Beauty',
    verified_score: 94,
    primary_skill: 'Bridal & Event Makeup Artistry',
    primary_skill_hi: 'ब्राइडल व इवेंट मेकअप',
    primary_skill_ta: 'மணப்பெண் மேக்கப்',
    experience_years: 5,
    phone: '+91 97890 12345',
    verified_badge: true,
    has_passport: true,
    passport_id: 'ANUBHAV-SKILL-PASS-1003',
    skills: [
      { name: 'Bridal & Event Makeup Artistry', score: 94 },
      { name: 'Skin Care & Hair Styling', score: 90 },
      { name: 'Threading & Mehendi', score: 86 },
    ],
    summary: '5 years operating a beauty parlour, bridal makeover, skin facials, and hair styling.',
    summary_hi: 'ब्यूटी पार्लर संचालन, ब्राइडल मेकओवर, फेशियल और हेयर स्टाइलिंग में 5 साल का अनुभव।',
    summary_ta: '5 ஆண்டுகள் அழகு நிலையம், மணப்பெண் மேக்கப், ஃபேஷியல் மற்றும் முடி அலங்கார அனுபவம்.',
    voice_bio: 'I provide professional bridal makeup, skincare prep, threading, facials, and festive hair styling.',
    voice_bio_hi: 'मैं ब्राइडल मेकअप, फेशियल, थ्रेडिंग और हेयर स्टाइलिंग पेशेवर तरीके से करती हूँ।',
    voice_bio_ta: 'நான் மணப்பெண் ஒப்பனை, சரும பராமரிப்பு மற்றும் முடி அலங்காரம் செய்கிறேன்.',
  },
  {
    id: 4,
    name: 'Karthik N.',
    district: 'Madurai',
    state: 'Tamil Nadu',
    category: 'Electrical & Electronics',
    verified_score: 93,
    primary_skill: 'Domestic Electrical Wiring',
    primary_skill_hi: 'घरेलू बिजली वायरिंग',
    primary_skill_ta: 'வீட்டு மின்சார வயரிங்',
    experience_years: 5,
    phone: '+91 96543 21098',
    verified_badge: true,
    has_passport: true,
    passport_id: 'ANUBHAV-SKILL-PASS-1004',
    skills: [
      { name: 'Domestic Electrical Wiring', score: 93 },
      { name: 'Appliance Repair', score: 86 },
      { name: 'Switchboard & Motor Fit', score: 82 },
    ],
    summary: '5 years house electrical wiring, ceiling fan fitting, and appliance troubleshooting.',
    summary_hi: 'घरेलू वायरिंग, पंखे लगाने और बिजली उपकरण सुधार में 5 साल का अनुभव।',
    summary_ta: '5 ஆண்டுகள் வீட்டு வயரிங், சுவிட்ச்போர்டு மற்றும் மோட்டார் பழுது நீக்கும் அனுபவம்.',
    voice_bio: '5 years installing domestic wiring circuits, main switchboards, ceiling fans, and motor diagnostics.',
    voice_bio_hi: '5 वर्षों से घरेलू वायरिंग, स्विचबोर्ड और बिजली उपकरण मरम्मत का काम कर रहा हूँ।',
    voice_bio_ta: '5 ஆண்டுகளாக வீட்டு மின்சார வயரிங் மற்றும் சாதனங்கள் பழுதுபார்த்தல் செய்து வருகிறேன்.',
  },
];

const SKILL_TRANSLATION_MAP: Record<string, { hi: string; ta: string }> = {
  'Baking & Cake Decoration': { hi: 'बेकिंग और केक सजावट', ta: 'பேக்கிங் மற்றும் கேக் அலங்காரம்' },
  'Commercial Oven Operations': { hi: 'व्यावसायिक ओवन संचालन', ta: 'வர்த்தக ஓவன் நிர்வாகம்' },
  'Customer Sales': { hi: 'ग्राहक बिक्री व सेवा', ta: 'வாடிக்கையாளர் விற்பனை' },
  'Tailoring & Garment Construction': { hi: 'सिलाई और वस्त्र निर्माण', ta: 'தையல் மற்றும் ஆடை தயாரிப்பு' },
  'Aari & Zardozi Embroidery': { hi: 'आरी व जरदोजी कढ़ाई', ta: 'ஆரி மற்றும் ஜர்தோசி எம்பிராய்டரி' },
  'Fabric Pattern Cutting': { hi: 'कपड़ा पैटर्न कटाई', ta: 'துணி பேட்டர்ன் வெட்டுதல்' },
  'Bridal & Event Makeup Artistry': { hi: 'ब्राइडल व इवेंट मेकअप', ta: 'மணப்பெண் மேக்கப்' },
  'Skin Care & Hair Styling': { hi: 'त्वचा देखभाल व हेयर स्टाइलिंग', ta: 'சரும பராமரிப்பு & முடி அலங்காரம்' },
  'Threading & Mehendi': { hi: 'थ्रेडिंग और मेहंदी', ta: 'த்ரெடிங் மற்றும் மெஹந்தி' },
  'Domestic Electrical Wiring': { hi: 'घरेलू बिजली वायरिंग', ta: 'வீட்டு மின்சார வயரிங்' },
  'Appliance Repair': { hi: 'बिजली उपकरण सुधार', ta: 'சாதனங்கள் பழுது நீக்கம்' },
  'Switchboard & Motor Fit': { hi: 'स्विचबोर्ड व मोटर फिटिंग', ta: 'சுவிட்ச்போர்டு & மோட்டார் பொருத்துதல்' },
};

export default function RecruiterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('highlight');

  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'en') as Language;
  const { user, userId, skills } = useApp();

  const [candidates, setCandidates] = useState<WorkerCandidate[]>(BENCHMARK_CANDIDATES);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('All');
  const [category, setCategory] = useState('All');
  const [passportFilterOnly, setPassportFilterOnly] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerCandidate | null>(null);
  const [hasScrolledToHighlight, setHasScrolledToHighlight] = useState(false);
  const [loading, setLoading] = useState(true);

  // Synthesize and merge the user candidate profile if verified skills or skill passport exists
  useEffect(() => {
    let isMounted = true;

    const loadCandidates = async () => {
      let remoteCandidates: WorkerCandidate[] = [];
      try {
        const res = await getRecruiterCandidates(lang);
        if (Array.isArray(res) && res.length > 0) {
          remoteCandidates = res;
        }
      } catch (err) {
        console.warn('[Recruiter] Backend candidates fetch failed, using local/benchmark data', err);
      }

      if (!isMounted) return;

      // Base list: remote candidates or fallback benchmark
      let list: WorkerCandidate[] = remoteCandidates.length > 0 ? remoteCandidates : [...BENCHMARK_CANDIDATES];

      // Check if current user has verified skills or skill passport
      const verifiedSkillsList = skills.filter(s => s.verified);
      const hasPassportFlag =
        localStorage.getItem('anubhavai_has_passport') === 'true' ||
        verifiedSkillsList.length > 0 ||
        !!localStorage.getItem('anubhavai_user_passport');

      if (hasPassportFlag) {
        const uId = userId || 1;
        const passId = localStorage.getItem('anubhavai_passport_id') || `ANUBHAV-SKILL-PASS-${String(uId).padStart(4, '0')}`;
        const primarySkillObj = verifiedSkillsList[0] || skills[0] || {
          name: 'Baking & Cake Decoration',
          name_hi: 'बेकिंग और केक सजावट',
          name_ta: 'பேக்கிங் மற்றும் கேக் அலங்காரம்',
          confidence: 0.96,
        };

        const userScore = verifiedSkillsList.length > 0
          ? Math.round(verifiedSkillsList.reduce((acc, s) => acc + (s.confidence || 0.9) * 100, 0) / verifiedSkillsList.length)
          : parseInt(localStorage.getItem('anubhavai_last_verified_score') || '96', 10);

        const uDistrict = user?.district || (lang === 'hi' ? 'चेन्नई' : lang === 'ta' ? 'சென்னை' : 'Chennai');
        const uState = user?.state || (lang === 'hi' ? 'तमिलनाडु' : lang === 'ta' ? 'தமிழ்நாடு' : 'Tamil Nadu');

        // Check if list already has this user
        const existingIdx = list.findIndex(c => String(c.id) === `user-${uId}` || c.is_current_user);

        const userCandidate: WorkerCandidate = {
          id: `user-${uId}`,
          name: user?.name || (lang === 'hi' ? 'आप (सत्यापित उम्मीदवार)' : lang === 'ta' ? 'நீங்கள் (சரிபார்க்கப்பட்ட பயனர்)' : 'You (Verified Candidate)'),
          district: uDistrict,
          state: uState,
          category: (primarySkillObj as any).category || 'Micro-Enterprise & Skilled',
          verified_score: userScore,
          primary_skill: primarySkillObj.name,
          primary_skill_hi: (primarySkillObj as any).name_hi || primarySkillObj.name,
          primary_skill_ta: (primarySkillObj as any).name_ta || primarySkillObj.name,
          experience_years: 3,
          phone: '+91 94440 98765',
          verified_badge: true,
          has_passport: true,
          passport_id: passId,
          is_current_user: true,
          skills: verifiedSkillsList.length > 0
            ? verifiedSkillsList.map(s => ({
                name: s.name,
                score: Math.round((s.confidence || 0.9) * 100)
              }))
            : [
                { name: primarySkillObj.name, score: userScore },
                { name: 'Customer Sales & Service', score: 90 }
              ],
          summary: `Verified skill passport holder with confirmed practical capability in ${primarySkillObj.name}. Evaluated through AnubhavAI real-world challenge scenarios.`,
          summary_hi: `अनुभवएआई व्यावहारिक परिदृश्य चुनौतियों के माध्यम से सत्यापित ${primarySkillObj.name} में सिद्ध विशेषज्ञता।`,
          summary_ta: `அனுபவ்ஏஐ நடைமுறை சூழ்நிலை தேர்வுகள் மூலம் சரிபார்க்கப்பட்ட ${primarySkillObj.name} திறன் பெற்றவர்.`,
          voice_bio: `I have demonstrated verified trade competence in ${primarySkillObj.name} through interactive practical evaluation.`,
          voice_bio_hi: `मैंने इंटरएक्टिव व्यावहारिक मूल्यांकन के माध्यम से ${primarySkillObj.name} में प्रमाणित कौशल हासिल किया है।`,
          voice_bio_ta: `நடைமுறை சூழ்நிலை மதிப்பீடு மூலம் ${primarySkillObj.name} இல் எனது திறனை வெற்றிகரமாக நிரூபித்துள்ளேன்.`,
        };

        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...userCandidate, is_current_user: true };
          // Move user candidate to top
          const [moved] = list.splice(existingIdx, 1);
          list.unshift(moved);
        } else {
          list.unshift(userCandidate);
        }
      }

      setCandidates(list);
      setLoading(false);
    };

    loadCandidates();

    return () => {
      isMounted = false;
    };
  }, [userId, lang, skills, user]);

  // Auto-scroll or open highlighted candidate from query param
  useEffect(() => {
    if (!highlightedId || hasScrolledToHighlight || candidates.length === 0) return;
    const target = candidates.find(c => String(c.id) === highlightedId || (highlightedId.startsWith('user') && c.is_current_user));
    if (target) {
      setHasScrolledToHighlight(true);
      const el = document.getElementById(`candidate-${target.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedId, candidates, hasScrolledToHighlight]);

  const districts = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach(c => {
      if (c.district) set.add(c.district);
    });
    return ['All', ...Array.from(set)];
  }, [candidates]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach(c => {
      if (c.category) set.add(c.category);
    });
    return ['All', ...Array.from(set)];
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.primary_skill.toLowerCase().includes(search.toLowerCase()) ||
        (c.passport_id && c.passport_id.toLowerCase().includes(search.toLowerCase()));
      const matchesDistrict = district === 'All' || c.district === district;
      const matchesCategory = category === 'All' || c.category === category;
      const matchesPassport = !passportFilterOnly || c.has_passport === true;
      return matchesSearch && matchesDistrict && matchesCategory && matchesPassport;
    });
  }, [candidates, search, district, category, passportFilterOnly]);

  const getPrimarySkill = (c: WorkerCandidate) => {
    if (lang === 'hi' && c.primary_skill_hi) return c.primary_skill_hi;
    if (lang === 'ta' && c.primary_skill_ta) return c.primary_skill_ta;
    return c.primary_skill;
  };

  const getSummary = (c: WorkerCandidate) => {
    if (lang === 'hi' && c.summary_hi) return c.summary_hi;
    if (lang === 'ta' && c.summary_ta) return c.summary_ta;
    return c.summary;
  };

  const getLocalizedLocation = (dist: string, st: string) => {
    if (lang === 'hi') {
      const d = dist === 'Chennai' ? 'चेन्नई' : dist === 'Coimbatore' ? 'कोयंबटूर' : dist === 'Madurai' ? 'मदुरै' : dist;
      const s = st === 'Tamil Nadu' ? 'तमिलनाडु' : st;
      return `${d}, ${s}`;
    }
    if (lang === 'ta') {
      const d = dist === 'Chennai' ? 'சென்னை' : dist === 'Coimbatore' ? 'கோயம்பத்தூர்' : dist === 'Madurai' ? 'மதுரை' : dist;
      const s = st === 'Tamil Nadu' ? 'தமிழ்நாடு' : st;
      return `${d}, ${s}`;
    }
    return `${dist}, ${st}`;
  };

  const getSubSkillName = (s: { name: string; score: number }) => {
    if (lang === 'hi' && SKILL_TRANSLATION_MAP[s.name]?.hi) return SKILL_TRANSLATION_MAP[s.name].hi;
    if (lang === 'ta' && SKILL_TRANSLATION_MAP[s.name]?.ta) return SKILL_TRANSLATION_MAP[s.name].ta;
    return s.name;
  };

  const uiTexts = {
    backToDashboard: lang === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : lang === 'ta' ? 'டாஷ்போர்டுக்குத் திரும்பு' : 'Back to Dashboard',
    portalTag: lang === 'hi' ? 'एमएसएमई और भर्तीकर्ता प्रतिभा पोर्टल' : lang === 'ta' ? 'குறுந்தொழில் & பணியமர்த்துநர் போர்டல்' : 'MSME & Recruiter Talent Portal',
    portalTitle: lang === 'hi' ? 'सत्यापित अनौपचारिक क्षेत्र की प्रतिभाओं को काम पर रखें' : lang === 'ta' ? 'சரிபார்க்கப்பட்ட முறைசாரா திறமையாளர்களை பணியமர்த்தவும்' : 'Hire Verified Informal Sector Talent',
    portalDesc: lang === 'hi' ? 'तमिलनाडु और भारत भर में अनुभवी, परिदृश्य-सत्यापित कौशल पासपोर्ट धारकों और तकनीशियनों से सीधे जुड़ें।' : lang === 'ta' ? 'தமிழ்நாடு மற்றும் இந்தியா முழுவதும் உள்ள சரிபார்க்கப்பட்ட திறன் பாஸ்போர்ட் வைத்திருக்கும் நிபுணர்களுடன் நேரடியாக இணையுங்கள்.' : 'Connect directly with experienced, scenario-verified Skill Passport holders and micro-specialists across Tamil Nadu & India.',
    searchPlaceholder: lang === 'hi' ? 'कर्मचारी के नाम, कौशल या पासपोर्ट आईडी से खोजें...' : lang === 'ta' ? 'பெயர், திறன் அல்லது பாஸ்போர்ட் எண் மூலம் தேடுங்கள்...' : 'Search by worker name, skill, or passport ID...',
    districtLabel: lang === 'hi' ? 'जिला' : lang === 'ta' ? 'மாவட்டம்' : 'District',
    categoryLabel: lang === 'hi' ? 'श्रेणी' : lang === 'ta' ? 'பிரிவு' : 'Category',
    allOption: lang === 'hi' ? 'सभी' : lang === 'ta' ? 'அனைத்தும்' : 'All',
    verifiedBadge: lang === 'hi' ? 'सत्यापित' : lang === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Verified',
    scoreLabel: lang === 'hi' ? 'अंक' : lang === 'ta' ? 'மதிப்பெண்' : 'Score',
    primarySkillLabel: lang === 'hi' ? 'प्राथमिक सत्यापित कौशल:' : lang === 'ta' ? 'முதன்மை சரிபார்க்கப்பட்ட திறன்:' : 'Primary Verified Skill:',
    yearsExp: lang === 'hi' ? 'वर्षों का अनुभव' : lang === 'ta' ? 'ஆண்டுகள் அனுபவம்' : 'Years Experience',
    hireBtn: lang === 'hi' ? 'भर्ती करें / संपर्क करें' : lang === 'ta' ? 'பணியமர்த்து / தொடர்புகொள்' : 'Hire / Contact',
    candidateScoreBadge: lang === 'hi' ? 'सत्यापित उम्मीदवार' : lang === 'ta' ? 'சரிபார்க்கப்பட்ட விண்ணப்பதாரர்' : 'Verified Candidate',
    skillBreakdown: lang === 'hi' ? 'सत्यापित कौशल विवरण' : lang === 'ta' ? 'சரிபார்க்கப்பட்ட திறன் விவரங்கள்' : 'Verified Skill Breakdown',
    callCandidate: lang === 'hi' ? 'उम्मीदवार को कॉल करें' : lang === 'ta' ? 'தொலைபேசியில் தொடர்புகொள்' : 'Call Candidate',
    allCandidates: lang === 'hi' ? 'सभी उम्मीदवार' : lang === 'ta' ? 'அனைத்து விண்ணப்பதாரர்கள்' : 'All Candidates',
    passportOnly: lang === 'hi' ? 'स्किल पासपोर्ट धारक' : lang === 'ta' ? 'திறன் பாஸ்போர்ட் வைத்திருப்பவர்கள்' : 'Skill Passport Holders',
    viewPassport: lang === 'hi' ? 'स्किल पासपोर्ट देखें' : lang === 'ta' ? 'திறன் பாஸ்போர்ட்' : 'View Skill Passport',
    yourProfileBadge: lang === 'hi' ? '⭐ आपकी प्रोफ़ाइल (पोर्टल पर लाइव)' : lang === 'ta' ? '⭐ உங்கள் சுயவிவரம் (போர்ட்டலில் நேரலை)' : '⭐ Your Profile (Live on Portal)',
    passportVerified: lang === 'hi' ? 'स्किल पासपोर्ट सत्यापित' : lang === 'ta' ? 'திறன் பாஸ்போர்ட் சரிபார்க்கப்பட்டது' : 'Skill Passport Verified',
    officialCredential: lang === 'hi' ? 'आधिकारिक अनुभवएआई स्किल पासपोर्ट साख' : lang === 'ta' ? 'அதிகாரப்பூர்வ அனுபவ்ஏஐ திறன் பாஸ்போர்ட்' : 'Official AnubhavAI Skill Passport Credential',
  };

  const passportCount = candidates.filter(c => c.has_passport).length;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-surface-border shadow-xs">
        <button
          onClick={() => navigate('/app')}
          className="btn-primary text-xs py-2 px-4 flex items-center gap-2 font-bold shadow-xs hover:scale-102 transition-transform"
        >
          <ArrowLeft size={16} /> {uiTexts.backToDashboard}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/app/passport')}
            className="text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary-200 transition-colors"
          >
            <Award size={15} /> {uiTexts.viewPassport}
          </button>
          <button
            onClick={() => navigate('/app')}
            className="text-xs font-semibold text-text-secondary hover:text-primary-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border hover:bg-gray-50"
          >
            <Home size={14} /> Dashboard
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 rounded-2xl p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Building2 size={24} className="text-primary-300" />
            <span className="text-xs uppercase tracking-wider text-primary-200 font-semibold">
              {uiTexts.portalTag}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {uiTexts.portalTitle}
          </h1>
          <p className="text-sm text-primary-200 max-w-2xl leading-relaxed">
            {uiTexts.portalDesc}
          </p>

          {/* Quick Stats Bar */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span><strong>{candidates.length}</strong> {uiTexts.allCandidates}</span>
            </div>
            <div className="flex items-center gap-2 bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-400/30">
              <Award size={16} className="text-indigo-300" />
              <span><strong>{passportCount}</strong> {uiTexts.passportOnly}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card p-5 space-y-4 shadow-xs">
        {/* Filter Tabs (All vs Skill Passport) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-surface-border pb-3">
          <button
            onClick={() => setPassportFilterOnly(false)}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
              !passportFilterOnly
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            {uiTexts.allCandidates} ({candidates.length})
          </button>
          <button
            onClick={() => setPassportFilterOnly(true)}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
              passportFilterOnly
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Award size={14} />
            {uiTexts.passportOnly} ({passportCount})
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Search input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-text-muted" />
            <input
              type="text"
              placeholder={uiTexts.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>

          {/* District filter */}
          <div>
            <select
              value={district}
              onChange={e => setDistrict(e.target.value)}
              className="input"
            >
              {districts.map(d => (
                <option key={d} value={d}>
                  {uiTexts.districtLabel}: {d === 'All' ? uiTexts.allOption : d}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="input"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {uiTexts.categoryLabel}: {c === 'All' ? uiTexts.allOption : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Candidate Grid */}
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {filteredCandidates.map(c => {
          const isHighlighted = (highlightedId && (String(c.id) === highlightedId || (highlightedId.startsWith('user') && c.is_current_user))) || c.is_current_user;

          return (
            <div
              id={`candidate-${c.id}`}
              key={c.id}
              className={`card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between relative ${
                isHighlighted
                  ? 'border-2 border-primary-500 bg-gradient-to-br from-primary-50/30 via-white to-white shadow-md ring-2 ring-primary-300/40'
                  : ''
              }`}
              onClick={() => setSelectedWorker(c)}
            >
              <div>
                {/* Current User Active Tag */}
                {c.is_current_user && (
                  <div className="mb-3 px-3 py-1 bg-gradient-to-r from-amber-50 to-primary-50 border border-amber-300 rounded-lg flex items-center justify-between text-2xs font-bold text-amber-900 shadow-2xs">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-600" />
                      {uiTexts.yourProfileBadge}
                    </span>
                    <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Verified & Listed
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-text-primary">{c.name}</h3>
                      {c.verified_badge && (
                        <span className="badge-high text-2xs flex items-center gap-1">
                          <CheckCircle2 size={12} /> {uiTexts.verifiedBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                      <MapPin size={12} /> {getLocalizedLocation(c.district, c.state)}
                    </p>
                  </div>
                  <span className="badge bg-primary-50 text-primary-700 border border-primary-200 font-bold text-xs">
                    {c.verified_score}% {uiTexts.scoreLabel}
                  </span>
                </div>

                {/* Skill Passport Badge */}
                {c.has_passport && (
                  <div className="mb-3 p-2 bg-indigo-50/80 border border-indigo-200 rounded-lg flex items-center justify-between text-2xs">
                    <span className="flex items-center gap-1.5 font-bold text-indigo-900">
                      <Award size={14} className="text-indigo-600 shrink-0" />
                      <span>{uiTexts.passportVerified}:</span>
                      <code className="text-2xs font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-700">
                        {c.passport_id || 'ANUBHAV-SKILL-PASS-0001'}
                      </code>
                    </span>
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check size={12} /> Valid
                    </span>
                  </div>
                )}

                <div className="mb-3">
                  <p className="text-xs font-semibold text-text-secondary mb-1">{uiTexts.primarySkillLabel}</p>
                  <p className="text-sm font-medium text-text-primary bg-gray-50 p-2 rounded-lg border border-surface-border">
                    {getPrimarySkill(c)}
                  </p>
                </div>

                <p className="text-xs text-text-secondary line-clamp-2 mb-3">
                  {getSummary(c)}
                </p>

                {/* Voice Bio Audio Player */}
                <div className="mb-4">
                  <VoicePitchPlayer
                    workerName={c.name}
                    voiceText={c.voice_bio}
                    voiceTextHi={c.voice_bio_hi}
                    voiceTextTa={c.voice_bio_ta}
                    compact={true}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-surface-border gap-2">
                <span className="text-xs text-text-muted">{c.experience_years} {uiTexts.yearsExp}</span>
                <div className="flex items-center gap-2">
                  {c.has_passport && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (c.is_current_user) {
                          navigate('/app/passport');
                        } else {
                          setSelectedWorker(c);
                        }
                      }}
                      className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
                      title={uiTexts.viewPassport}
                    >
                      <Award size={13} />
                      <span className="hidden sm:inline">{uiTexts.viewPassport}</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedWorker(c); }}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    {uiTexts.hireBtn}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCandidates.length === 0 && (
        <div className="card text-center p-12 space-y-3">
          <Award size={40} className="text-text-muted mx-auto" />
          <h3 className="text-base font-bold text-text-primary">No candidates found</h3>
          <p className="text-xs text-text-secondary">Try adjusting your search criteria or category filter.</p>
          <button
            onClick={() => { setSearch(''); setDistrict('All'); setCategory('All'); setPassportFilterOnly(false); }}
            className="btn-secondary text-xs py-1.5 px-3 mx-auto"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Hire Modal & Skill Passport Credential Modal */}
      {selectedWorker && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedWorker(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 animate-slide-up shadow-modal max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-text-primary">{selectedWorker.name}</h3>
                  {selectedWorker.is_current_user && (
                    <span className="badge bg-amber-100 text-amber-800 text-2xs font-bold">You</span>
                  )}
                </div>
                <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                  <MapPin size={12} /> {getLocalizedLocation(selectedWorker.district, selectedWorker.state)}
                </p>
              </div>
              <span className="badge-high text-xs font-bold px-3 py-1">
                {selectedWorker.verified_score}% {uiTexts.candidateScoreBadge}
              </span>
            </div>

            {/* Official Skill Passport Box in Modal */}
            {selectedWorker.has_passport && (
              <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-primary-50 border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Award size={18} />
                    </div>
                    <div>
                      <p className="text-2xs font-bold text-indigo-900 uppercase tracking-wide">
                        {uiTexts.officialCredential}
                      </p>
                      <p className="text-xs font-mono font-bold text-indigo-700">
                        {selectedWorker.passport_id || 'ANUBHAV-SKILL-PASS-0001'}
                      </p>
                    </div>
                  </div>
                  <span className="badge bg-emerald-100 text-emerald-800 text-2xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                </div>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  Proven practical capability via AnubhavAI scenario evaluations. Credential cryptographically stamped and registered for MSME hiring.
                </p>
                {selectedWorker.is_current_user && (
                  <button
                    onClick={() => navigate('/app/passport')}
                    className="mt-3 text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-primary-200 shadow-2xs hover:bg-primary-50"
                  >
                    <ExternalLink size={13} /> {lang === 'hi' ? 'पूर्ण प्रिंट करने योग्य पासपोर्ट खोलें' : lang === 'ta' ? 'முழு பாஸ்போர்ட்டைத் திறக்கவும்' : 'Open Full Printable Skill Passport'}
                  </button>
                )}
              </div>
            )}

            {/* Voice Bio Full Player in Modal */}
            <div className="mb-4">
              <VoicePitchPlayer
                workerName={selectedWorker.name}
                voiceText={selectedWorker.voice_bio}
                voiceTextHi={selectedWorker.voice_bio_hi}
                voiceTextTa={selectedWorker.voice_bio_ta}
                compact={false}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-surface-border mb-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                {uiTexts.skillBreakdown}
              </p>
              <div className="space-y-2">
                {selectedWorker.skills.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-primary">{getSubSkillName(s)}</span>
                    <span className="font-bold text-success-600">{s.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              {getSummary(selectedWorker)}
            </p>

            <div className="space-y-3">
              <a
                href={`tel:${selectedWorker.phone}`}
                className="btn-primary w-full justify-center text-sm py-2.5 flex items-center gap-2"
              >
                <Phone size={16} /> {uiTexts.callCandidate} ({selectedWorker.phone})
              </a>
              <button
                onClick={() => setSelectedWorker(null)}
                className="btn-ghost w-full justify-center text-xs py-2"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
