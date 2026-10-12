// UI mirror of src/ai/inputGuard.mjs - keep the limits identical.
const LIMITS = { text: 20000, newContent: 500000, items: 1000, depth: 8 };
const BAD_CHARS = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u2028\\u2029\\u202A-\\u202E\\u2066-\\u2069]");
const ID_RE = new RegExp("^[\\p{L}\\p{M}\\p{N}._:@-]{1,64}$", "u");
const ID_KEYS = new Set(["actor", "decidedBy"]);

function checkString(s: string, key: string, path: string): string | null {
  if (ID_KEYS.has(key)) {
    return ID_RE.test(s.trim()) ? null : `"${path}" ទម្រង់មិនត្រឹមត្រូវ (អនុញ្ញាតតែអក្សរ លេខ . _ : @ - ចំនួន ១ ដល់ ៦៤ តួ)`;
  }
  const max = key === "newContent" ? LIMITS.newContent : LIMITS.text;
  if (s.length > max) return `"${path}" វែងពេក (អតិបរមា ${max} តួ ឥឡូវ ${s.length} តួ)`;
  if (BAD_CHARS.test(s)) return `"${path}" មានតួអក្សរបញ្ជា ឬសញ្ញាបញ្ជាទិសដែលមិនអនុញ្ញាត`;
  return null;
}

function walk(v: unknown, key: string, path: string, depth: number): string | null {
  if (typeof v === "string") return checkString(v, key, path);
  if (v === null || typeof v !== "object") return null;
  if (depth > LIMITS.depth) return `"${path}" ជ្រៅពេក (អតិបរមា ${LIMITS.depth} ជាន់)`;
  if (Array.isArray(v)) {
    if (v.length > LIMITS.items) return `"${path}" មានធាតុច្រើនពេក (អតិបរមា ${LIMITS.items})`;
    for (let i = 0; i < v.length; i++) {
      const r = walk(v[i], key, `${path}[${i}]`, depth + 1);
      if (r) return r;
    }
    return null;
  }
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
    const r = walk(x, k, path ? `${path}.${k}` : k, depth + 1);
    if (r) return r;
  }
  return null;
}

// returns an error message, or null when the JSON body is fine (or not JSON: the server decides)
export function checkJsonBody(body: string): string | null {
  let parsed: unknown;
  try { parsed = JSON.parse(body); } catch { return null; }
  return walk(parsed, "", "", 0);
}
