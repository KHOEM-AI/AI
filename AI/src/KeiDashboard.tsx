import { useEffect, useState } from 'react';
import './KeiDashboard.css';
import KeiHacker from './KeiHacker';
import KeiEit from './KeiEit';

type Lang = 'km' | 'en' | 'zh';
type Al = { at: string; event: string; ip: string | null; action: string; actor: string; message_km: string; message_en: string };
type Alerts = { count: number; alerts: Al[] };
type Status = {
  services?: { running: number; total: number };
  network?: string; ai?: string;
  devices?: { connected: number; total: number };
  subs?: Record<string, boolean | null>;
  ready?: string[];
};

const NAMES: Record<Lang, string> = { km: 'ខ្មែរ', en: 'English', zh: '中文' };
const T: Record<Lang, Record<string, string>> = {
  km: { ready: 'ត្រៀមរួច', title: 'ប្រព័ន្ធ AI និងសុវត្ថិភាព', dash: 'ផ្ទាំងគ្រប់គ្រងមេ', services: 'សេវាកម្មសរុប', network: 'បណ្ដាញ', ai: 'មជ្ឈមណ្ឌល AI', devices: 'ឧបករណ៍', threat: 'ការរកឃើញការវាយប្រហារ', alerts: 'ព្រឹត្តិការណ៍ថ្មីៗ', none: 'គ្មានទិន្នន័យពិត', online: 'ដំណើរការ', offline: 'មិនទាន់ភ្ជាប់', running: 'កំពុងដំណើរការ', connected: 'បានភ្ជាប់', sub: 'ប្រព័ន្ធរងទាំងអស់', reload: 'ផ្ទុកឡើងវិញ', attempts: 'ការព្យាយាមគ្មានសិទ្ធិ', last: 'ចុងក្រោយ', clean: '✅ គ្មានការព្យាយាមគ្មានសិទ្ធិថ្មីៗទេ' },
  en: { ready: 'Ready', title: 'AI & Security System', dash: 'Main Dashboard', services: 'Total Services', network: 'Network', ai: 'AI Center', devices: 'Devices', threat: 'Threat Detection', alerts: 'Latest Alerts', none: 'No real data', online: 'Online', offline: 'Not connected', running: 'Running', connected: 'Connected', sub: 'All Subsystems', reload: 'Reload', attempts: 'Unauthorized attempts', last: 'Latest', clean: '✅ No recent unauthorized attempts' },
  zh: { ready: '就绪', title: 'AI 与安全系统', dash: '主控制台', services: '服务总数', network: '网络', ai: 'AI 中心', devices: '设备', threat: '威胁检测', alerts: '最新告警', none: '暂无真实数据', online: '在线', offline: '未连接', running: '运行中', connected: '已连接', sub: '全部子系统', reload: '刷新', attempts: '未授权尝试', last: '最近一次', clean: '✅ 暂无新的未授权尝试' },
};
const SUBS = ['KI API', 'AI UI', 'IQ-AI', 'KSV', 'khoem-now', 'KHOEM_AI', 'KEI', 'EI-T'];
const HK: Record<Lang, string> = { km: 'ហេក', en: 'Hacker', zh: '黑客' };

