import { useEffect, useState } from 'react';
import { getAdminUsers } from '../../api/endpoints';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminUsers()
      .then(setUsers)
      .catch(() => setUsers([
        { id: 1, name: 'Demo User', device_id: 'demo-device-001', district: 'Chennai', language: 'ta', created_at: new Date().toISOString() },
      ]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Users</h1>

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-surface-border">
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">District</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Language</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-surface-border hover:bg-gray-50">
                  <td className="px-4 py-3 text-text-muted">{u.id}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{u.name || 'Anonymous'}</td>
                  <td className="px-4 py-3 text-text-secondary">{u.district || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="badge-primary">{u.language?.toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center py-8 text-text-muted">No users yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
