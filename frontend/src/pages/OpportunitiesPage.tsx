import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Volume2, MapPin, ArrowRight, Search } from 'lucide-react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../hooks/useApp';
import { getOpportunities } from '../api/endpoints';
import { speak } from '../services/voice';
import type { SchemeInfo } from '../types';

const DEMO_SCHEMES: SchemeInfo[] = [
  {
    id: 1, is_demo: true, match_score: 96,
    name: 'PM-AJAY Skilling Grant (Pradhan Mantri Anusuchit Jaati Abhyuday Yojana)',
    name_hi: 'पीएम-अजय कौशल विकास अनुदान योजना',
    name_ta: 'பிஎம்-அஜய் திறன் மேம்பாட்டு மானியத் திட்டம்',
    category: 'Social Justice & Skilling', district: 'Chennai',
    description: 'District-level skill training grant and financial support for SC beneficiaries & informal micro-entrepreneurs.',
    description_en: 'District-level skill training grant and financial support for SC beneficiaries & informal micro-entrepreneurs.',
    description_hi: 'अनुसूचित जाति के लाभार्थियों और अनौपचारिक सूक्ष्म उद्यमियों के लिए जिला स्तरीय कौशल प्रशिक्षण अनुदान।',
    description_ta: 'பட்டியலின பயனாளிகள் மற்றும் முறைசாரா சிறு தொழில் முனைவோருக்கான மாவட்ட அளவிலான திறன் பயிற்சி மானியம்.',
    benefits: 'Free skill certification, toolkit stipend, and direct credit linkage up to Rs 50,000',
    benefits_en: 'Free skill certification, toolkit stipend, and direct credit linkage up to Rs 50,000',
    benefits_hi: 'मुफ्त कौशल प्रमाणन, टूलकिट वजीफा, और 50,000 रुपये तक की प्रत्यक्ष क्रेडिट लिंकेज',
    benefits_ta: 'இலவச திறன் சான்றிதழ், கருவித்தொகுப்பு உதவித்தொகை, மற்றும் 50,000 வரை கடன் இணைப்பு',
    eligibility: 'District resident, SC beneficiary or informal micro-entrepreneur',
    eligibility_en: 'District resident, SC beneficiary or informal micro-entrepreneur',
    eligibility_hi: 'जिला निवासी, अनुसूचित जाति के लाभार्थी या अनौपचारिक सूक्ष्म-उद्यमी',
    eligibility_ta: 'மாவட்டத்தில் வசிப்பவர், பட்டியலின பயனாளி அல்லது முறைசாரா சிறு தொழிலாளி',
    duration: '3-6 months',
  },
  {
    id: 2, is_demo: true, match_score: 92,
    name: 'PM Formalization of Micro Food Processing Enterprises (PM FME)',
    name_hi: 'प्रधानमंत्री सूक्ष्म खाद्य उद्यम औपचारिकीकरण योजना',
    name_ta: 'சிறு உணவு பதப்படுத்தல் நிறுவனங்கள் முறைசார் திட்டம் (PM FME)',
    category: 'Food & Beverages', district: 'Chennai',
    description: 'Financial and technical support for micro food processing enterprises.',
    description_en: 'Financial and technical support for micro food processing enterprises.',
    description_hi: 'सूक्ष्म खाद्य प्रसंस्करण उद्यमों के लिए वित्तीय और तकनीकी सहायता।',
    description_ta: 'சிறு உணவு பதப்படுத்தல் நிறுவனங்களுக்கு நிதி மற்றும் தொழில்நுட்ப ஆதரவு.',
    benefits: 'Up to Rs 10 lakh credit linked subsidy, branding support',
    benefits_en: 'Up to Rs 10 lakh credit linked subsidy, branding support',
    benefits_hi: '10 लाख रुपये तक क्रेडिट लिंक्ड सब्सिडी, ब्रांडिंग सहायता',
    benefits_ta: '10 லட்சம் வரை கடன் சார்ந்த மானியம், பிராண்டிங் ஆதரவு',
    eligibility: 'Existing micro food processing unit',
    eligibility_en: 'Existing micro food processing unit',
    eligibility_hi: 'मौजूदा सूक्ष्म खाद्य प्रसंस्करण इकाई',
    eligibility_ta: 'தற்போது இயங்கும் சிறு உணவு பதப்படுத்தல் அலகு',
    duration: 'Ongoing',
  },
  {
    id: 3, is_demo: true, match_score: 85,
    name: 'MUDRA Loan — Shishu Category',
    name_hi: 'मुद्रा ऋण — शिशु श्रेणी',
    name_ta: 'முத்ரா கடன் — சிசு பிரிவு',
    category: 'Finance', district: 'Chennai',
    description: 'Collateral-free business loans up to Rs 50,000 for micro enterprises.',
    description_en: 'Collateral-free business loans up to Rs 50,000 for micro enterprises.',
    description_hi: 'सूक्ष्म उद्यमों के लिए 50,000 रुपये तक का संपार्श्विक-मुक्त व्यापार ऋण।',
    description_ta: 'சிறு நிறுவனங்களுக்கு 50,000 வரை பிணை இல்லாத வணிக கடன்.',
    benefits: 'Up to Rs 50,000 loan, no collateral, low interest',
    benefits_en: 'Up to Rs 50,000 loan, no collateral, low interest',
    benefits_hi: '50,000 रुपये तक ऋण, कोई संपार्श्विक नहीं',
    benefits_ta: '50,000 வரை கடன், பிணை தேவையில்லை',
    eligibility: 'Non-farm income generating activity, Indian citizen',
    eligibility_en: 'Non-farm income generating activity, Indian citizen',
    eligibility_hi: 'गैर-कृषि आय उत्पन्न करने वाली गतिविधि, भारतीय नागरिक',
    eligibility_ta: 'விவசாயமற்ற வருமான ஈட்டும் செயல்பாடு, இந்திய குடிமகன்',
    duration: '1-5 years',
  },
  {
    id: 4, is_demo: true, match_score: 90,
    name: 'PM Vishwakarma Toolkit & Enterprise Support',
    name_hi: 'पीएम विश्वकर्मा टूलकिट और उद्यम सहायता',
    name_ta: 'பிஎம் விஸ்வகர்மா கருவித்தொகுப்பு மற்றும் தொழில் ஆதரவு',
    category: 'Technical & Professional Skills', district: 'Coimbatore',
    description: 'Training, toolkit support, and affordable credit for skilled artisans and local service providers.',
    description_en: 'Training, toolkit support, and affordable credit for skilled artisans and local service providers.',
    description_hi: 'कुशल कारीगरों और स्थानीय सेवा प्रदाताओं के लिए प्रशिक्षण, टूलकिट सहायता और सस्ता ऋण।',
    description_ta: 'திறமையான கைவினைஞர்கள் மற்றும் உள்ளூர் சேவை வழங்குநர்களுக்கான பயிற்சி, கருவித்தொகுப்பு மற்றும் குறைந்த வட்டி கடன்.',
    benefits: 'Toolkit incentive, skill training, digital transaction support',
    benefits_en: 'Toolkit incentive, skill training, digital transaction support',
    benefits_hi: 'टूलकिट प्रोत्साहन, कौशल प्रशिक्षण और डिजिटल लेनदेन सहायता',
    benefits_ta: 'கருவித்தொகுப்பு ஊக்கத்தொகை, திறன் பயிற்சி மற்றும் டிஜிட்டல் பரிவர்த்தனை ஆதரவு',
    eligibility: 'Registered artisan or service provider', duration: '1-3 years',
  },
  {
    id: 5, is_demo: true, match_score: 88,
    name: 'Tamil Nadu Women Entrepreneur Growth Fund',
    name_hi: 'तमिलनाडु महिला उद्यमी विकास निधि',
    name_ta: 'தமிழ்நாடு பெண்கள் தொழில்முனைவோர் வளர்ச்சி நிதி',
    category: 'Finance', district: 'Madurai',
    description: 'Business finance and mentoring for women starting or expanding a local enterprise.',
    description_en: 'Business finance and mentoring for women starting or expanding a local enterprise.',
    description_hi: 'स्थानीय उद्यम शुरू करने या बढ़ाने वाली महिलाओं के लिए व्यापार वित्त और मार्गदर्शन।',
    description_ta: 'உள்ளூர் தொழிலை தொடங்க அல்லது விரிவுபடுத்தும் பெண்களுக்கான வணிக நிதி மற்றும் வழிகாட்டுதல்.',
    benefits: 'Working capital support, mentoring, market linkage',
    benefits_en: 'Working capital support, mentoring, market linkage',
    benefits_hi: 'कार्यशील पूंजी, मार्गदर्शन और बाजार संपर्क',
    benefits_ta: 'செயல்பாட்டு மூலதனம், வழிகாட்டுதல் மற்றும் சந்தை இணைப்பு',
    eligibility: 'Women entrepreneurs residing in Tamil Nadu', duration: 'Ongoing',
  },
  {
    id: 6, is_demo: true, match_score: 83,
    name: 'Naan Mudhalvan Digital Skills Training',
    name_hi: 'नान मुधलवन डिजिटल कौशल प्रशिक्षण',
    name_ta: 'நான் முதல்வன் டிஜிட்டல் திறன் பயிற்சி',
    category: 'Training', district: 'Chennai',
    description: 'Short digital and employability courses matched to your existing practical skills.',
    description_en: 'Short digital and employability courses matched to your existing practical skills.',
    description_hi: 'आपके मौजूदा व्यावहारिक कौशल से जुड़े छोटे डिजिटल और रोजगार पाठ्यक्रम।',
    description_ta: 'உங்கள் தற்போதைய நடைமுறை திறன்களுக்கு ஏற்ற குறுகிய டிஜிட்டல் மற்றும் வேலைவாய்ப்பு பயிற்சிகள்.',
    benefits: 'Free courses, certificates, placement support',
    benefits_en: 'Free courses, certificates, placement support',
    benefits_hi: 'मुफ्त पाठ्यक्रम, प्रमाणपत्र और रोजगार सहायता',
    benefits_ta: 'இலவச பாடநெறிகள், சான்றிதழ்கள் மற்றும் வேலைவாய்ப்பு ஆதரவு',
    eligibility: 'Tamil Nadu resident seeking skill development', duration: '2-6 months',
  },
];

