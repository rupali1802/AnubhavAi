import { useEffect, useState } from 'react';
import { getAdminStats, getAdminActivity } from '../../api/endpoints';
import type { AdminStats } from '../../types';
import { Users, BookOpen, ShieldCheck, Briefcase } from 'lucide-react';

const DEMO_STATS: AdminStats = {
  total_users: 1247,
  total_experiences: 3892,
  total_skills_discovered: 12450,
  total_skills_verified: 4310,
  total_opportunities_matched: 2960,
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>(DEMO_STATS);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => setStats(DEMO_STATS));
    getAdminActivity().then(setActivity).catch(() => {});
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.total_users, icon: Users, color: 'bg-primary-50 text-primary-700' },
    { label: 'Skills Discovered', value: stats.total_skills_discovered.toLocaleString(), icon: BookOpen, color: 'bg-success-50 text-success-700' },
    { label: 'Skills Verified', value: stats.total_skills_verified.toLocaleString(), icon: ShieldCheck, color: 'bg-warning-50 text-warning-700' },
    { label: 'Opportunities Matched', value: stats.total_opportunities_matched.toLocaleString(), icon: Briefcase, color: 'bg-blue-50 text-blue-700' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Admin Dashboard</h1>
      <p className="text-text-secondary text-sm mb-8">AnubhavAI Platform Overview</p>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card">
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-text-primary">{card.value}</p>
              <p className="text-xs text-text-muted mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Demo banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
        <p className="text-sm font-medium text-amber-800">
          Demo Mode: Stats shown are seeded demo data. Connect a live database for real metrics.
        </p>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Manage Users', path: '/admin/users' },
          { label: 'Manage Skills', path: '/admin/skills' },
          { label: 'Manage Schemes', path: '/admin/schemes' },
        ].map(item => (
          <a
            key={item.label}
            href={item.path}
            className="card-hover text-center py-4"
          >
            <p className="text-sm font-semibold text-text-primary">{item.label}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
