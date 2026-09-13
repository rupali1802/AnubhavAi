import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  type Node, type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useApp } from '../hooks/useApp';
import { ArrowRight } from 'lucide-react';

const experienceNodeStyle = {
  background: '#4338CA', color: '#fff', border: 'none',
  borderRadius: '12px', padding: '10px 16px', fontWeight: 600, fontSize: '13px',
};
const skillNodeStyle = (level: string) => ({
  background: level === 'high' ? '#dcfce7' : '#fef9c3',
  color: level === 'high' ? '#16a34a' : '#ca8a04',
  border: `1px solid ${level === 'high' ? '#86efac' : '#fde047'}`,
  borderRadius: '10px', padding: '8px 14px', fontWeight: 500, fontSize: '12px',
});
const sectorNodeStyle = {
  background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd',
  borderRadius: '10px', padding: '8px 14px', fontWeight: 500, fontSize: '12px',
};

export default function SkillGraphPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { skills, language, currentTranscript } = useApp();

  const getSkillName = (s: any) => {
    if (language === 'hi' && s.name_hi) return s.name_hi;
    if (language === 'ta' && s.name_ta) return s.name_ta;
    return s.name;
  };

  const displaySkills = skills.length > 0 ? skills : [
    { name: 'Baking & Cake Decoration', name_hi: 'बेकिंग और केक सजावट', name_ta: 'பேக்கிங் மற்றும் கேக் அலங்காரம்', category: 'Baking & Confectionery', confidence_level: 'high' },
    { name: 'Tailoring & Garment Construction', name_hi: 'सिलाई और वस्त्र निर्माण', name_ta: 'தையல் மற்றும் ஆடை தயாரிப்பு', category: 'Textile & Apparel', confidence_level: 'high' },
    { name: 'Bridal & Event Makeup Artistry', name_hi: 'ब्राइडल व इवेंट मेकअप', name_ta: 'மணப்பெண் மேக்கப்', category: 'Personal Care & Beauty', confidence_level: 'high' },
    { name: 'Commercial Culinary Cooking', name_hi: 'व्यावसायिक पाक कला', name_ta: 'வணிக சமையல்', category: 'Food Production', confidence_level: 'medium' },
  ];

  const primaryCategory = displaySkills[0]?.category || 'Micro-Enterprise & Vocational Sector';

  const expLabel = currentTranscript
    ? (currentTranscript.length > 45 ? currentTranscript.slice(0, 45) + '...' : currentTranscript)
    : (language === 'ta' ? 'செயல்முறை பணி அனுபவம்' : language === 'hi' ? 'व्यावहारिक कार्य अनुभव' : 'Practical Work Experience');

  const sectorLabel = `${primaryCategory} Sector`;

  // Build nodes
  const initialNodes: Node[] = [
    {
      id: 'exp',
      position: { x: 300, y: 20 },
      data: { label: expLabel },
      style: experienceNodeStyle,
    },
    ...displaySkills.map((s, i) => ({
      id: `skill-${i}`,
      position: { x: 80 + (i % 3) * 200, y: 160 + Math.floor(i / 3) * 120 },
      data: { label: getSkillName(s) },
      style: skillNodeStyle(s.confidence_level),
    })),
    {
      id: 'sector',
      position: { x: 260, y: 420 },
      data: { label: sectorLabel },
      style: sectorNodeStyle,
    },
  ];

  const initialEdges: Edge[] = [
    ...displaySkills.map((_, i) => ({
      id: `e-exp-${i}`,
      source: 'exp',
      target: `skill-${i}`,
      type: 'smoothstep',
      style: { stroke: '#c7d2fe', strokeWidth: 1.5 },
    })),
    ...displaySkills.map((_, i) => ({
      id: `e-${i}-sector`,
      source: `skill-${i}`,
      target: 'sector',
      type: 'smoothstep',
      style: { stroke: '#e0f2fe', strokeWidth: 1.5 },
    })),
  ];

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="flex flex-col h-screen">
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-bold text-text-primary">{t('graph.title')}</h1>
        <p className="text-text-secondary text-sm mt-1">{t('graph.subtitle')}</p>
      </div>

      <div className="flex-1 m-6 rounded-xl border border-surface-border overflow-hidden bg-white shadow-card">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="#f1f5f9" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      <div className="px-6 pb-6 flex gap-3">
        <button onClick={() => navigate('/app/skills')} className="btn-secondary">
          {t('common.back')}
        </button>
        <button onClick={() => navigate('/app/verify')} className="btn-primary">
          {t('skills.verifySkill')} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
