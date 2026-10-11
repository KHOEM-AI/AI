import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const memFile = () =>
  process.env.REM_MEMORY_FILE || path.join(HERE, "..", "..", "data", "rem-memory.json");

export const REM = Object.freeze({ name: "រ៉េម", latin: "Rem" });

const MAX_ITEMS = 200;
const MAX_LEN = 500;
const SECRET = /(api[_-]?key|password|passwd|token|secret|sk-[\w-]{10,}|ghp_\w{20,}|\b\d{12,}\b)/i;

function load() {
  try {
    const j = JSON.parse(fs.readFileSync(memFile(), "utf8"));
    return Array.isArray(j.items) ? j.items : [];
  } catch {
    return [];
  }
}

function save(items) {
  const f = memFile();
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f + ".tmp", JSON.stringify({ version: 1, items }, null, 2));
  fs.renameSync(f + ".tmp", f);
}

export function remember(text) {
  const t = String(text ?? "").normalize("NFC").trim();
  if (!t) return { ok: false, reason: "empty" };
  if (t.length > MAX_LEN) return { ok: false, reason: "too_long" };
  if (SECRET.test(t)) return { ok: false, reason: "secret" };
  const items = load();
  if (items.some((i) => i.text === t)) return { ok: true, duplicate: true, text: t, count: items.length };
  items.push({ text: t, at: new Date().toISOString() });
  while (items.length > MAX_ITEMS) items.shift();
  save(items);
  return { ok: true, text: t, count: items.length };
}

export const memories = () => load();

export function unremember(n) {
  const items = load();
  const i = Number(n) - 1;
  if (!Number.isInteger(i) || i < 0 || i >= items.length) return { ok: false };
  const [gone] = items.splice(i, 1);
  save(items);
  return { ok: true, text: gone.text };
}

const NAME_Q = /((អ្នក|ប្អូន|ឯង)\s*ឈ្មោះ\s*(អី|អ្វី)|ជានរណា|who are you|your name)/i;

// ត្រឡប់ string បើ Rem ឆ្លើយ ឬ null បើមិនពាក់ព័ន្ធ (ឱ្យ brain ចាស់បន្ត)
export function remReply(input) {
  const s = String(input ?? "").normalize("NFC").trim();
  if (!s) return null;

  let m = s.match(/^\/remember\s+(.+)$/is) || s.match(/^(?:ចាំថា|remember that)\s*[:：]?\s*(.+)$/is);
  if (m) {
    const r = remember(m[1]);
    if (r.ok && r.duplicate) return "បាទបង ប្អូនចាំរឿងនេះរួចហើយ។";
    if (r.ok) return `បាទបង ប្អូនចាំហើយ៖ "${r.text}" (សរុប ${r.count})`;
    if (r.reason === "secret") return "សុំទោសបង ប្អូនមិនចាំពាក្យសម្ងាត់ ឬ key ទេ ដើម្បីសុវត្ថិភាព។";
    if (r.reason === "too_long") return `វែងពេកបង (លើស ${MAX_LEN} តួ)។ សូមខ្លីជាងនេះ។`;
    return "សូមប្រាប់ថាចង់ឱ្យប្អូនចាំអ្វី។";
  }

  if (/^\/memories\b/i.test(s) || /^ចាំអ្វីខ្លះ/.test(s)) {
    const list = memories();
    if (!list.length) return "ប្អូនមិនទាន់ចាំអ្វីទេបង។";
    return list.map((x, i) => `${i + 1}. ${x.text}`).join("\n") + "\n(លុប៖ /unremember លេខ)";
  }

  m = s.match(/^\/unremember\s+(\d+)\s*$/i);
  if (m) {
    const r = unremember(m[1]);
    return r.ok ? `បាទបង ប្អូនភ្លេចហើយ៖ "${r.text}"` : "រកមិនឃើញលេខនោះទេបង។";
  }

  if (NAME_Q.test(s)) {
    return `បាទបង ប្អូនឈ្មោះ ${REM.name} (${REM.latin}) ជាជំនួយការ AI របស់ KHOEM។ ប្អូនចាំអ្វីដែលបងប្រាប់ឱ្យចាំបាន (/remember, /memories)។`;
  }
  return null;
}
