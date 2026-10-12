// src/ai/inputGuard.mjs - single entry check for every /api request (body, query, x-actor).
// UI mirror: src/lib/inputGuard.ts (keep the limits identical).
export const LIMITS = Object.freeze({ text: 20000, newContent: 500000, query: 500, items: 1000, depth: 8 });
// control chars (except \t \n \r) and bidi controls (Trojan Source). Khmer ZWSP/ZWNJ/ZWJ stay allowed.
const BAD_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u2028\u2029\u202A-\u202E\u2066-\u2069]/;
const ID_RE = new RegExp("^[\\p{L}\\p{M}\\p{N}._:@-]{1,64}$", "u");
const ID_KEYS = new Set(["actor", "decidedBy"]);
const MAX_BY_KEY = { newContent: LIMITS.newContent };
const fail = (field, code, error) => ({ ok: false, field, code, error });

function checkString(s, key, path) {
  if (ID_KEYS.has(key)) {
    if (!ID_RE.test(s.trim())) {
      return fail(path, "BAD_ID", `"${path}" ទម្រង់មិនត្រឹមត្រូវ (អនុញ្ញាតតែអក្សរ លេខ . _ : @ - ចំនួន ១ ដល់ ៦៤ តួ)`);
    }
    return null;
  }
  const max = MAX_BY_KEY[key] ?? LIMITS.text;
  if (s.length > max) return fail(path, "TOO_LONG", `"${path}" វែងពេក (អតិបរមា ${max} តួ ឥឡូវ ${s.length} តួ)`);
  if (BAD_CHARS.test(s)) return fail(path, "BAD_CHAR", `"${path}" មានតួអក្សរបញ្ជា ឬសញ្ញាបញ្ជាទិសដែលមិនអនុញ្ញាត`);
  return null;
}

function walk(v, key, path, depth) {
  if (typeof v === "string") return checkString(v, key, path);
  if (v === null || typeof v !== "object") return null;
  if (depth > LIMITS.depth) return fail(path, "TOO_DEEP", `"${path}" ជ្រៅពេក (អតិបរមា ${LIMITS.depth} ជាន់)`);
  if (Array.isArray(v)) {
    if (v.length > LIMITS.items) return fail(path, "TOO_MANY", `"${path}" មានធាតុច្រើនពេក (អតិបរមា ${LIMITS.items})`);
    for (let i = 0; i < v.length; i++) {
      const r = walk(v[i], key, `${path}[${i}]`, depth + 1);
      if (r) return r;
    }
    return null;
  }
  for (const [k, x] of Object.entries(v)) {
    const r = walk(x, k, path ? `${path}.${k}` : k, depth + 1);
    if (r) return r;
  }
  return null;
}

export function validateRequest(req) {
  const actor = typeof req.get === "function" ? req.get("x-actor") : undefined;
  if (actor !== undefined && actor !== "") {
    const r = checkString(String(actor), "actor", "x-actor");
    if (r) return r;
  }
  for (const [k, v] of Object.entries(req.query || {})) {
    for (const s of [].concat(v)) {
      if (typeof s !== "string") continue;
      if (s.length > LIMITS.query) return fail("?" + k, "TOO_LONG", `"?${k}" វែងពេក (អតិបរមា ${LIMITS.query} តួ)`);
      if (BAD_CHARS.test(s)) return fail("?" + k, "BAD_CHAR", `"?${k}" មានតួអក្សរបញ្ជាដែលមិនអនុញ្ញាត`);
    }
  }
  return walk(req.body, "", "", 0) ?? { ok: true };
}

export function inputGuardMiddleware(req, res, next) {
  const r = validateRequest(req);
  if (!r.ok) return res.status(400).json({ error: r.error, code: "INVALID_INPUT", field: r.field });
  next();
}
