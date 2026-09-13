import { useEffect, useState } from 'react';
import { getAdminSkills } from '../../api/endpoints';

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminSkills()
      .then(setSkills)
      .catch(() => setSkills([
        { id: 1, name: 'Food Production', name_hi: 'खाद्य उत्पादन', name_ta: 'உணவு உற்பத்தி', category: 'Food Production' },
        { id: 2, name: 'Sales', name_hi: 'बिक्री', name_ta: 'விற்பனை', category: 'Sales' },
        { id: 3, name: 'Customer Handling', name_hi: 'ग्राहक प्रबंधन', name_ta: 'வாடிக்கையாளர் சேவை', category: 'Customer Handling' },
      ]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Skills</h1>
      </div>

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-surface-border">
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">English</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Hindi</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Tamil</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Category</th>
              </tr>
            </thead>
            <tbody>
              {skills.map(s => (
                <tr key={s.id} className="border-b border-surface-border hover:bg-gray-50">
                  <td className="px-4 py-3 text-text-muted">{s.id}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{s.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{s.name_hi || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{s.name_ta || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="badge-primary">{s.category}</span>
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
