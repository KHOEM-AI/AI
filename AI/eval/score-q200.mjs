import fs from 'node:fs';
const ref = JSON.parse(fs.readFileSync('eval/q200_ref.json', 'utf8'));
let seg = null;
try { seg = new Intl.Segmenter('km', { granularity: 'word' }); } catch {}
const words = (t) => {
  const parts = seg
    ? [...seg.segment(t)].filter((s) => s.isWordLike).map((s) => s.segment)
    : t.split(/[\s។៕,.:;!?()"']+/);
  return new Set(parts.filter((w) => [...w].length >= 3));
};
const extract = (raw) => {
  const lines = raw.split('\n');
  const i = lines.findIndex((l) => l.startsWith('> '));
  if (i < 0) return '';
  const out = [];
  for (let k = i + 1; k < lines.length; k++) {
    if (lines[k].startsWith('[ Prompt:')) break;
    out.push(lines[k]);
  }
  return out.join('\n').trim();
};
let done = 0, good = 0, some = 0, bad = 0, rep = 0, nokm = 0, sum = 0;
const rows = [];
ref.forEach((r, idx) => {
  const f = `eval/q200_raw/${String(idx + 1).padStart(3, '0')}.txt`;
  if (!fs.existsSync(f)) return;
  const a = extract(fs.readFileSync(f, 'utf8'));
  const rw = words(r.ref);
  const cover = rw.size ? [...rw].filter((w) => a.includes(w)).length / rw.size : 0;
  const chunks = a.split(/[។\n]+/).map((s) => s.trim()).filter((s) => s.length >= 10);
  const repeated = chunks.length !== new Set(chunks).size;
  const hasKm = /[\u1780-\u17FF]/.test(a);
  done++; sum += cover;
  if (cover >= 0.5) good++; else if (cover >= 0.25) some++; else bad++;
  if (repeated) rep++;
  if (!hasKm) nokm++;
  rows.push(`${idx + 1}\t${(cover * 100).toFixed(0)}%\t${repeated ? 'ដដែល' : '-'}\t${r.q}\t=> ${a.replace(/\s+/g, ' ').slice(0, 80)}`);
});
const pct = (n) => (done ? ((n / done) * 100).toFixed(0) : 0) + '%';
const summary = [
  `បានដាក់ពិន្ទុ: ${done}/${ref.length}`,
  `ពាក្យត្រូវជាមធ្យម: ${done ? ((sum / done) * 100).toFixed(1) : 0}%`,
  `ត្រូវ (≥50%): ${good} (${pct(good)}) | ខ្លះ (25-50%): ${some} (${pct(some)}) | ខុស (<25%): ${bad} (${pct(bad)})`,
  `មានប្រយោគដដែលៗ: ${rep} (${pct(rep)}) | គ្មានអក្សរខ្មែរ: ${nokm}`,
].join('\n');
fs.writeFileSync('eval/q200_report.txt', summary + '\n\n' + rows.join('\n') + '\n');
console.log(summary);
console.log('លម្អិត: eval/q200_report.txt');
