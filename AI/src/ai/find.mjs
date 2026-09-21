import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
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

export function find(term) {
  const t = String(term || "").trim().toLowerCase();
  if (t.length < 2) return "សូមសរសេរពាក្យយ៉ាងតិច ២ តួអក្សរ ឧទាហរណ៍: /find sendMessage";
  const hits = [];
  let files = 0;
  for (const f of walk(ROOT)) {
    if (!CODE.test(f) || isBackup(path.basename(f))) continue;
    const rel = path.relative(ROOT, f);
    let hit = false;
    fs.readFileSync(f, "utf8")
      .split("\n")
      .forEach((l, i) => {
        if (l.toLowerCase().includes(t)) {
          hit = true;
          const text = l.trim().slice(0, 100).replace(/sk-ant-[A-Za-z0-9_-]{10,}/g, "[លាក់]");
          hits.push(`- ${rel}:${i + 1}  ${text}`);
        }
      });
    if (hit) files++;
  }
  if (!hits.length) return `រកមិនឃើញ "${term}" ក្នុងកូដ`;
  const more = hits.length > 20 ? " (បង្ហាញ ២០ ដំបូង)" : "";
  return `រកឃើញ ${hits.length} ជួរ ក្នុង ${files} ឯកសារ${more}:\n` + hits.slice(0, 20).join("\n");
}
