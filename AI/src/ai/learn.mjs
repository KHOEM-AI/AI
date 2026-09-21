import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const FILE = path.join(os.homedir(), "khoem-learned.json");

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}
function save(d) {
  fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
}
const norm = (s) =>
  s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[?!។.\s]+$/g, "");

const FORMAT = "ទម្រង់: /learn សំណួរ = ចម្លើយ";

export function handleLearn(text) {
  const t = text.trim();

  if (t.startsWith("/learn ")) {
    const i = t.indexOf("=");
    if (i < 0) return FORMAT;
    const k = norm(t.slice(7, i));
    const v = t.slice(i + 1).trim();
    if (!k || !v) return FORMAT;
    if (k.startsWith("/")) return "សំណួរមិនអាចចាប់ផ្តើមដោយ / បានទេ";
    const d = load();
    d[k] = v;
    save(d);
    return `បានរៀនហើយ ✅ (សរុប ${Object.keys(d).length} ចំណុច)`;
  }

  if (t.startsWith("/forget ")) {
    const k = norm(t.slice(8));
    const d = load();
    if (!(k in d)) return "ខ្ញុំមិនធ្លាប់រៀនអំពី: " + k;
    delete d[k];
    save(d);
    return "បានភ្លេចហើយ: " + k;
  }

  if (t === "/learned") {
    const keys = Object.keys(load());
    return keys.length
      ? `ខ្ញុំបានរៀន ${keys.length} ចំណុច:\n` + keys.map((k) => "- " + k).join("\n")
      : "ខ្ញុំមិនទាន់បានរៀនអ្វីទេ។ សាកល្បង: /learn សួស្ដី = សួស្ដីបង!";
  }

  if (!t.startsWith("/")) {
    const a = load()[norm(t)];
    if (a) return a;
  }
  return null;
}
