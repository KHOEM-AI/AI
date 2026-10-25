// ប្រើ: node scripts/voa-to-txt.mjs [--dry] [--limit 3000] [--dir <ថត khm_khmer_voanews>] [--out <ឯកសារ .txt>]
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : def; };
const DRY = args.includes("--dry");
const LIMIT = Number(opt("--limit", 3000));
const DIR = opt("--dir", path.join(os.homedir(), "KHOEM_AI/KHOEM_AI/corpus-sample/raw/voa_extracted/khm_khmer_voanews"));
const OUT = opt("--out", path.join(os.homedir(), "downloads/khmer-data/voa.txt"));
const MIN = 80, MAX = 500;

const articleDir = path.join(DIR, "article");
if (!fs.existsSync(articleDir)) { console.error("រកមិនឃើញថត:", articleDir); process.exit(1); }

const khmerRatio = (s) => {
  const chars = [...s.replace(/\s+/g, "")];
  if (!chars.length) return 0;
  return chars.filter((c) => c >= "\u1780" && c <= "\u17FF").length / chars.length;
};
const BAD = /https?:|www\.|@|\(រូបថត|រូបភាព៖|រូបថត៖|VOA|សូមស្តាប់|ចុចទីនេះ|ទាញយក|ប្រភព៖/;
const good = (p) => {
  if (typeof p !== "string") return false;
  const t = p.trim();
  const n = [...t].length;
  return n >= MIN && n <= MAX && t.endsWith("។") && khmerRatio(t) >= 0.85 && !BAD.test(t);
};

const files = fs.readdirSync(articleDir).filter((f) => f.endsWith(".json")).sort();
const cand = [];
let bad = 0, nonKhm = 0, noPara = 0;
for (const f of files) {
  let j;
  try { j = JSON.parse(fs.readFileSync(path.join(articleDir, f), "utf8")); } catch { bad++; continue; }
  if (j.predicted_language && j.predicted_language !== "khm") { nonKhm++; continue; }
  const p = (Array.isArray(j.paragraphs) ? j.paragraphs : []).map((x) => String(x).normalize("NFC").trim()).find(good);
  if (!p) { noPara++; continue; }
  cand.push(p);
}
const seen = new Set();
const uniq = cand.filter((p) => (seen.has(p) ? false : seen.add(p)));
const step = Math.max(1, uniq.length / LIMIT);
const picked = [];
for (let i = 0; picked.length < LIMIT && Math.floor(i) < uniq.length; i += step) picked.push(uniq[Math.floor(i)]);

console.log({ articles: files.length, unreadable: bad, notKhmer: nonKhm, noGoodParagraph: noPara, candidates: uniq.length, picked: picked.length, mode: DRY ? "dry-run" : "write" });
console.log("--- គំរូ ៥ ជួរ ---");
for (const p of picked.filter((_, i) => i % Math.max(1, Math.floor(picked.length / 5)) === 0).slice(0, 5)) console.log("•", p);

if (!DRY) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, picked.join("\n") + "\n");
  console.log("សរសេរ", picked.length, "ជួរ →", OUT);
}
