import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const CODE = /\.(tsx?|mjs|js|css)$/;
const isBackup = (n) =>
  n.includes(".before-") || n.endsWith(".backup") || n.includes("black3d-small");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "dist" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function scan() {
  const all = walk(ROOT);
  const backups = all.filter((f) => isBackup(path.basename(f)));
  const code = all.filter((f) => CODE.test(f) && !isBackup(path.basename(f)));
  const rows = code.map((f) => {
    const lines = fs.readFileSync(f, "utf8").split("\n");
    const seen = new Set();
    const dup = [];
    for (const l of lines) {
      if (l.startsWith("import ")) {
        if (seen.has(l)) dup.push(l);
        seen.add(l);
      }
    }
    return { f: path.relative(ROOT, f), n: lines.length, dup };
  });
  rows.sort((a, b) => b.n - a.n);
  const total = rows.reduce((s, r) => s + r.n, 0);
  let out = `ឯកសារកូដ: ${rows.length} | បន្ទាត់សរុប: ${total} | ឯកសារ backup: ${backups.length}\n\nធំជាងគេ:\n`;
  out += rows.slice(0, 5).map((r) => `- ${r.f} (${r.n})`).join("\n");
  const bad = rows.filter((r) => r.dup.length);
  out += "\n\n";
  out += bad.length
    ? "import ស្ទួន:\n" + bad.map((r) => `- ${r.f}: ${r.dup[0]}`).join("\n")
    : "គ្មាន import ស្ទួន ✅";
  return out;
}

function readFile(rel) {
  const p = path.resolve(ROOT, rel);
  if (!p.startsWith(SRC + path.sep)) return "អានបានតែឯកសារក្នុងថត src/ ប៉ុណ្ណោះ";
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) return "រកមិនឃើញឯកសារ: " + rel;
  const lines = fs.readFileSync(p, "utf8").split("\n");
  return `${rel} (${lines.length} បន្ទាត់)\n\n` + lines.slice(0, 40).join("\n");
}

const HELP =
  "ខ្ញុំជាខួរផ្ទាល់ខ្លួនរបស់បង (គ្មាន API) ហើយនៅតូច។ ខ្ញុំយល់ពាក្យបញ្ជាទាំងនេះ:\n" +
  "- /scan  ស្កេនកូដក្នុងគម្រោង\n" +
  "- /read src/App.tsx  អានឯកសារ ៤០ បន្ទាត់ដំបូង";

export async function khoemReply(conversation) {
  const last = String(conversation.at(-1)?.content ?? "").trim();
  const q = last.toLowerCase();
  if (q === "/scan" || q.includes("ស្កេន")) return scan();
  if (q.startsWith("/read ")) return readFile(last.slice(6).trim());
  if (/^(សួស្ដី|សួស្តី|hello|hi)/.test(q)) return "សួស្ដីបង! " + HELP;
  return HELP;
}
