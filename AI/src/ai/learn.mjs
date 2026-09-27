import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const FILE = path.join(os.homedir(), "khoem-learned.json");
const BACKUP_DIR = path.join(os.homedir(), "khoem-learned-backups");
const MAX_BACKUPS = 10;

export function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

function backupCurrent() {
  try {
    if (!fs.existsSync(FILE)) return;
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.copyFileSync(FILE, path.join(BACKUP_DIR, `learned-${stamp}.json`));
    const files = fs.readdirSync(BACKUP_DIR).sort();
    while (files.length > MAX_BACKUPS) {
      fs.unlinkSync(path.join(BACKUP_DIR, files.shift()));
    }
  } catch (e) {
    console.error("[learn] backup failed:", e && e.message);
  }
}

function save(d) {
  backupCurrent();
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2), "utf8");
  fs.renameSync(tmp, FILE);
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

// Evidence-based confidence for a learned-answer lookup, using the same
// dice-coefficient scoring handleLearn() already uses. Does not change
// handleLearn()'s own behavior — this is an additional, read-only view.
// confidence: "HIGH" (exact or score>=0.7), "MEDIUM" (0.45-0.7),
// "UNCERTAIN" (below 0.45 or no learned entry at all).
export function matchLearned(text) {
  const q = norm(text);
  const d = load();
  if (d[q]) return { answer: d[q], score: 1, confidence: "HIGH", matchedKey: q };
  let best = null;
  let score = 0;
  for (const k of Object.keys(d)) {
    const sc = dice(q, k);
    if (sc > score) { score = sc; best = k; }
  }
  if (best && score >= 0.7) return { answer: d[best], score, confidence: "HIGH", matchedKey: best };
  if (best && score >= 0.45) return { answer: d[best], score, confidence: "MEDIUM", matchedKey: best };
  return { answer: null, score, confidence: "UNCERTAIN", matchedKey: best };
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

  // NEW: /stats — quick health view of learned data
  if (t === "/stats") {
    const d = load();
    const keys = Object.keys(d);
    const avgLen = keys.length
      ? Math.round(keys.reduce((n, k) => n + d[k].length, 0) / keys.length)
      : 0;
    return `ចំនុចដែលបានរៀន: ${keys.length}\nប្រវែងចម្លើយជាមធ្យម: ${avgLen} តួអក្សរ\nឯកសារ: ${FILE}`;
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