const fmt = (s: string) => {
  const d = new Date(s);
  return isNaN(+d) ? s : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function Flag({ c }: { c: Lang }) {
  if (c === 'km') return (
    <svg viewBox="0 0 30 20" width="30" height="20"><rect width="30" height="20" fill="#032ea1" /><rect y="5" width="30" height="10" fill="#e00025" /><path d="M9 13.5h12v-1.5h-1.5V10.5H18V9h-1.5V7.5H16V6h-2v1.5h-.5V9H12v1.5h-1.5V12H9z" fill="#fff" /></svg>
  );
  if (c === 'zh') return (
    <svg viewBox="0 0 30 20" width="30" height="20"><rect width="30" height="20" fill="#de2910" /><text x="3" y="11" fontSize="9" fill="#ffde00">★</text></svg>
  );
  return (
    <svg viewBox="0 0 60 40" width="30" height="20"><rect width="60" height="40" fill="#012169" /><path d="M0 0L60 40M60 0L0 40" stroke="#fff" strokeWidth="8" /><path d="M0 0L60 40M60 0L0 40" stroke="#c8102e" strokeWidth="3" /><path d="M30 0V40M0 20H60" stroke="#fff" strokeWidth="12" /><path d="M30 0V40M0 20H60" stroke="#c8102e" strokeWidth="7" /></svg>
  );
}

function Shield() {
  return (
    <svg viewBox="0 0 48 56" width="34" height="40" aria-hidden="true">
      <defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4aa3ff" /><stop offset="1" stopColor="#1e3fff" /></linearGradient></defs>
      <path d="M24 2 44 10v18c0 12-8 21-20 26C12 49 4 40 4 28V10z" fill="#0a1a44" stroke="url(#kg)" strokeWidth="3" />
      <path d="M24 12 36 17v10c0 8-5 13-12 17-7-4-12-9-12-17V17z" fill="url(#kg)" opacity=".85" />
      <path d="M17 27l5 5 9-10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function KeiDashboard() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('kei.lang') as Lang) || 'km');
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<'home' | 'hacker' | 'eit'>('home');
  const [st, setSt] = useState<Status | null>(null);
  const [al, setAl] = useState<Alerts | null>(null);
  const t = T[lang];

  const load = () =>
    fetch('/api/kei/status').then(r => (r.ok ? r.json() : null)).then(setSt).catch(() => setSt(null));
  // alerts: fetched once (open + reload button), never on a timer
  const loadAl = () =>
    fetch('/api/security/alerts', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => setAl(j ? ((j.result ?? j) as Alerts) : null))
      .catch(() => setAl(null));
  useEffect(() => { load(); const i = setInterval(load, 10000); return () => clearInterval(i); }, []);
  useEffect(() => { loadAl(); }, []);
  useEffect(() => { localStorage.setItem('kei.lang', lang); document.documentElement.lang = lang; }, [lang]);

  const on = !!st;
  const list = al?.alerts?.slice(0, 5) ?? [];
  const msg = (a: Al) => (lang === 'km' ? a.message_km : a.message_en);
  const sv = st?.services ? `${st.services.running}/${st.services.total}` : '—';
  const dv = st?.devices ? `${st.devices.connected}/${st.devices.total}` : '—';

  return (
    <div className="kei">
      <header className="kei-top">
        <div className="kei-logo"><Shield /><div><b>KHOEM-AI</b><small>{t.title}</small></div></div>
        <h1>{t.dash}</h1>
        <button className="hkbtn" onClick={() => setScreen('hacker')}>🚨 {HK[lang]}</button>
        <button className="eitbtn" onClick={() => setScreen('eit')}>🔢 EI-T</button>
        <div className="kei-lang">
          <button className="flagbtn" onClick={() => setOpen(o => !o)} aria-label="language"><Flag c="en" /></button>
          {open && (
            <div className="kei-langmenu">
              {(['km', 'en', 'zh'] as Lang[]).map(l => (
                <button key={l} className={l === lang ? 'on' : ''} onClick={() => { setLang(l); setOpen(false); }}>
                  <Flag c={l} /> {NAMES[l]}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      {screen === 'hacker' ? <KeiHacker lang={lang} onBack={() => setScreen('home')} /> : screen === 'eit' ? <KeiEit lang={lang} onBack={() => setScreen('home')} /> : (<>
      <section className="kei-cards">
        <div className="card"><span>{t.services}</span><b>{sv}</b><em>{t.running}</em></div>
        <div className="card"><span>{t.network}</span><b>{st?.network ?? '—'}</b></div>
        <div className="card"><span>{t.ai}</span><b>{st?.ai ?? '—'}</b></div>
        <div className="card"><span>{t.devices}</span><b>{dv}</b><em>{t.connected}</em></div>
        <div className={'card state ' + (on ? 'ok' : 'off')}>{on ? t.online : t.offline}</div>
      </section>

      <section className="kei-grid">
        <div className="panel">
          <h2>{t.threat}</h2>
          {al === null && <p className="muted">{t.none}</p>}
          {al && al.count === 0 && <p className="muted">{t.clean}</p>}
          {al && al.count > 0 && (<>
            <p><b className="off" style={{ fontSize: 24 }}>{al.count}</b> <span className="muted">{t.attempts}</span></p>
            <p className="muted">{t.last}: {fmt(al.alerts[0].at)}</p>
            <p style={{ fontSize: 13, overflowWrap: 'anywhere' }}>{msg(al.alerts[0])}</p>
          </>)}
        </div>
        <div className="panel">
          <h2>{t.alerts}</h2>
          {list.length === 0 && <p className="muted">{al ? t.clean : t.none}</p>}
          {list.map((a, i) => (
            <div className="row" key={i}>
              <span>{fmt(a.at)}</span>
              <span className={'lv ' + (a.event === 'AUTH_DENY' ? 'high' : 'medium')}>{a.event === 'AUTH_DENY' ? 'High' : 'Medium'}</span>
              <span>{a.action}<small>{a.ip ?? '—'}</small></span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>{t.sub}</h2>
        <div className="subs">
          {SUBS.map(s => {
            const v = st?.subs?.[s];
            return (
              <div className="sub" key={s}>{s}
                <em className={v === true ? 'ok' : v === false ? 'off' : ''}>{v === true ? (st?.ready?.includes(s) ? t.ready : t.online) : v === false ? t.offline : '—'}</em>
              </div>
            );
          })}
        </div>
      </section>
      <button className="reload" onClick={() => { load(); loadAl(); }}>⟳ {t.reload}</button>
      </>)}
    </div>
  );
}
