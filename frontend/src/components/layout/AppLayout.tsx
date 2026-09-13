import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../hooks/useApp';
import {
  Home, Mic, BookOpen, ShieldCheck, Briefcase, GitBranch,
  FileText, Settings, Building2
} from 'lucide-react';
import { useState } from 'react';

import type { Language } from '../../types';

const NAV_ITEMS = [
  { key: 'home', path: '/app', icon: Home, label: 'nav.home' },
  { key: 'story', path: '/app/story', icon: Mic, label: 'nav.tellStory' },
  { key: 'skills', path: '/app/skills', icon: BookOpen, label: 'nav.mySkills' },
  { key: 'verify', path: '/app/verify', icon: ShieldCheck, label: 'nav.verification' },
  { key: 'opportunities', path: '/app/opportunities', icon: Briefcase, label: 'nav.opportunities' },
  { key: 'path', path: '/app/path', icon: GitBranch, label: 'nav.myPath' },
  { key: 'passport', path: '/app/passport', icon: FileText, label: 'nav.passport' },
  { key: 'recruiter', path: '/recruiter', icon: Building2, label: 'nav.recruiter' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
];

export default function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage } = useApp();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (path: string) =>
    path === '/app' ? location.pathname === '/app' : location.pathname.startsWith(path);

  const handleLangChange = async (lang: Language) => {
    await setLanguage(lang);
  };

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-[#f3f8f9]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[#28596b] bg-[#2f6577] lg:flex">
        {/* Brand */}
        <div className="border-b border-white/10 px-5 py-5">
          <span className="text-xl font-bold tracking-tight text-white">AnubhavAI</span>
          <p className="mt-0.5 text-xs text-[#c8dde3]">{t('landing.tagline')}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={active
                  ? 'flex w-full items-center gap-3 rounded-lg border-l-2 border-white bg-white/15 px-3 py-2.5 text-left text-sm font-medium text-white'
                  : 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#d2e4e8] transition-colors hover:bg-white/10 hover:text-white'}
              >
                <Icon size={17} />
                <span>{t(item.label)}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="space-y-0.5 border-t border-white/10 px-3 py-4">
          <button
            onClick={() => navigate('/app/settings')}
            className={isActive('/app/settings')
              ? 'flex w-full items-center gap-3 rounded-lg border-l-2 border-white bg-white/15 px-3 py-2.5 text-left text-sm font-medium text-white'
              : 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#d2e4e8] transition-colors hover:bg-white/10 hover:text-white'}
          >
            <Settings size={17} />
            <span>{t('nav.settings')}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#28596b] bg-[#2f6577] px-5">
          {/* Mobile: hamburger */}
          <button
            className="rounded-md p-1.5 text-[#d2e4e8] hover:bg-white/10 lg:hidden"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current" />
          </button>

          {/* Brand on mobile */}
          <span className="text-base font-bold text-white lg:hidden">AnubhavAI</span>

          <div className="flex items-center gap-2 ml-auto">
            {/* Language selector */}
            <div className="flex items-center gap-1.5" aria-label="Choose language">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLangChange(l.code as Language)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3 sm:text-sm
                    ${language === l.code ? 'border-white bg-white text-[#2f6577]' : 'border-white/30 text-white hover:bg-white/10'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Mobile nav overlay */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileNavOpen(false)}>
            <div className="absolute inset-0 bg-black/30" />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-modal">
              <div className="border-b border-white/10 bg-[#2f6577] px-5 py-5">
                <span className="text-xl font-bold text-white">AnubhavAI</span>
              </div>
              <nav className="space-y-0.5 bg-[#2f6577] px-3 py-4">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.key}
                      onClick={() => { navigate(item.path); setMobileNavOpen(false); }}
                      className={active
                        ? 'flex w-full items-center gap-3 rounded-lg border-l-2 border-white bg-white/15 px-3 py-2.5 text-left text-sm font-medium text-white'
                        : 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#d2e4e8] transition-colors hover:bg-white/10 hover:text-white'}
                    >
                      <Icon size={17} />
                      <span>{t(item.label)}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Page content */}
        <main className="app-content flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="flex border-t border-[#28596b] bg-[#2f6577] lg:hidden">
          {[
            { key: 'home', path: '/app', icon: Home },
            { key: 'story', path: '/app/story', icon: Mic },
            { key: 'skills', path: '/app/skills', icon: BookOpen },
            { key: 'opportunities', path: '/app/opportunities', icon: Briefcase },
            { key: 'passport', path: '/app/passport', icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs
                  ${active ? 'text-white' : 'text-[#b9d2d9]'}`}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
