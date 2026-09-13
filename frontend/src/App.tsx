import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppContext, useAppState } from './hooks/useApp';
import AppLayout from './components/layout/AppLayout';
import AdminLayout from './components/layout/AdminLayout';
import OfflineBanner from './components/layout/OfflineBanner';
import VoiceBuddy from './components/voice/VoiceBuddy';

// Pages
import LandingPage from './pages/LandingPage';
import LanguagePage from './pages/LanguagePage';
import DashboardPage from './pages/DashboardPage';
import VoiceInputPage from './pages/VoiceInputPage';
import TranscriptPage from './pages/TranscriptPage';
import SkillsDiscoveredPage from './pages/SkillsDiscoveredPage';
import SkillGraphPage from './pages/SkillGraphPage';
import VerificationPage from './pages/VerificationPage';
import VerificationResultPage from './pages/VerificationResultPage';
import SkillGapPage from './pages/SkillGapPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import PathPage from './pages/PathPage';
import PassportPage from './pages/PassportPage';
import SettingsPage from './pages/SettingsPage';
import RecruiterPage from './pages/RecruiterPage';

// Admin
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSkillsPage from './pages/admin/AdminSkillsPage';
import AdminSchemesPage from './pages/admin/AdminSchemesPage';

export default function App() {
  const appState = useAppState();

  return (
    <AppContext.Provider value={appState}>
      <BrowserRouter>
        <OfflineBanner />
        <RouteAwareVoiceBuddy />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/language" element={<LanguagePage />} />
          <Route path="/recruiter" element={<RecruiterPage />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="skills" element={<AdminSkillsPage />} />
            <Route path="schemes" element={<AdminSchemesPage />} />
          </Route>

          {/* Main app routes */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="story" element={<VoiceInputPage />} />
            <Route path="transcript" element={<TranscriptPage />} />
            <Route path="skills" element={<SkillsDiscoveredPage />} />
            <Route path="graph" element={<SkillGraphPage />} />
            <Route path="verify" element={<VerificationPage />} />
            <Route path="verify/result" element={<VerificationResultPage />} />
            <Route path="gap" element={<SkillGapPage />} />
            <Route path="opportunities" element={<OpportunitiesPage />} />
            <Route path="path" element={<PathPage />} />
            <Route path="passport" element={<PassportPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

function RouteAwareVoiceBuddy() {
  const location = useLocation();
  return location.pathname === '/' ? null : <VoiceBuddy />;
}
