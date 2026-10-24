// ប្រើ: node scripts/voa-wordlist.mjs [--min 3] [--dir <ថត khm_khmer_voanews>] [--out <ឯកសារ .tsv>]
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : def; };
const MINFREQ = Number(opt("--min", 3));
const DIR = opt("--dir", path.join(os.homedir(), "KHOEM_AI/KHOEM_AI/corpus-sample/raw/voa_extracted/khm_khmer_voanews"));
const OUT = opt("--out", path.join(process.cwd(), "data", "voa-wordlist.tsv"));
const articleDir = path.join(DIR, "article");
if (!fs.existsSync(articleDir)) { console.error("រកមិនឃើញថត:", articleDir); process.exit(1); }

const OK = /^[\u1780-\u17B3][\u1780-\u17D3\u17DD]*$/u;
const toks = (j) => (Array.isArray(j.tokens) ? j.tokens.flat(Infinity) : typeof j.tokens === "string" ? j.tokens.split(",") : []);

const files = fs.readdirSync(articleDir).filter((f) => f.endsWith(".json"));
const freq = new Map();
let bad = 0, total = 0;
for (const f of files) {
  let j;
  try { j = JSON.parse(fs.readFileSync(path.join(articleDir, f), "utf8")); } catch { bad++; continue; }
  if (j.predicted_language && j.predicted_language !== "khm") continue;
  for (let t of toks(j)) {
    t = String(t).replace(/[\u200B\uFEFF]/g, "").normalize("NFC").trim();
    if ([...t].length < 2 || !OK.test(t)) continue;
    total++;
    freq.set(t, (freq.get(t) || 0) + 1);
  }
}
const rows = [...freq].filter(([, n]) => n >= MINFREQ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, rows.map(([w, n]) => `${w}\t${n}`).join("\n") + "\n");
console.log({ articles: files.length, unreadable: bad, tokenOccurrences: total, distinctWords: freq.size, keptMinFreq: MINFREQ, written: rows.length, out: OUT });
console.log("ពាក្យញឹកញាប់បំផុត:", rows.slice(0, 15).map(([w, n]) => `${w}(${n})`).join(" "));
console.log("ពាក្យកម្រ (គំរូ):", rows.slice(-8).map(([w, n]) => `${w}(${n})`).join(" "));
