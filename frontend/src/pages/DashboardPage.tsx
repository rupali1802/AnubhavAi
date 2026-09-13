import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BarChart3, Briefcase, Mic, Package, ShieldCheck, Sparkles, Users, MapPin, Image as ImageIcon } from 'lucide-react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../hooks/useApp';
import heroIllustrationClean from '../assets/hero_illustration_clean.png';
import characterImg from '../assets/character.png';
import journeyImg from '../assets/journey.png';
import oppsPreviewImg from '../assets/opportunities-preview.png';

const MAP_LOCATIONS = [
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, count: 12 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, count: 8 },
  { name: 'Madurai', lat: 9.9252, lng: 78.1198, count: 7 },
  { name: 'Trichy', lat: 10.7905, lng: 78.7047, count: 5 },
  { name: 'Salem', lat: 11.6643, lng: 78.146, count: 6 },
];

const LOCATION_NAMES: Record<string, { hi: string; ta: string }> = {
  Chennai: { hi: 'चेन्नई', ta: 'சென்னை' },
  Coimbatore: { hi: 'कोयंबटूर', ta: 'கோயம்பத்தூர்' },
  Madurai: { hi: 'मदुरै', ta: 'மதுரை' },
  Trichy: { hi: 'त्रिची', ta: 'திருச்சி' },
  Salem: { hi: 'सेलम', ta: 'சேலம்' },
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { skills, language } = useApp();
  const [showMapImage, setShowMapImage] = useState(false);

  const getSkillName = (skill: any) => {
    if (language === 'hi' && skill.name_hi) return skill.name_hi;
    if (language === 'ta' && skill.name_ta) return skill.name_ta;
    return skill.name;
  };

  const getLocationDisplayName = (name: string) => {
    if (language === 'hi' && LOCATION_NAMES[name]?.hi) return LOCATION_NAMES[name].hi;
    if (language === 'ta' && LOCATION_NAMES[name]?.ta) return LOCATION_NAMES[name].ta;
    return name;
  };

  const topSkills = skills.slice(0, 5);
  const skillPercent = (skill: any) => Math.round((skill.confidence || 0) * 100);

  return (
    <div className="dashboard-page mx-auto max-w-[100rem] space-y-4 p-4 animate-fade-in sm:p-6 lg:p-7">
      {/* Dynamic Localized Hero Banner */}
      <section className="dashboard-reference-top" aria-label="AnubhavAI welcome">
        <div className="relative overflow-hidden rounded-2xl border border-[#dcecef] bg-gradient-to-r from-[#2a778c] via-[#3d8da1] to-[#60a5b6] p-6 sm:p-8 text-white shadow-[0_10px_24px_rgba(36,85,104,0.12)] min-h-[14rem] sm:min-h-[15.5rem] flex flex-col justify-center">
          {/* Subtle background ambient curves */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full border border-white/10 bg-white/5" />
          <div className="pointer-events-none absolute right-28 -bottom-16 h-48 w-48 rounded-full border border-white/10 bg-white/5" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left text column */}
            <div className="max-w-xl text-left space-y-2">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-[#d6eff5]">
                {language === 'hi' ? 'स्वागत है' : language === 'ta' ? 'வரவேற்கிறோம்' : 'WELCOME TO'}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-xs">
                AnubhavAI
              </h1>
              <p className="text-sm sm:text-base text-[#e5f4f8] font-medium leading-relaxed">
                {language === 'hi'
                  ? 'अपने कौशल को पहचानें। नए अवसरों को अनलॉक करें।'
                  : language === 'ta'
                  ? 'உங்கள் திறமைகளைக் கண்டறியுங்கள். புதிய வாய்ப்புகளைத் திறக்கவும்.'
                  : 'Discover your skills. Unlock new opportunities.'}
              </p>

              <div className="pt-2">
                <button
                  onClick={() => navigate('/app/story')}
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-[#194b59] hover:bg-[#f0f8fa] font-bold text-sm sm:text-base rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Mic size={18} className="text-[#2b8098]" />
                  <span>
                    {language === 'hi' ? 'अपनी कहानी बताएं' : language === 'ta' ? 'உங்கள் கதையைச் சொல்லுங்கள்' : 'Tell Your Story'}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <p className="text-xs text-[#cce8f0] font-normal pt-1">
                {language === 'hi'
                  ? 'स्वाभाविक रूप से बोलें। कोई बायोडाटा नहीं। कोई तकनीकी शब्द नहीं।'
                  : language === 'ta'
                  ? 'இயல்பாகப் பேசுங்கள். ரெஸ்யூம் தேவையில்லை. தொழில்நுட்ப வார்த்தைகள் தேவையில்லை.'
                  : 'Speak naturally. No resume. No technical terms.'}
              </p>
            </div>

            {/* Right illustration column */}
            <div className="relative shrink-0 flex items-center justify-center self-center md:self-end mt-2 md:mt-0">
              {/* Floating quote badge matching active language */}
              <div className="absolute -top-3 sm:-top-5 right-2 sm:right-4 z-20 rounded-full bg-white/95 px-3.5 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-[#dcecef] text-[#1c4d5b] font-bold text-xs sm:text-sm tracking-wide transform rotate-2 animate-bounce-subtle backdrop-blur-xs">
                {language === 'hi' ? '✨ “आपकी कहानी अनमोल है”' : language === 'ta' ? '✨ “உங்கள் கதை மதிப்புமிக்கது”' : '✨ “Your story has value.”'}
              </div>

              <img
                src={heroIllustrationClean || '/assets/hero_illustration_clean.png'}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.tried1) {
                    target.dataset.tried1 = 'true';
                    target.src = '/assets/character.png';
                  } else if (!target.dataset.tried2) {
                    target.dataset.tried2 = 'true';
                    target.src = '/assets/hero_illustration_clean.png';
                  }
                }}
                alt="AnubhavAI Student"
                className="h-44 sm:h-52 md:h-60 w-auto object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.2)] rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { value: skills.length || 6, label: t('dashboard.skillSnapshot'), note: t('dashboard.fromYourExperiences'), icon: Sparkles, tone: 'blue' },
          { value: skills.filter((skill) => skill.verified).length || 4, label: t('dashboard.verified'), note: t('dashboard.realWorldValidation'), icon: ShieldCheck, tone: 'teal' },
          { value: 3, label: t('dashboard.opportunitiesMatched'), note: t('dashboard.basedOnYourSkills'), icon: Briefcase, tone: 'peach' },
          { value: 2, label: t('dashboard.growthPathways'), note: t('dashboard.youAreCloser'), icon: BarChart3, tone: 'blue' },
        ].map(({ value, label, note, icon: Icon, tone }) => (
          <div key={label} className="dashboard-reference-stat"><span className={`dashboard-reference-icon ${tone}`}><Icon size={20} /></span><span><strong>{value}</strong><small>{label}</small><em>{note}</em></span><ArrowRight size={17} className="ml-auto text-[#9ab0b7]" /></div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="dashboard-panel">
          <div className="dashboard-section-heading"><div><p>{t('dashboard.yourSkillStrengths')}</p><h2>{t('dashboard.skillsDiscovered')}</h2></div><button onClick={() => navigate('/app/skills')}>{t('common.viewAll')} <ArrowRight size={14} /></button></div>
          {topSkills.length === 0 ? <p className="py-8 text-sm text-[#718790]">{t('dashboard.noSkills')}</p> : <div className="space-y-3">{topSkills.map((skill, index) => <div key={index} className="dashboard-skill-row"><span className={`dashboard-reference-icon ${index === 2 ? 'peach' : 'teal'}`}>{index === 0 ? <Users size={17} /> : index === 1 ? <BarChart3 size={17} /> : <Package size={17} />}</span><span className="min-w-0 flex-1"><b>{getSkillName(skill)}</b><span className="dashboard-progress"><i style={{ width: `${skillPercent(skill)}%` }} /></span></span><strong>{skillPercent(skill)}%</strong></div>)}</div>}
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-section-heading"><div><p>{t('dashboard.topOpportunitiesForYou')}</p><h2>{t('dashboard.matchedPathways')}</h2></div><button onClick={() => navigate('/app/opportunities')}>{t('common.viewAll')} <ArrowRight size={14} /></button></div>
          <div className="space-y-2">{[
            { title: t('dashboard.pmFormalization'), note: t('dashboard.ministryOfMsme'), percent: 94 },
            { title: t('dashboard.selfHelpGroup'), note: t('dashboard.ruralDevelopment'), percent: 88 },
            { title: t('dashboard.entrepreneurship'), note: t('dashboard.stateSkillDevelopment'), percent: 82 }
          ].map(({ title, note, percent }, index) => <button key={title} onClick={() => navigate('/app/opportunities')} className="dashboard-opportunity-row"><span className="dashboard-reference-icon teal">{index === 0 ? <Briefcase size={17} /> : index === 1 ? <Users size={17} /> : <BarChart3 size={17} />}</span><span className="min-w-0 flex-1 text-left"><b>{title}</b><small>{note}</small></span><strong className={index === 2 ? 'orange' : ''}>{percent}%</strong></button>)}</div>
        </div>

        <div className="dashboard-panel dashboard-map-card">
          <div className="dashboard-section-heading items-start">
            <div className="min-w-0 flex-1 pr-2">
              <p className="truncate text-2xs font-bold tracking-wider uppercase text-[#718790]">{t('dashboard.opportunitiesNearYou')}</p>
              <h2 className="text-sm sm:text-base font-extrabold text-[#224755] leading-snug">{t('dashboard.exploreYourMap')}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMapImage(!showMapImage)}
                className="inline-flex items-center gap-1 rounded-md bg-[#eef6f8] px-2 py-1 text-xs font-semibold text-[#275a6c] hover:bg-[#dfeef2] transition-colors"
                title={showMapImage ? 'Switch to interactive map' : 'Switch to image preview'}
              >
                {showMapImage ? <MapPin size={13} /> : <ImageIcon size={13} />}
                <span>{showMapImage ? 'Map' : 'Image'}</span>
              </button>
              <button onClick={() => navigate('/app/opportunities')} className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[#356a7b] hover:text-[#183c4b] whitespace-nowrap pt-1">
                <span>{t('dashboard.viewMap')}</span>
                <ArrowRight size={14} className="shrink-0" />
              </button>
            </div>
          </div>
          {showMapImage ? (
            <div className="relative h-[220px] w-full overflow-hidden rounded-xl border border-[#d6e5ea] bg-slate-50 flex items-center justify-center">
              <img
                src={oppsPreviewImg || '/assets/opportunities-preview.png'}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/opportunities-preview.png'; }}
                alt="Opportunities Visual Preview"
                className="h-full w-full object-cover rounded-xl"
              />
            </div>
          ) : (
            <div className="dashboard-live-map">
              <MapContainer center={[11.15, 78.35]} zoom={7} minZoom={6} maxZoom={12} scrollWheelZoom className="h-full w-full">
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {MAP_LOCATIONS.map((location) => (
                  <CircleMarker key={location.name} center={[location.lat, location.lng]} radius={8} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2f809c', fillOpacity: 1 }}>
                    <Tooltip direction="top" offset={[0, -8]}>{getLocationDisplayName(location.name)} · {location.count} {language === 'hi' ? 'अवसर' : language === 'ta' ? 'வாய்ப்புகள்' : 'opportunities'}</Tooltip>
                    <Popup><strong>{getLocationDisplayName(location.name)}</strong><br />{location.count} {language === 'hi' ? 'मिलान किए गए अवसर' : language === 'ta' ? 'பொருந்திய வாய்ப்புகள்' : 'matching opportunities'}</Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>
      </section>

      {/* Dynamic Localized Journey Section */}
      <section className="dashboard-panel dashboard-journey-panel" aria-label={t('dashboard.yourJourney')}>
        <div className="dashboard-section-heading">
          <div>
            <p className="text-2xs font-bold tracking-wider uppercase text-[#718790]">{t('dashboard.yourJourney')}</p>
            <h2 className="text-base font-extrabold text-[#224755]">{t('dashboard.continueJourney')}</h2>
          </div>
          <span className="dashboard-journey-percent">
            {skills.length > 0 ? (skills.some((s) => s.verified) ? '60%' : '40%') : '20%'}
          </span>
        </div>

        {/* Visual Journey Illustration Banner */}
        <div className="mb-4 overflow-hidden rounded-xl border border-[#d6e5ea] bg-gradient-to-r from-[#edf6f9] to-[#e8f1f5] shadow-xs">
          <img
            src={journeyImg || '/assets/journey.png'}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/journey.png'; }}
            alt="Your Skill Journey"
            className="w-full h-28 sm:h-36 md:h-44 object-cover object-center"
          />
        </div>

        <div className="dashboard-journey-line">
          {[
            { step: 1, label: t('dashboard.tellStory'), route: '/app/story', done: true },
            { step: 2, label: t('dashboard.skillsDiscovered'), route: '/app/skills', done: skills.length > 0 },
            { step: 3, label: t('dashboard.verified'), route: '/app/verify', done: skills.some((s) => s.verified) },
            { step: 4, label: t('dashboard.opportunitiesMatched'), route: '/app/opportunities', done: false },
            { step: 5, label: t('passport.title'), route: '/app/passport', done: false },
          ].map(({ step, label, route, done }) => (
            <button key={step} onClick={() => navigate(route)}>
              <span className={done ? 'done' : ''}>{step}</span>
              <b>{label}</b>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

