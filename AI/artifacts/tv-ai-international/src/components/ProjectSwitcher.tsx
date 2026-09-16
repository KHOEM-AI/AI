import React from 'react';

type ProjectType = 'ksv' | 'cai' | 'ai';

interface ProjectSwitcherProps {
  activeProject?: ProjectType;
  current?: 'KSV' | 'CAI' | 'AI';
}

const PROJECTS: Record<ProjectType, { url: string; label: string; sub: string }> = {
  ksv: { url: 'http://localhost:5173', label: 'KSV', sub: 'Safety control device' },
  cai: { url: 'http://localhost:5174', label: 'CAI', sub: 'Scan Overview & Count' },
  ai:  { url: 'http://localhost:5176', label: 'AI TV', sub: 'online & 24/7' },
};

export default function ProjectSwitcher({ activeProject, current }: ProjectSwitcherProps) {
  const normalized: ProjectType =
    activeProject ?? (current ? (current.toLowerCase() as ProjectType) : 'ksv');

  const others = (Object.keys(PROJECTS) as ProjectType[]).filter((key) => key !== normalized);

  return (
    <div className="tv-panel" style={{ marginTop: '16px', padding: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
        SWITCH PROJECT
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {others.map((key) => (
          <a
            key={key}
            href={PROJECTS[key].url}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              color: '#e2e8f0',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxSizing: 'border-box',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <span>{PROJECTS[key].label}</span>
            <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 400 }}>{PROJECTS[key].sub}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
