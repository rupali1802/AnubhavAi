import { useEffect, useState } from 'react';
import { getAdminSchemes, deleteScheme } from '../../api/endpoints';

export default function AdminSchemesPage() {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getAdminSchemes()
      .then(setSchemes)
      .catch(() => setSchemes([
        { id: 1, name: 'PM FME Scheme', category: 'Food & Beverages', district: 'Chennai', is_demo: true, active: true },
        { id: 2, name: 'MUDRA Loan — Shishu', category: 'Finance', district: 'Chennai', is_demo: true, active: true },
      ]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this scheme?')) return;
    await deleteScheme(id);
    load();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Schemes</h1>
      </div>

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-surface-border">
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">District</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Demo</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Active</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schemes.map(s => (
                <tr key={s.id} className="border-b border-surface-border hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-text-primary max-w-xs truncate">{s.name}</td>
                  <td className="px-4 py-3"><span className="badge-primary">{s.category}</span></td>
                  <td className="px-4 py-3 text-text-secondary">{s.district || '—'}</td>
                  <td className="px-4 py-3">
                    {s.is_demo ? <span className="badge bg-amber-50 text-amber-700">Demo</span> : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${s.active ? 'badge-high' : 'bg-gray-100 text-gray-500'}`}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-xs text-danger-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
