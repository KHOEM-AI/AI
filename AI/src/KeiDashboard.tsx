import { useEffect, useState } from 'react';
import './KeiDashboard.css';
import KeiHacker from './KeiHacker';
import KeiEit from './KeiEit';
import KeiProtect from './KeiProtect';
import MenuGlyph from './components/MenuGlyph';

type L3 = 'km' | 'en' | 'zh';
type Lang = L3 | 'th' | 'lo' | 'my' | 'vi' | 'fr' | 'es' | 'ar' | 'pt' | 'hi' | 'ru';
type Dict = Record<string, string>;
type Al = { at: string; event: string; ip: string | null; action: string; actor: string; message_km: string; message_en: string };
type Alerts = { count: number; alerts: Al[] };
type Status = {
  services?: { running: number; total: number };
  network?: string; ai?: string;
  devices?: { connected: number; total: number };
  subs?: Record<string, boolean | null>;
  ready?: string[];
};

const LANGS: { code: Lang; name: string }[] = [
  { code: 'km', name: 'ខ្មែរ' }, { code: 'en', name: 'English' }, { code: 'zh', name: '中文' },
  { code: 'th', name: 'ไทย' }, { code: 'lo', name: 'ລາວ' }, { code: 'my', name: 'မြန်မာ' },
  { code: 'vi', name: 'Tiếng Việt' }, { code: 'fr', name: 'Français' }, { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' }, { code: 'ru', name: 'Русский' }, { code: 'ar', name: 'العربية' }, { code: 'hi', name: 'हिन्दी' },
];

const BASE: Record<L3, Dict> = {
  km: { ready: 'ត្រៀមរួច', title: 'ប្រព័ន្ធ AI និងសុវត្ថិភាព', dash: 'ផ្ទាំងគ្រប់គ្រងមេ', services: 'សេវាកម្មសរុប', network: 'បណ្ដាញ', ai: 'មជ្ឈមណ្ឌល AI', devices: 'ឧបករណ៍', threat: 'ការរកឃើញការវាយប្រហារ', alerts: 'ព្រឹត្តិការណ៍ថ្មីៗ', none: 'គ្មានទិន្នន័យពិត', online: 'ដំណើរការ', offline: 'មិនទាន់ភ្ជាប់', running: 'កំពុងដំណើរការ', connected: 'បានភ្ជាប់', sub: 'ប្រព័ន្ធរងទាំងអស់', reload: 'ផ្ទុកឡើងវិញ', attempts: 'ការព្យាយាមគ្មានសិទ្ធិ', last: 'ចុងក្រោយ', clean: '✅ គ្មានការព្យាយាមគ្មានសិទ្ធិថ្មីៗទេ', prot: 'ការពារ', pTitle: 'ប្រព័ន្ធការពារ', pProt: 'បានការពារ', pNot: 'មិនទាន់ការពារ', pFiles: 'ឯកសារ', pCover: 'គម្រោងបានការពារ', pTotal: 'ឯកសារបានការពារ', back: 'ត្រឡប់ក្រោយ' },
  en: { ready: 'Ready', title: 'AI & Security System', dash: 'Main Dashboard', services: 'Total Services', network: 'Network', ai: 'AI Center', devices: 'Devices', threat: 'Threat Detection', alerts: 'Latest Alerts', none: 'No real data', online: 'Online', offline: 'Not connected', running: 'Running', connected: 'Connected', sub: 'All Subsystems', reload: 'Reload', attempts: 'Unauthorized attempts', last: 'Latest', clean: '✅ No recent unauthorized attempts', prot: 'Protection', pTitle: 'Protection System', pProt: 'Protected', pNot: 'Not protected', pFiles: 'files', pCover: 'Projects protected', pTotal: 'Files protected', back: 'Back' },
  zh: { ready: '就绪', title: 'AI 与安全系统', dash: '主控制台', services: '服务总数', network: '网络', ai: 'AI 中心', devices: '设备', threat: '威胁检测', alerts: '最新告警', none: '暂无真实数据', online: '在线', offline: '未连接', running: '运行中', connected: '已连接', sub: '全部子系统', reload: '刷新', attempts: '未授权尝试', last: '最近一次', clean: '✅ 暂无新的未授权尝试', prot: '防护', pTitle: '防护系统', pProt: '已防护', pNot: '未防护', pFiles: '个文件', pCover: '已防护项目', pTotal: '已防护文件', back: '返回' },
};

// Other languages: unlisted keys fall back to English.
const MORE: Partial<Record<Lang, Dict>> = {
  th: { ready: 'พร้อม', title: 'ระบบ AI และความปลอดภัย', dash: 'แผงควบคุมหลัก', services: 'บริการทั้งหมด', network: 'เครือข่าย', ai: 'ศูนย์ AI', devices: 'อุปกรณ์', threat: 'การตรวจจับภัยคุกคาม', alerts: 'การแจ้งเตือนล่าสุด', none: 'ไม่มีข้อมูลจริง', online: 'ออนไลน์', offline: 'ไม่ได้เชื่อมต่อ', running: 'กำลังทำงาน', connected: 'เชื่อมต่อแล้ว', sub: 'ระบบย่อยทั้งหมด', reload: 'โหลดใหม่', attempts: 'ความพยายามที่ไม่ได้รับอนุญาต', last: 'ล่าสุด', clean: '✅ ไม่มีความพยายามที่ไม่ได้รับอนุญาตล่าสุด', prot: 'การป้องกัน', pTitle: 'ระบบป้องกัน', pProt: 'ป้องกันแล้ว', pNot: 'ยังไม่ได้ป้องกัน', pFiles: 'ไฟล์', pCover: 'โปรเจกต์ที่ป้องกัน', pTotal: 'ไฟล์ที่ป้องกัน', back: 'กลับ' },
  lo: { ready: 'ພ້ອມ', title: 'ລະບົບ AI ແລະຄວາມປອດໄພ', dash: 'ແຜງຄວບຄຸມຫຼັກ', services: 'ບໍລິການທັງໝົດ', network: 'ເຄືອຂ່າຍ', ai: 'ສູນ AI', devices: 'ອຸປະກອນ', threat: 'ການກວດຫາໄພຄຸກຄາມ', alerts: 'ການແຈ້ງເຕືອນຫຼ້າສຸດ', none: 'ບໍ່ມີຂໍ້ມູນຈິງ', online: 'ອອນລາຍ', offline: 'ບໍ່ໄດ້ເຊື່ອມຕໍ່', running: 'ກຳລັງເຮັດວຽກ', connected: 'ເຊື່ອມຕໍ່ແລ້ວ', sub: 'ລະບົບຍ່ອຍທັງໝົດ', reload: 'ໂຫຼດໃໝ່', attempts: 'ຄວາມພະຍາຍາມທີ່ບໍ່ໄດ້ຮັບອະນຸຍາດ', last: 'ຫຼ້າສຸດ', clean: '✅ ບໍ່ມີຄວາມພະຍາຍາມທີ່ບໍ່ໄດ້ຮັບອະນຸຍາດຫຼ້າສຸດ', prot: 'ການປ້ອງກັນ', pTitle: 'ລະບົບປ້ອງກັນ', pProt: 'ປ້ອງກັນແລ້ວ', pNot: 'ຍັງບໍ່ໄດ້ປ້ອງກັນ', pFiles: 'ໄຟລ໌', pCover: 'ໂປຣເຈັກທີ່ປ້ອງກັນ', pTotal: 'ໄຟລ໌ທີ່ປ້ອງກັນ', back: 'ກັບຄືນ' },
  my: { ready: 'အဆင်သင့်', title: 'AI နှင့် လုံခြုံရေးစနစ်', dash: 'ပင်မထိန်းချုပ်မှုဘုတ်', services: 'ဝန်ဆောင်မှု စုစုပေါင်း', network: 'ကွန်ရက်', ai: 'AI ဌာန', devices: 'ကိရိယာများ', threat: 'ခြိမ်းခြောက်မှု ရှာဖွေခြင်း', alerts: 'နောက်ဆုံး သတိပေးချက်များ', none: 'အစစ်အမှန် ဒေတာ မရှိပါ', online: 'အွန်လိုင်း', offline: 'မချိတ်ဆက်ရသေးပါ', running: 'အလုပ်လုပ်နေသည်', connected: 'ချိတ်ဆက်ထားသည်', sub: 'စနစ်ခွဲများ အားလုံး', reload: 'ပြန်လည်ဖွင့်ရန်', attempts: 'ခွင့်ပြုချက်မရှိ ကြိုးစားမှုများ', last: 'နောက်ဆုံး', clean: '✅ မကြာသေးမီက ခွင့်ပြုချက်မရှိ ကြိုးစားမှု မရှိပါ', prot: 'ကာကွယ်မှု', pTitle: 'ကာကွယ်ရေးစနစ်', pProt: 'ကာကွယ်ထားသည်', pNot: 'မကာကွယ်ရသေးပါ', pFiles: 'ဖိုင်များ', pCover: 'ကာကွယ်ထားသော ပရောဂျက်များ', pTotal: 'ကာကွယ်ထားသော ဖိုင်များ', back: 'နောက်သို့' },
  vi: { ready: 'Sẵn sàng', title: 'Hệ thống AI & Bảo mật', dash: 'Bảng điều khiển chính', services: 'Tổng dịch vụ', network: 'Mạng', ai: 'Trung tâm AI', devices: 'Thiết bị', threat: 'Phát hiện mối đe dọa', alerts: 'Cảnh báo mới nhất', none: 'Không có dữ liệu thật', online: 'Trực tuyến', offline: 'Chưa kết nối', running: 'Đang chạy', connected: 'Đã kết nối', sub: 'Tất cả hệ thống con', reload: 'Tải lại', attempts: 'Lần thử trái phép', last: 'Gần nhất', clean: '✅ Không có lần thử trái phép gần đây', prot: 'Bảo vệ', pTitle: 'Hệ thống bảo vệ', pProt: 'Đã bảo vệ', pNot: 'Chưa bảo vệ', pFiles: 'tệp', pCover: 'Dự án được bảo vệ', pTotal: 'Tệp được bảo vệ', back: 'Quay lại' },
  fr: { ready: 'Prêt', title: 'Système IA et sécurité', dash: 'Tableau de bord principal', services: 'Services totaux', network: 'Réseau', ai: 'Centre IA', devices: 'Appareils', threat: 'Détection des menaces', alerts: 'Dernières alertes', none: 'Aucune donnée réelle', online: 'En ligne', offline: 'Non connecté', running: 'En cours', connected: 'Connectés', sub: 'Tous les sous-systèmes', reload: 'Recharger', attempts: 'Tentatives non autorisées', last: 'Dernière', clean: '✅ Aucune tentative non autorisée récente', prot: 'Protection', pTitle: 'Système de protection', pProt: 'Protégé', pNot: 'Non protégé', pFiles: 'fichiers', pCover: 'Projets protégés', pTotal: 'Fichiers protégés', back: 'Retour' },
  es: { ready: 'Listo', title: 'Sistema de IA y seguridad', dash: 'Panel principal', services: 'Servicios totales', network: 'Red', ai: 'Centro de IA', devices: 'Dispositivos', threat: 'Detección de amenazas', alerts: 'Últimas alertas', none: 'Sin datos reales', online: 'En línea', offline: 'No conectado', running: 'En ejecución', connected: 'Conectados', sub: 'Todos los subsistemas', reload: 'Recargar', attempts: 'Intentos no autorizados', last: 'Último', clean: '✅ Sin intentos no autorizados recientes', prot: 'Protección', pTitle: 'Sistema de protección', pProt: 'Protegido', pNot: 'No protegido', pFiles: 'archivos', pCover: 'Proyectos protegidos', pTotal: 'Archivos protegidos', back: 'Volver' },
  pt: { ready: 'Pronto', title: 'Sistema de IA e segurança', dash: 'Painel principal', services: 'Serviços totais', network: 'Rede', ai: 'Centro de IA', devices: 'Dispositivos', threat: 'Detecção de ameaças', alerts: 'Últimos alertas', none: 'Sem dados reais', online: 'Online', offline: 'Não conectado', running: 'Em execução', connected: 'Conectados', sub: 'Todos os subsistemas', reload: 'Recarregar', attempts: 'Tentativas não autorizadas', last: 'Mais recente', clean: '✅ Nenhuma tentativa não autorizada recente', prot: 'Proteção', pTitle: 'Sistema de proteção', pProt: 'Protegido', pNot: 'Não protegido', pFiles: 'arquivos', pCover: 'Projetos protegidos', pTotal: 'Arquivos protegidos', back: 'Voltar' },
  ru: { ready: 'Готово', title: 'Система ИИ и безопасности', dash: 'Главная панель', services: 'Всего служб', network: 'Сеть', ai: 'Центр ИИ', devices: 'Устройства', threat: 'Обнаружение угроз', alerts: 'Последние оповещения', none: 'Нет реальных данных', online: 'В сети', offline: 'Не подключено', running: 'Работает', connected: 'Подключено', sub: 'Все подсистемы', reload: 'Обновить', attempts: 'Несанкционированные попытки', last: 'Последняя', clean: '✅ Недавних несанкционированных попыток нет', prot: 'Защита', pTitle: 'Система защиты', pProt: 'Защищено', pNot: 'Не защищено', pFiles: 'файлов', pCover: 'Защищённые проекты', pTotal: 'Защищённые файлы', back: 'Назад' },
  ar: { ready: 'جاهز', title: 'نظام الذكاء الاصطناعي والأمان', dash: 'لوحة التحكم الرئيسية', services: 'إجمالي الخدمات', network: 'الشبكة', ai: 'مركز الذكاء الاصطناعي', devices: 'الأجهزة', threat: 'كشف التهديدات', alerts: 'أحدث التنبيهات', none: 'لا توجد بيانات حقيقية', online: 'متصل', offline: 'غير متصل', running: 'قيد التشغيل', connected: 'متصلة', sub: 'جميع الأنظمة الفرعية', reload: 'إعادة تحميل', attempts: 'محاولات غير مصرح بها', last: 'الأحدث', clean: '✅ لا توجد محاولات غير مصرح بها حديثًا', prot: 'الحماية', pTitle: 'نظام الحماية', pProt: 'محمي', pNot: 'غير محمي', pFiles: 'ملفات', pCover: 'المشاريع المحمية', pTotal: 'الملفات المحمية', back: 'رجوع' },
  hi: { ready: 'तैयार', title: 'AI और सुरक्षा प्रणाली', dash: 'मुख्य डैशबोर्ड', services: 'कुल सेवाएँ', network: 'नेटवर्क', ai: 'AI केंद्र', devices: 'डिवाइस', threat: 'खतरे की पहचान', alerts: 'नवीनतम अलर्ट', none: 'कोई वास्तविक डेटा नहीं', online: 'ऑनलाइन', offline: 'कनेक्ट नहीं', running: 'चल रहा है', connected: 'जुड़े हुए', sub: 'सभी उप-प्रणालियाँ', reload: 'पुनः लोड करें', attempts: 'अनधिकृत प्रयास', last: 'नवीनतम', clean: '✅ हाल में कोई अनधिकृत प्रयास नहीं', prot: 'सुरक्षा', pTitle: 'सुरक्षा प्रणाली', pProt: 'सुरक्षित', pNot: 'असुरक्षित', pFiles: 'फ़ाइलें', pCover: 'सुरक्षित प्रोजेक्ट', pTotal: 'सुरक्षित फ़ाइलें', back: 'वापस' },
};

const SUBS = ['KI API', 'AI UI', 'IQ-AI', 'KSV', 'khoem-now', 'KHOEM_AI', 'KEI', 'EI-T'];
const HK: Record<L3, string> = { km: 'ហេក', en: 'Hacker', zh: '黑客' };
const isLang = (x: unknown): x is Lang => LANGS.some(l => l.code === x);

const fmt = (s: string) => {
  const d = new Date(s);
  return isNaN(+d) ? s : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function Flag({ c }: { c: L3 }) {
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

function Mark({ c }: { c: Lang }) {
  if (c === 'km' || c === 'en' || c === 'zh') return <Flag c={c} />;
  return <span className="chip">{c.toUpperCase()}</span>;
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
  const [lang, setLang] = useState<Lang>(() => { const s = localStorage.getItem('kei.lang'); return isLang(s) ? s : 'km'; });
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<'home' | 'hacker' | 'eit' | 'prot'>('home');
  const [st, setSt] = useState<Status | null>(null);
  const [al, setAl] = useState<Alerts | null>(null);
  const t: Dict = { ...BASE.en, ...(BASE as Record<string, Dict>)[lang], ...(MORE[lang] ?? {}) };
  const l3: L3 = lang === 'km' || lang === 'zh' ? lang : 'en';

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
  const home = () => setScreen('home');

  return (
    <div className="kei" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="kei-top">
        <div className="kei-logo"><Shield /><div><b>KHOEM-AI</b><small>{t.title}</small></div></div>
        <h1>{t.dash}</h1>
        <button className="prtbtn" onClick={() => setScreen('prot')}><span className="kd-icon"><MenuGlyph name="shield" /></span> {t.prot}</button>
        <button className="hkbtn" onClick={() => setScreen('hacker')}><span className="kd-icon"><MenuGlyph name="bell" /></span> {HK[l3]}</button>
        <button className="eitbtn" onClick={() => setScreen('eit')}><span className="kd-icon"><MenuGlyph name="data" /></span> EI-T</button>
        <div className="kei-lang">
          <button className="flagbtn" onClick={() => setOpen(o => !o)} aria-label="language"><Flag c="en" /></button>
          {open && (
            <div className="kei-langmenu">
              {LANGS.map(l => (
                <button key={l.code} className={l.code === lang ? 'on' : ''} onClick={() => { setLang(l.code); setOpen(false); }}>
                  <Mark c={l.code} /> {l.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      {screen === 'hacker' ? <KeiHacker lang={l3} onBack={home} />
        : screen === 'eit' ? <KeiEit lang={l3} onBack={home} />
        : screen === 'prot' ? <KeiProtect t={t} onBack={home} />
        : (<>
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
      <button className="reload" onClick={() => { load(); loadAl(); }}><span className="kd-icon"><MenuGlyph name="loop" /></span> {t.reload}</button>
      </>)}
    </div>
  );
}
