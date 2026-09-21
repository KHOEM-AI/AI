import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const CODE = /\.(tsx?|mjs|js)$/;
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

export function funcs(rel) {
  const p = path.resolve(ROOT, rel);
  if (!p.startsWith(SRC + path.sep)) return "អានបានតែឯកសារក្នុងថត src/ ប៉ុណ្ណោះ";
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) return "រកមិនឃើញឯកសារ: " + rel;
  const re =
    /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)|^\s*(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(|^\s*(?:export\s+)?(?:default\s+)?class\s+(\w+)/;
  const out = [];
  fs.readFileSync(p, "utf8")
    .split("\n")
    .forEach((l, i) => {
      const m = l.match(re);
      if (m) out.push(`- ${m[1] || m[2] || m[3]} (បន្ទាត់ ${i + 1})`);
    });
  return out.length ? `${rel}:\n` + out.join("\n") : "រកមិនឃើញ function ក្នុង " + rel;
}

export function check() {
  const all = walk(ROOT);
  const problems = [];
  const backups = all.filter((f) => isBackup(path.basename(f)));
  if (backups.length > 5)
    problems.push(`ឯកសារ backup ច្រើន (${backups.length}) ពិចារណាលុបចាស់ៗ`);

  for (const f of all.filter((f) => CODE.test(f) && !isBackup(path.basename(f)))) {
    const rel = path.relative(ROOT, f);
    const text = fs.readFileSync(f, "utf8");
    const lines = text.split("\n");
    if (lines.length > 300) problems.push(`${rel}: វែងពេក (${lines.length} បន្ទាត់)`);
    const seen = new Set();
    for (const l of lines) {
      if (l.startsWith("import ")) {
        if (seen.has(l)) problems.push(`${rel}: import ស្ទួន: ${l}`);
        seen.add(l);
      }
    }
    if (/sk-ant-[A-Za-z0-9_-]{10,}/.test(text))
      problems.push(`${rel}: ⚠️ មាន API key សរសេរក្នុងកូដ! លុបវាភ្លាម`);
  }

  const r = spawnSync("git", ["check-ignore", "-q", ".env"], { cwd: ROOT });
  if (r.status === 1)
    problems.push("⚠️ .env មិនត្រូវបានការពារដោយ git! កុំរុយទៅ GitHub");

  return problems.length
    ? "រកឃើញ " + problems.length + " ចំណុច:\n" + problems.map((x) => "- " + x).join("\n")
    : "ពិនិត្យរួច គ្មានបញ្ហា ✅";
}

export const HELP_ALL =
  "ពាក្យបញ្ជាដែលខ្ញុំយល់:\n" +
  "- /scan  ស្កេនកូដក្នុងគម្រោង\n" +
  "- /read src/App.tsx  អានឯកសារ ៤០ បន្ទាត់ដំបូង\n" +
  "- /funcs src/Gate.tsx  បង្ហាញបញ្ជី function\n" +
  "- /check  រកបញ្ហាទូទៅ\n" +
  "- /help  បង្ហាញបញ្ជីនេះ\n" +
  "- /learn សំណួរ = ចម្លើយ  បង្រៀនខួរ\n" +
  "- /learned  បង្ហាញអ្វីដែលបានរៀន\n" +
  "- /forget សំណួរ  ឱ្យខួរភ្លេច";
