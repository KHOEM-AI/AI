import { useCallback, useEffect, useState } from 'react';

type Lang = 'km' | 'en' | 'zh';
type A = { at: string; event: string; ip: string | null; action: string; actor: string; message_km: string; message_en: string };
type Alerts = { count: number; alerts: A[] };
type Integ = { ok: boolean; added: string[]; missing: string[]; changed: string[]; checkedAt?: string };

const L: Record<Lang, Record<string, string>> = {
  km: { title: 'ការជូនដំណឹងពីហេក', back: 'ត្រឡប់ក្រោយ', refresh: 'ផ្ទុកឡើងវិញ', attempts: 'ការព្យាយាមគ្មានសិទ្ធិ', last: 'ចុងក្រោយ', files: 'ភាពត្រឹមត្រូវឯកសារ', ok: 'មិនមានការផ្លាស់ប្ដូរ', changed: 'ឯកសារត្រូវបានកែ', clean: '✅ គ្មានការព្យាយាមគ្មានសិទ្ធិថ្មីៗទេ', list: 'ព្រឹត្តិការណ៍', loading: 'កំពុងផ្ទុក...', na: 'មិនអាចឆែកបាន', AUTH_DENY: 'គ្មានសិទ្ធិ', POLICY_DENY: 'ផ្ទុយគោលការណ៍', added: 'បន្ថែម', missing: 'បាត់', mod: 'បានកែ' },
  en: { title: 'Hacker Alerts', back: 'Back', refresh: 'Refresh', attempts: 'Unauthorized attempts', last: 'Latest', files: 'File integrity', ok: 'No changes', changed: 'Files changed', clean: '✅ No recent unauthorized attempts', list: 'Events', loading: 'Loading...', na: 'Cannot check', AUTH_DENY: 'Auth denied', POLICY_DENY: 'Policy denied', added: 'added', missing: 'missing', mod: 'modified' },
  zh: { title: '黑客告警', back: '返回', refresh: '刷新', attempts: '未授权尝试', last: '最近一次', files: '文件完整性', ok: '无变化', changed: '文件被修改', clean: '✅ 暂无新的未授权尝试', list: '事件', loading: '加载中...', na: '无法检查', AUTH_DENY: '认证被拒', POLICY_DENY: '策略拒绝', added: '新增', missing: '缺失', mod: '修改' },
};

async function get(url: string) {
  const r = await fetch(url, { cache: 'no-store' });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j && typeof j === 'object' && 'error' in j ? String(j.error) : `HTTP ${r.status}`);
  return j && typeof j === 'object' && 'result' in j ? j.result : j;
}

export default function KeiHacker({ lang, onBack }: { lang: Lang; onBack: () => void }) {
  const t = L[lang];
  const [al, setAl] = useState<Alerts | null>(null);
  const [aerr, setAerr] = useState('');
  const [integ, setInteg] = useState<Integ | null>(null);
  const [ierr, setIerr] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [a, i] = await Promise.allSettled([get('/api/security/alerts'), get('/api/integrity')]);
    if (a.status === 'fulfilled') { setAl(a.value as Alerts); setAerr(''); }
    else { setAl(null); setAerr(String(a.reason?.message ?? a.reason)); }
    if (i.status === 'fulfilled') { setInteg(i.value as Integ); setIerr(''); }
    else { setInteg(null); setIerr(String(i.reason?.message ?? i.reason)); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const last = al?.alerts?.[0]?.at;
  const files: [string, string][] = integ
    ? [
        ...(integ.added ?? []).map((f): [string, string] => [t.added, f]),
        ...(integ.missing ?? []).map((f): [string, string] => [t.missing, f]),
        ...(integ.changed ?? []).map((f): [string, string] => [t.mod, f]),
      ]
    : [];

  return (
    <div className="hk">
      <div className="hk-head">
        <button onClick={onBack}>← {t.back}</button>
        <h2>🚨 {t.title}</h2>
        <button onClick={load} disabled={loading}>⟳ {loading ? t.loading : t.refresh}</button>
      </div>

      <section className="kei-cards">
        <div className="card"><span>{t.attempts}</span><b className={al && al.count > 0 ? 'off' : ''}>{al ? al.count : '—'}</b></div>
        <div className="card"><span>{t.last}</span><b style={{ fontSize: 13 }}>{last ?? '—'}</b></div>
        <div className="card">
          <span>{t.files}</span>
          <b className={integ ? (integ.ok ? 'ok' : 'off') : ''}>{integ ? (integ.ok ? '✔' : files.length) : '—'}</b>
          <em>{integ ? (integ.ok ? t.ok : t.changed) : t.na}</em>
        </div>
      </section>

      <section className="panel">
        <h2>{t.list}</h2>
        {aerr && <p className="muted">⚠ {aerr}</p>}
        {al && al.count === 0 && <p className="muted">{t.clean}</p>}
        {al?.alerts.map((a, i) => (
          <div className="hk-row" key={i}>
            <div><span className="lv high">{t[a.event] ?? a.event}</span> <small>{a.at}</small></div>
            <div>{a.ip ?? '—'} · {a.action}</div>
            <small>{lang === 'km' ? a.message_km : a.message_en}</small>
          </div>
        ))}
      </section>

      <section className="panel" style={{ marginTop: 10 }}>
        <h2>{t.files}</h2>
        {ierr && <p className="muted">⚠ {ierr}</p>}
        {integ?.ok && <p className="muted">{t.ok}</p>}
        {files.slice(0, 20).map(([k, f], i) => <div className="hk-files" key={i}>{k}: {f}</div>)}
      </section>
    </div>
  );
}
