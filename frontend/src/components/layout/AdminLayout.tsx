import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Building2, LogOut } from 'lucide-react';

const ADMIN_NAV = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/skills', label: 'Skills', icon: BookOpen },
  { path: '/admin/schemes', label: 'Schemes', icon: Building2 },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  // Auth guard
  const token = localStorage.getItem('admin_token');
  if (!token) {
    navigate('/admin/login');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 bg-gray-900 flex flex-col">
        <div className="px-5 py-5">
          <span className="text-white font-bold text-lg">AnubhavAI</span>
          <p className="text-gray-400 text-xs mt-0.5">Admin Portal</p>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-primary-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-3 py-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                       text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
