import { useEffect, useState } from 'react';
import MenuGlyph from './components/MenuGlyph';

type P = { name: string; protected: boolean; covered: number; onDisk: number; outside: number; created: string | null; capped?: boolean };
type R = { projects: P[]; protectedProjects: number; totalProjects: number; filesCovered: number; filesOnDisk: number };

const pc = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export default function KeiProtect({ t, onBack }: { t: Record<string, string>; onBack: () => void }) {
  const [d, setD] = useState<R | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setBusy(true);
    fetch('/api/kei/protection', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then(j => { setD(j as R); setErr(''); })
      .catch(e => { setD(null); setErr(String(e?.message ?? e)); })
      .finally(() => setBusy(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="hk">
      <div className="hk-head">
        <button onClick={onBack}>← {t.back}</button>
        <h2 className="pr-title" style={{ color: '#7db8ff' }}><span className="kd-icon"><MenuGlyph name="shield" /></span> {t.pTitle}</h2>
        <button onClick={load} disabled={busy}>⟳ {t.reload}</button>
      </div>
      {err && <p className="muted"><span className="kd-icon"><MenuGlyph name="safety" /></span> {err}</p>}
      {d && (<>
        <section className="kei-cards">
          <div className="card"><span>{t.pCover}</span><b className={d.protectedProjects === d.totalProjects ? 'ok' : 'off'}>{d.protectedProjects}/{d.totalProjects}</b><em>{pc(d.protectedProjects, d.totalProjects)}%</em></div>
          <div className="card"><span>{t.pTotal}</span><b>{d.filesCovered}</b><em>/ {d.filesOnDisk} · {pc(d.filesCovered, d.filesOnDisk)}%</em></div>
        </section>
        <section className="panel">
          {d.projects.map(p => (
            <div className="pr-row" key={p.name}>
              <div className="pr-top"><b>{p.name}</b><span className={'badge ' + (p.protected ? 'ok' : 'off')}>{p.protected ? t.pProt : t.pNot}</span></div>
              <div className="bar"><i style={{ width: pc(p.covered, p.onDisk) + '%' }} /></div>
              <small>{p.covered}/{p.onDisk} {t.pFiles}{p.protected && p.created ? ' · ' + p.created.slice(0, 10) : ''}</small>
            </div>
          ))}
        </section>
      </>)}
    </div>
  );
}
