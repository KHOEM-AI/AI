// ប្រើ: node scripts/ingest-dir.mjs [ថត]   ១ ជួរក្នុង .txt/.md = ១ ព័ត៌មាន ហើយបន្ថែមចូល data/rag/docs.jsonl
import fs from "node:fs";
import path from "node:path";
const STORE = path.resolve("data", "rag", "docs.jsonl");
const dir = process.argv[2] || path.join(process.env.HOME, "downloads", "khmer-data");
const seen = new Set(fs.readFileSync(STORE, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).text));
const split = (t) => {                       // ជួរវែងជាង 600 → កាត់តាម «។»
  if (t.length <= 600) return [t];
  const out = []; let cur = "";
  for (const s of t.split(/(?<=។)/)) { if ((cur + s).length > 600 && cur) { out.push(cur.trim()); cur = ""; } cur += s; }
  if (cur.trim()) out.push(cur.trim());
  return out;
};
let total = 0, dup = 0;
for (const f of fs.readdirSync(dir).filter((f) => /\.(txt|md)$/i.test(f)).sort()) {
  const lines = fs.readFileSync(path.join(dir, f), "utf8").normalize("NFC").split("\n").map((l) => l.trim()).filter(Boolean);
  const rows = [];
  lines.forEach((line, i) => split(line).forEach((t, j) => {
    if (seen.has(t)) { dup++; return; }
    seen.add(t);
    rows.push(JSON.stringify({ id: `khmer-data/${f}#${i}.${j}`, file: `khmer-data/${f}`, text: t }));
  }));
  if (rows.length) fs.appendFileSync(STORE, rows.join("\n") + "\n");
  console.log(f, "→ បន្ថែម", rows.length);
  total += rows.length;
}
console.log("សរុបបន្ថែម:", total, "| ស្ទួនរំលង:", dup, "| ឥឡូវមាន:", seen.size, "ជួរ");