const MAP_LOCATIONS = [
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { name: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { name: 'Trichy', lat: 10.7905, lng: 78.7047 },
  { name: 'Salem', lat: 11.6643, lng: 78.1460 },
];

const CATEGORY_MAP: Record<string, { hi: string; ta: string }> = {
  'Food & Beverages': { hi: 'खाद्य और पेय', ta: 'உணவு மற்றும் பானங்கள்' },
  'Social Justice & Skilling': { hi: 'सामाजिक न्याय और कौशल', ta: 'சமூக நீதி மற்றும் திறன்' },
  'Finance': { hi: 'वित्त और ऋण', ta: 'நிதி மற்றும் கடன்' },
  'Training': { hi: 'कौशल प्रशिक्षण', ta: 'திறன் பயிற்சி' },
  'Construction & Building': { hi: 'निर्माण और भवन', ta: 'கட்டுமானம் மற்றும் கட்டிடம்' },
  'Textile & Apparel': { hi: 'वस्त्र और परिधान', ta: 'ஜவுளி மற்றும் ஆடை' },
  'Personal Care & Beauty': { hi: 'सौंदर्य सेवाएं', ta: 'அழகு சேவைகள்' },
  'Electrical & Electronics': { hi: 'बिजली कार्य', ta: 'மின்சார வேலை' },
  'Food Production': { hi: 'खाद्य उत्पादन', ta: 'உணவு உற்பத்தி' },
  'Technical & Professional Skills': { hi: 'तकनीकी और व्यावसायिक कौशल', ta: 'தொழில்நுட்ப & தொழில்முறை திறன்கள்' },
  'General': { hi: 'सामान्य योजना', ta: 'பொதுத் திட்டம்' },
};

const LOCATION_MAP: Record<string, { hi: string; ta: string }> = {
  'Chennai': { hi: 'चेन्नई', ta: 'சென்னை' },
  'Coimbatore': { hi: 'कोयंबटूर', ta: 'கோயம்பத்தூர்' },
  'Madurai': { hi: 'मदुरै', ta: 'மதுரை' },
  'Tamil Nadu': { hi: 'तमिलनाडु', ta: 'தமிழ்நாடு' },
};

export default function OpportunitiesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId, language } = useApp();

  const getCategoryName = (cat?: string) => {
    if (!cat) return '';
    if (language === 'hi' && CATEGORY_MAP[cat]?.hi) return CATEGORY_MAP[cat].hi;
    if (language === 'ta' && CATEGORY_MAP[cat]?.ta) return CATEGORY_MAP[cat].ta;
    return cat;
  };

  const getLocationName = (dist?: string) => {
    if (!dist) return '';
    if (language === 'hi' && LOCATION_MAP[dist]?.hi) return LOCATION_MAP[dist].hi;
    if (language === 'ta' && LOCATION_MAP[dist]?.ta) return LOCATION_MAP[dist].ta;
    return dist;
  };

  const [schemes, setSchemes] = useState<SchemeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>('Chennai');
  const [searchTerm, setSearchTerm] = useState('');

  const parseMatches = (res: any): SchemeInfo[] => {
    if (!res) return DEMO_SCHEMES;
    const list = res.matches || res.schemes || (Array.isArray(res) ? res : null);
    if (!list || list.length === 0) return DEMO_SCHEMES;
    return list.map((item: any, idx: number) => {
      const s = item.scheme || item;
      return {
        id: s.id || idx + 1,
        name: s.name || s.name_en || '',
        name_en: s.name_en || s.name || '',
        name_hi: s.name_hi,
        name_ta: s.name_ta,
        category: s.category || 'General',
        district: s.district || 'Chennai',
        description: s.description || s.description_en || '',
        description_en: s.description_en || s.description || '',
        description_hi: s.description_hi,
        description_ta: s.description_ta,
        benefits: s.benefits || s.benefits_en || '',
        benefits_en: s.benefits_en || s.benefits || '',
        benefits_hi: s.benefits_hi,
        benefits_ta: s.benefits_ta,
        eligibility: s.eligibility || s.eligibility_en || '',
        eligibility_en: s.eligibility_en || s.eligibility || '',
        eligibility_hi: s.eligibility_hi,
        eligibility_ta: s.eligibility_ta,
        duration: s.duration || 'Ongoing',
        match_score: typeof item.match_score === 'number' ? Math.round(item.match_score) : (s.match_score || 85),
        reasons: item.reasons || s.reasons || [],
        is_demo: s.is_demo ?? true,
      };
    });
  };

  useEffect(() => {
    const targetUserId = userId || 1;
    getOpportunities(targetUserId, language)
      .then(res => setSchemes(parseMatches(res)))
      .catch(() => setSchemes(DEMO_SCHEMES))
      .finally(() => setLoading(false));
  }, [userId, language]);

  const getSchemeName = (s: SchemeInfo) => {
    if (language === 'hi' && s.name_hi) return s.name_hi;
    if (language === 'ta' && s.name_ta) return s.name_ta;
    return s.name_en || s.name;
  };

  const getField = (s: SchemeInfo, field: 'description' | 'benefits' | 'eligibility') => {
    const key = `${field}_${language}` as keyof SchemeInfo;
    const enKey = `${field}_en` as keyof SchemeInfo;
    return (s[key] || s[enKey] || s[field as keyof SchemeInfo] || '') as string;
  };

  const handleSpeak = (s: SchemeInfo) => {
    const text = `${getSchemeName(s)}. ${getField(s, 'description')}. ${t('opportunities.benefits')}: ${getField(s, 'benefits')}`;
    speak(text, language);
  };

  const matchColor = (score: number) => {
    if (score >= 85) return 'bg-success-50 text-success-700 border-success-200';
    if (score >= 70) return 'bg-warning-50 text-warning-700 border-warning-200';
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const locationSchemes = (location: string) => schemes.filter((scheme) => {
    const district = scheme.district?.toLowerCase() || '';
    return district.includes(location.toLowerCase()) || location.toLowerCase().includes(district);
  });

  const mapSchemes = schemes.length > 0 ? schemes : DEMO_SCHEMES;
  const mapLocationSchemes = (location: string) => mapSchemes.filter((scheme) => {
    const district = scheme.district?.toLowerCase() || '';
    return district.includes(location.toLowerCase()) || location.toLowerCase().includes(district);
  });

  const filteredSchemes = schemes.filter((scheme) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    return `${scheme.name} ${scheme.category} ${scheme.district}`.toLowerCase().includes(search);
  });

  return (
    <div className="min-h-full bg-[#f3f8f9] p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5c8796]">AnubhavAI</p>
          <h1 className="text-2xl font-bold text-[#183c4b]">{t('opportunities.title')}</h1>
          <p className="text-text-secondary text-sm mt-1">{t('opportunities.subtitle')}</p>
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-[#d4e4e8] bg-white px-3 py-2 text-xs text-[#58717b] sm:flex">
          <MapPin size={14} className="text-[#2d829d]" />
          <span>{t('dashboard.opportunitiesNearYou')}</span>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#d6e5e8] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4eef0] px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-bold text-[#183c4b]">{t('dashboard.opportunitiesNearYou')}</h2>
            <p className="mt-1 text-xs text-[#78909a]">
              {language === 'hi'
                ? 'तमिलनाडु में अपने कौशल से मेल खाने वाले अवसरों का अन्वेषण करें'
                : language === 'ta'
                ? 'தமிழ்நாடு முழுவதும் உங்கள் திறனுக்குப் பொருந்தும் ஆதரவை ஆராயுங்கள்'
                : 'Explore skill-matched support across Tamil Nadu'}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71909a]" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={language === 'hi' ? 'अवसर खोजें...' : language === 'ta' ? 'வாய்ப்புகளைத் தேடுங்கள்...' : 'Search opportunities...'}
              className="w-full rounded-lg border border-[#d6e5e8] bg-[#f8fbfc] py-2 pl-9 pr-3 text-xs text-[#183c4b] outline-none focus:border-[#4b9bb4]"
            />
          </div>
        </div>
        <div className="relative h-[280px] overflow-hidden sm:h-[380px]">
          <MapContainer
            center={[11.15, 78.35]}
            zoom={7}
            minZoom={6}
            maxZoom={12}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {MAP_LOCATIONS.map((location) => {
            const count = mapLocationSchemes(location.name).length;
            return (
              <CircleMarker
                key={location.name}
                center={[location.lat, location.lng]}
                radius={hoveredLocation === location.name ? 11 : 8}
                pathOptions={{
                  color: '#ffffff',
                  weight: 4,
                  fillColor: '#2f809c',
                  fillOpacity: 1,
                }}
                eventHandlers={{
                  mouseover: () => setHoveredLocation(location.name),
                  click: () => setHoveredLocation(location.name),
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  <span>{getLocationName(location.name)} · {count} {language === 'hi' ? 'अवसर' : language === 'ta' ? 'வாய்ப்புகள்' : 'opportunities'}</span>
                </Tooltip>
                <Popup>
                  <div className="min-w-[190px]">
                    <p className="text-sm font-bold text-[#183c4b]">{getLocationName(location.name)}</p>
                    <p className="text-xs text-[#78909a]">{count} {language === 'hi' ? 'मिलान किए गए अवसर' : language === 'ta' ? 'பொருந்திய வாய்ப்புகள்' : 'matching opportunities'}</p>
                    {mapLocationSchemes(location.name)[0] && (
                      <p className="mt-2 text-xs font-medium text-[#315f70]">{getSchemeName(mapLocationSchemes(location.name)[0])}</p>
                    )}
                    <button type="button" onClick={() => setSearchTerm(location.name)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#2d829d]">
                      {language === 'hi' ? 'अवसर देखें' : language === 'ta' ? 'வாய்ப்புகளைக் காண்க' : 'View opportunities'} <ArrowRight size={12} />
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
            })}
          </MapContainer>
          <div className="absolute bottom-4 left-4 rounded-lg bg-white/85 px-3 py-2 text-xs text-[#58717b] shadow-sm backdrop-blur-sm">
            {language === 'hi'
              ? 'स्थानीय अवसर देखने के लिए किसी स्थान पर क्लिक करें'
              : language === 'ta'
              ? 'உள்ளூர் வாய்ப்புகளைப் பார்க்க வரைபடக் குறியீட்டைத் தொடவும்'
              : 'Hover or click a marker to see local opportunities'}
          </div>
        </div>
      </section>

      {/* Scheme list */}

      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <Loader2 className="animate-spin text-primary-600" size={20} />
          <span className="text-sm text-text-secondary">{t('opportunities.loading')}</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white rounded-xl border border-surface-border shadow-card overflow-hidden"
            >
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === scheme.id ? null : scheme.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="badge-primary">{getCategoryName(scheme.category)}</span>
                      {scheme.district && (
                        <span className="text-xs text-text-muted">{getLocationName(scheme.district)}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary leading-snug">
                      {getSchemeName(scheme)}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {getField(scheme, 'description')}
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg border text-sm font-bold shrink-0 ${matchColor(scheme.match_score)}`}>
                    {scheme.match_score}%
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === scheme.id && (
                <div className="border-t border-surface-border p-5 bg-gray-50 animate-slide-up">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                        {t('opportunities.benefits')}
                      </p>
                      <p className="text-sm text-text-primary">{getField(scheme, 'benefits')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                        {t('opportunities.eligibility')}
                      </p>
                      <p className="text-sm text-text-primary">{getField(scheme, 'eligibility')}</p>
                    </div>
                    {scheme.duration && (
                      <div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                          {t('opportunities.duration')}
                        </p>
                        <p className="text-sm text-text-primary">{scheme.duration}</p>
                      </div>
                    )}
                  </div>

                  {scheme.reasons && scheme.reasons.length > 0 && (
                    <div className="mb-4 bg-white p-3 rounded-lg border border-surface-border">
                      <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1">
                        {language === 'hi' ? 'यह अवसर आपसे क्यों मेल खाता है:' : language === 'ta' ? 'இந்த வாய்ப்பு ஏன் உங்களுக்குப் பொருந்துகிறது:' : 'Why this matches you:'}
                      </p>
                      <ul className="list-disc list-inside text-xs text-text-secondary space-y-1">
                        {scheme.reasons.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSpeak(scheme)}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      <Volume2 size={13} />
                      {t('opportunities.hearDetails')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <button onClick={() => navigate('/app/path')} className="btn-primary flex-1 justify-center">
          {t('nav.myPath')}
        </button>
        <button onClick={() => navigate('/app/passport')} className="btn-secondary">
          {t('nav.passport')}
        </button>
      </div>
      </div>
    </div>
  );
}
