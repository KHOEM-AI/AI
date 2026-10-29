import { useState } from 'react';

type Lang = 'km' | 'en' | 'zh';

const L: Record<Lang, Record<string, string>> = {
  km: { title: 'EI-T គណិតវិទ្យាពិតប្រាកដ', back: 'ត្រឡប់ក្រោយ', words: 'អានលេខជាអក្សរ', num: 'លេខ (ឧ. 1234)', conv: 'បម្លែងឯកតា', val: 'តម្លៃ', from: 'ពី (km)', to: 'ទៅ (m)', quad: 'សមីការការ៉េ ax²+bx+c=0', run: 'គណនា', offline: 'EI-T មិនទាន់ដំណើរការ' },
  en: { title: 'EI-T Exact Math', back: 'Back', words: 'Number to words', num: 'Number (e.g. 1234)', conv: 'Unit conversion', val: 'Value', from: 'From (km)', to: 'To (m)', quad: 'Quadratic ax²+bx+c=0', run: 'Calculate', offline: 'EI-T is not running' },
  zh: { title: 'EI-T 精确数学', back: '返回', words: '数字转文字', num: '数字（如 1234）', conv: '单位换算', val: '数值', from: '从（km）', to: '到（m）', quad: '二次方程 ax²+bx+c=0', run: '计算', offline: 'EI-T 未运行' },
};
const NAMES: Record<Lang, string> = { km: 'ខ្មែរ', en: 'English', zh: '中文' };

async function call(fn: string, args: string[]) {
  const r = await fetch('/api/kei/eit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fn, args }),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j && j.error ? String(j.error) : `HTTP ${r.status}`);
  return j?.result;
}

function show(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return Object.entries(v as Record<string, unknown>).map(([k, x]) => `${k}: ${show(x)}`).join('\n');
  return String(v);
}

export default function KeiEit({ lang, onBack }: { lang: Lang; onBack: () => void }) {
  const t = L[lang];
  const [num, setNum] = useState('');
  const [words, setWords] = useState<Record<Lang, string> | null>(null);
  const [e1, setE1] = useState('');
  const [val, setVal] = useState('1');
  const [from, setFrom] = useState('km');
  const [to, setTo] = useState('m');
  const [conv, setConv] = useState('');
  const [e2, setE2] = useState('');
  const [a, setA] = useState('1');
  const [b, setB] = useState('-3');
  const [c, setC] = useState('2');
  const [quad, setQuad] = useState('');
  const [e3, setE3] = useState('');

  const msg = (e: unknown) => {
    const m = e instanceof Error ? e.message : String(e);
    return m === 'EI_T_OFFLINE' ? t.offline : m;
  };

  const doWords = async () => {
    setE1(''); setWords(null);
    try {
      const [km, en, zh] = await Promise.all((['km', 'en', 'zh'] as Lang[]).map(l => call('numberToWords', [num.trim(), l])));
      setWords({ km: String(km), en: String(en), zh: String(zh) });
    } catch (e) { setE1(msg(e)); }
  };
  const doConv = async () => {
    setE2(''); setConv('');
    try { setConv(show(await call('convert', [val.trim(), from.trim(), to.trim()]))); } catch (e) { setE2(msg(e)); }
  };
  const doQuad = async () => {
    setE3(''); setQuad('');
    try { setQuad(show(await call('solveQuadratic', [a.trim(), b.trim(), c.trim()]))); } catch (e) { setE3(msg(e)); }
  };

  return (
    <div className="hk">
      <div className="hk-head">
        <button onClick={onBack}>← {t.back}</button>
        <h2 style={{ color: '#7dffb0' }}>🔢 {t.title}</h2>
      </div>

      <section className="panel">
        <h2>{t.words}</h2>
        <input className="eit-in" inputMode="numeric" placeholder={t.num} value={num} onChange={e => setNum(e.target.value)} />
        <button onClick={doWords} disabled={!num.trim()}>{t.run}</button>
        {e1 && <div className="eit-out eit-err">⚠ {e1}</div>}
        {words && <div className="eit-out">{(['km', 'en', 'zh'] as Lang[]).map(l => `${NAMES[l]}: ${words[l]}`).join('\n')}</div>}
      </section>

      <section className="panel" style={{ marginTop: 10 }}>
        <h2>{t.conv}</h2>
        <input className="eit-in" inputMode="decimal" placeholder={t.val} value={val} onChange={e => setVal(e.target.value)} />
        <div className="eit-row">
          <input className="eit-in" placeholder={t.from} value={from} onChange={e => setFrom(e.target.value)} />
          <input className="eit-in" placeholder={t.to} value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <button onClick={doConv} disabled={!val.trim() || !from.trim() || !to.trim()}>{t.run}</button>
        {e2 && <div className="eit-out eit-err">⚠ {e2}</div>}
        {conv && <div className="eit-out">{conv}</div>}
      </section>

      <section className="panel" style={{ marginTop: 10 }}>
        <h2>{t.quad}</h2>
        <div className="eit-row">
          <input className="eit-in" inputMode="decimal" placeholder="a" value={a} onChange={e => setA(e.target.value)} />
          <input className="eit-in" inputMode="decimal" placeholder="b" value={b} onChange={e => setB(e.target.value)} />
          <input className="eit-in" inputMode="decimal" placeholder="c" value={c} onChange={e => setC(e.target.value)} />
        </div>
        <button onClick={doQuad} disabled={!a.trim() || !b.trim() || !c.trim()}>{t.run}</button>
        {e3 && <div className="eit-out eit-err">⚠ {e3}</div>}
        {quad && <div className="eit-out">{quad}</div>}
      </section>
    </div>
  );
}
