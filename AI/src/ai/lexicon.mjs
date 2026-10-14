// src/ai/lexicon.mjs
// វចនានុក្រមខ្មែរ-អង់គ្លេស: ស្វែងរកពាក្យ និងបន្ថែមពាក្យថ្មីដោយអ្នកប្រើ (LEXICON_FILE)។
// ចំណាំ: នេះជាមូលដ្ឋានទិន្នន័យពាក្យ មិនមែនម៉ូដែលឆ្លើយសំណួរគ្រប់យ៉ាងទេ។
import fs from "node:fs";
import path from "node:path";
import { SEED_LEXICON, DOMAINS } from "./lexiconSeed.mjs";

const norm = (s) => String(s ?? "").normalize("NFC").trim();
const low = (s) => norm(s).toLowerCase();
const file = () => process.env.LEXICON_FILE || path.resolve("data", "lexicon.json");

function readUser() {
  try {
    const d = JSON.parse(fs.readFileSync(file(), "utf8"));
    return Array.isArray(d) ? d : [];
  } catch { return []; }
}

function writeUser(rows) {
  const f = file();
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f + ".tmp", JSON.stringify(rows, null, 2));
  fs.renameSync(f + ".tmp", f);
}

const all = () => [
  ...readUser().map((r) => ({ ...r, source: "user" })),
  ...SEED_LEXICON.map((r) => ({ ...r, source: "ai" })),
];

export const listDomains = () => [...new Set([...DOMAINS, ...readUser().map((r) => r.domain)])];

// ពាក្យអ្នកប្រើមកមុន (user > ai) ហើយត្រូវពេញមុនត្រូវមួយផ្នែក
export function lookup({ q, domain, limit = 20 } = {}) {
  const n = low(q);
  const rank = (r) => (low(r.km) === n || low(r.en) === n ? 0 : 1);
  return all()
    .filter((r) => (!domain || r.domain === domain) &&
      (!n || [r.km, r.en, r.defKm].some((t) => low(t).includes(n))))
    .sort((a, b) => rank(a) - rank(b) || (a.source === "user" ? 0 : 1) - (b.source === "user" ? 0 : 1))
    .slice(0, Math.max(1, Math.min(Number(limit) || 20, 100)));
}

export function addTerm({ domain, km, en, defKm } = {}) {
  const t = { domain: low(domain), km: norm(km), en: norm(en), defKm: norm(defKm) };
  if (!t.domain) return { ok: false, reason: "empty_domain" };
  if (!t.km && !t.en) return { ok: false, reason: "empty_term" };
  const dup = all().find((r) => r.domain === t.domain &&
    ((t.km && low(r.km) === low(t.km)) || (t.en && low(r.en) === low(t.en))));
  if (dup) return { ok: true, duplicate: true, term: dup };
  writeUser([...readUser(), t]);
  return { ok: true, duplicate: false, term: { ...t, source: "user" } };
}

// ឆ្លើយខ្លីជាភាសាខ្មែរពីពាក្យដែលមាន — បើរកមិនឃើញ ប្រាប់ត្រង់ៗ មិនបង្កើតចម្លើយ
export function answerKm(q) {
  const hits = lookup({ q, limit: 3 });
  if (!hits.length) return { found: false, text: "មិនទាន់មានពាក្យនេះក្នុងវចនានុក្រមទេ។ អាចបន្ថែមបាន។" };
  return { found: true, text: hits.map((h) => `${h.km} (${h.en}): ${h.defKm}`).join("\n"), hits };
}
