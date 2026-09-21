import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const FILE = path.join(os.homedir(), "khoem-learned.json");

export function load() {
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

const grams = (s) => {
  const g = new Map();
  for (let i = 0; i < s.length - 1; i++) {
    const b = s[i] + s[i + 1];
    g.set(b, (g.get(b) || 0) + 1);
  }
  return g;
};
function dice(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const A = grams(a);
  const B = grams(b);
  let inter = 0;
  for (const [k, v] of A) inter += Math.min(v, B.get(k) || 0);
  return (2 * inter) / (a.length - 1 + b.length - 1);
}

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
    if (!(k in d)) return "ប្អូនមិនធ្លាប់រៀនអំពី: " + k;
    delete d[k];
    save(d);
    return "បានភ្លេចហើយ: " + k;
  }

  if (t === "/learned") {
    const keys = Object.keys(load());
    return keys.length
      ? `ប្អូនបានរៀន ${keys.length} ចំណុច:\n` + keys.map((k) => "- " + k).join("\n")
      : "ប្អូនមិនទាន់បានរៀនអ្វីទេ។ សាកល្បង: /learn សួស្ដី = សួស្ដីបង!";
  }

  if (!t.startsWith("/")) {
    const d = load();
    const q = norm(t);
    if (d[q]) return d[q];
    let best = null;
    let score = 0;
    for (const k of Object.keys(d)) {
      const sc = dice(q, k);
      if (sc > score) { score = sc; best = k; }
    }
    if (best && score >= 0.7) return d[best];
    if (best && score >= 0.45)
      return "តើបងចង់សួរ «" + best + "» ឬ? បើត្រូវ សូមសរសេរម្តងទៀតឱ្យត្រូវ។";
  }
  return null;
}
