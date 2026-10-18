// src/ai/learnedApi.mjs
// 30 route /api/learned/* សម្រាប់គ្រប់គ្រងចំណេះដឹងដែលបានរៀន (~/khoem-learned.json)
// ផ្ទាល់ខ្លួន ១០០% (Express + learn.mjs) គ្មានសេវាខាងក្រៅ។
// ការសរសេរទាំងអស់ឆ្លងកាត់ save() ដូច្នេះមាន backup ស្វ័យប្រវត្តិ។ ត្រូវការ x-api-key + policy ដូច route ផ្សេងៗ។
import fs from "node:fs";
import path from "node:path";
import { load, save, norm, dice, matchLearned, FILE, BACKUP_DIR } from "./learn.mjs";
import { guard as defaultGuard, policy as defaultPolicy } from "./api.mjs";

const MAX_Q = 300;
const MAX_A = 5000;

const bad = (m, status = 400) => Object.assign(new Error(m), { status });
const wrap = (fn) => async (req, res) => {
  try {
    res.json({ result: await fn(req) });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "មានបញ្ហា" });
  }
};
const isObj = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const data = () => { const d = load(); return isObj(d) ? d : {}; };
const int = (v, def, min, max) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
const text = (v) => (typeof v === "string" ? v : "");
const has = (d, k) => Object.prototype.hasOwnProperty.call(d, k);
const keyOf = (q) => {
  const k = norm(text(q));
  if (!k) throw bad("ត្រូវការ q");
  return k;
};
const size = (d) => Object.keys(d).length;

function checkKey(k) {
  if (!k) return "q ទទេ";
  if (k.length > MAX_Q) return `q វែងពេក (អតិបរមា ${MAX_Q})`;
  if (k.includes("=")) return "q មិនអាចមាន =";
  if (k.startsWith("/")) return "q មិនអាចចាប់ផ្តើមដោយ /";
  return null;
}
function checkAnswer(a) {
  if (!a) return "a ទទេ";
  if (a.length > MAX_A) return `a វែងពេក (អតិបរមា ${MAX_A})`;
  return null;
}
function pair(q, a) {
  const k = norm(text(q));
  const v = text(a).trim();
  const err = checkKey(k) || checkAnswer(v);
  if (err) throw bad(err);
  return [k, v];
}
function problems(k, v) {
  const p = [];
  if (!k) p.push("empty-key");
  if (typeof v !== "string" || !v.trim()) p.push("empty-answer");
  if (k.startsWith("/")) p.push("slash-key");
  if (k.includes("=")) p.push("equals-key");
  return p;
}
function slice(arr, req, def = 50) {
  const offset = int(req.query.offset, 0, 0, 1e9);
  const limit = int(req.query.limit, def, 1, 200);
  return { total: arr.length, offset, limit, items: arr.slice(offset, offset + limit) };
}
function ordered(d, sort) {
  const e = Object.entries(d).map(([q, a]) => ({ q, a }));
  if (sort === "reverse") e.reverse();
  else if (sort === "alpha") e.sort((x, y) => x.q.localeCompare(y.q));
  else if (sort === "len") e.sort((x, y) => text(y.a).length - text(x.a).length);
  return e;
}
function listBackups() {
  try {
    return fs.readdirSync(BACKUP_DIR)
      .filter((n) => /^learned-[A-Za-z0-9-]+\.json$/.test(n))
      .sort().reverse()
      .map((name) => {
        const st = fs.statSync(path.join(BACKUP_DIR, name));
        return { name, size: st.size, mtime: st.mtime.toISOString() };
      });
  } catch {
    return [];
  }
}

export function registerLearnedApi(app, deps = {}) {
  const g = deps.guard || defaultGuard;
  const p = deps.policy || defaultPolicy;
  const R = "knowledge.readLearned";
  const W = "learning.write";
  const D = "learning.delete";
  const routes = [];
  const add = (method, sub, action, fn, raw = false) => {
    const url = `/api/learned/${sub}`;
    routes.push(`${method.toUpperCase()} ${url}`);
    app[method](url, g, p(action), raw ? fn : wrap(fn));
  };

  // ---------- អាន (19) ----------
  add("get", "count", R, () => ({ count: size(data()) }));

  add("get", "stats", R, () => {
    const e = Object.entries(data());
    const n = e.length;
    const qLen = e.reduce((s, [k]) => s + k.length, 0);
    const aLen = e.reduce((s, [, v]) => s + text(v).length, 0);
    const lq = e.reduce((b, [k]) => (k.length > (b ? b.len : -1) ? { q: k, len: k.length } : b), null);
    const la = e.reduce((b, [k, v]) => (text(v).length > (b ? b.len : -1) ? { q: k, len: text(v).length } : b), null);
    return {
      count: n,
      avgQuestionChars: n ? +(qLen / n).toFixed(1) : 0,
      avgAnswerChars: n ? +(aLen / n).toFixed(1) : 0,
      answerCharsTotal: aLen,
      longestQuestion: lq,
      longestAnswer: la,
    };
  });

  add("get", "page", R, (req) => slice(ordered(data(), req.query.sort), req));
  add("get", "keys", R, (req) => slice(Object.keys(data()), req, 100));

  add("get", "get", R, (req) => {
    const d = data();
    const k = keyOf(req.query.q);
    if (!has(d, k)) throw bad("រកមិនឃើញ", 404);
    return { q: k, a: d[k] };
  });

  add("get", "exists", R, (req) => {
    const k = keyOf(req.query.q);
    return { key: k, exists: has(data(), k) };
  });

  add("get", "match", R, (req) => {
    const q = text(req.query.q);
    if (!norm(q)) throw bad("ត្រូវការ q");
    return matchLearned(q);
  });

  add("get", "similar", R, (req) => {
    const d = data();
    const k = keyOf(req.query.q);
    const limit = int(req.query.limit, 5, 1, 20);
    const items = Object.keys(d)
      .map((q) => ({ q, a: d[q], score: +dice(k, q).toFixed(3) }))
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score)
      .slice(0, limit);
    return { query: k, items };
  });

  add("get", "search", R, (req) => {
    const needle = text(req.query.q).trim().toLowerCase();
    if (!needle) throw bad("ត្រូវការ q");
    const hits = Object.entries(data())
      .filter(([k, v]) => k.includes(needle) || text(v).toLowerCase().includes(needle))
      .map(([q, a]) => ({ q, a }));
    return { total: hits.length, items: hits.slice(0, int(req.query.limit, 20, 1, 100)) };
  });

  add("get", "starts", R, (req) => {
    const pf = norm(text(req.query.prefix));
    if (!pf) throw bad("ត្រូវការ prefix");
    const hits = Object.keys(data()).filter((k) => k.startsWith(pf));
    return { prefix: pf, total: hits.length, items: hits.slice(0, int(req.query.limit, 50, 1, 200)) };
  });

  const byLen = (dir) => (req) => {
    const limit = int(req.query.limit, 10, 1, 50);
    const e = Object.entries(data())
      .map(([q, a]) => ({ q, a, len: text(a).length }))
      .sort((x, y) => dir * (y.len - x.len));
    return { items: e.slice(0, limit) };
  };
  add("get", "longest", R, byLen(1));
  add("get", "shortest", R, byLen(-1));

  add("get", "duplicates", R, () => {
    const m = new Map();
    for (const [k, v] of Object.entries(data())) {
      const a = text(v).trim();
      if (!m.has(a)) m.set(a, []);
      m.get(a).push(k);
    }
    const groups = [...m]
      .filter(([, ks]) => ks.length > 1)
      .map(([a, questions]) => ({ a, questions }))
      .sort((x, y) => y.questions.length - x.questions.length);
    return { groups: groups.length, items: groups.slice(0, 50) };
  });

  add("get", "validate", R, () => {
    const e = Object.entries(data());
    const issues = [];
    for (const [k, v] of e) {
      const pr = problems(k, v);
      if (norm(k) !== k) pr.push("not-normalized");
      if (pr.length) issues.push({ q: k, problems: pr });
    }
    return {
      total: e.length,
      flagged: issues.length,
      hard: issues.filter((i) => i.problems.some((x) => x !== "not-normalized")).length,
      items: issues.slice(0, 100),
    };
  });

  add("get", "health", R, () => {
    let sizeBytes = null, exists = false, parseOk = false, count = null;
    try { sizeBytes = fs.statSync(FILE).size; exists = true; } catch { /* គ្មានឯកសារ */ }
    if (exists) {
      try {
        const j = JSON.parse(fs.readFileSync(FILE, "utf8"));
        parseOk = isObj(j);
        count = parseOk ? size(j) : null;
      } catch { /* JSON ខូច */ }
    }
    return { exists, parseOk, sizeBytes, count, backups: listBackups().length };
  });

  add("get", "backups", R, () => listBackups());
  add("get", "export", R, () => data());

  add("get", "export.txt", R, (req, res) => {
    try {
      const lines = Object.entries(data())
        .map(([k, v]) => `${k} = ${text(v).replace(/\n/g, "\\n")}`)
        .join("\n");
      res.type("text/plain; charset=utf-8").send(lines);
    } catch (e) {
      res.status(500).json({ error: e.message || "មានបញ្ហា" });
    }
  }, true);

  add("get", "random", R, () => {
    const d = data();
    const ks = Object.keys(d);
    if (!ks.length) throw bad("គ្មានចំណេះដឹង", 404);
    const q = ks[Math.floor(Math.random() * ks.length)];
    return { q, a: d[q] };
  });

  // ---------- សរសេរ (6) ----------
  add("post", "bulk", W, (req) => {
    const items = req.body && req.body.items;
    if (!Array.isArray(items) || !items.length) throw bad("ត្រូវការ items (array មិនទទេ)");
    if (items.length > 200) throw bad("items អតិបរមា 200 ក្នុងមួយដង");
    const d = data();
    let added = 0, updated = 0;
    const skipped = [];
    items.forEach((it, index) => {
      try {
        const [k, v] = pair(it && it.q, it && it.a);
        if (has(d, k)) updated++; else added++;
        d[k] = v;
      } catch (e) {
        skipped.push({ index, reason: e.message });
      }
    });
    if (added + updated) save(d);
    return { added, updated, skipped, total: size(d) };
  });

  add("post", "update", W, (req) => {
    const b = req.body || {};
    const d = data();
    const [k, v] = pair(b.q, b.a);
    if (!has(d, k)) throw bad("រកមិនឃើញ q នេះ", 404);
    d[k] = v;
    save(d);
    return { q: k, a: v };
  });

  add("post", "rename", W, (req) => {
    const b = req.body || {};
    const d = data();
    const from = norm(text(b.from));
    const to = norm(text(b.to));
    const err = checkKey(to);
    if (err) throw bad("to: " + err);
    if (!has(d, from)) throw bad("រកមិនឃើញ from", 404);
    if (from === to) throw bad("from និង to ដូចគ្នា");
    if (has(d, to) && b.overwrite !== true) throw bad("to មានរួចហើយ (ប្រើ overwrite:true)", 409);
    d[to] = d[from];
    delete d[from];
    save(d);
    return { from, to };
  });

  add("post", "append", W, (req) => {
    const b = req.body || {};
    const d = data();
    const k = keyOf(b.q);
    const extra = text(b.a).trim();
    if (!extra) throw bad("ត្រូវការ a");
    if (!has(d, k)) throw bad("រកមិនឃើញ q នេះ", 404);
    const merged = text(d[k]) + "\n" + extra;
    if (merged.length > MAX_A) throw bad(`a វែងពេក (អតិបរមា ${MAX_A})`);
    d[k] = merged;
    save(d);
    return { q: k, a: merged };
  });

  add("post", "import", W, (req) => {
    const b = req.body || {};
    const mode = b.mode === "skip" ? "skip" : "merge";
    if (!isObj(b.data)) throw bad("ត្រូវការ data (object { សំណួរ: ចម្លើយ })");
    const entries = Object.entries(b.data);
    if (!entries.length) throw bad("data ទទេ");
    if (entries.length > 500) throw bad("data អតិបរមា 500 ធាតុក្នុងមួយដង");
    const d = data();
    let added = 0, updated = 0, kept = 0;
    const skipped = [];
    for (const [q, a] of entries) {
      try {
        const [k, v] = pair(q, a);
        if (has(d, k)) {
          if (mode === "skip") { kept++; continue; }
          updated++;
        } else added++;
        d[k] = v;
      } catch (e) {
        skipped.push({ q: q.slice(0, 60), reason: e.message });
      }
    }
    if (added + updated) save(d);
    return { mode, added, updated, kept, skipped: skipped.slice(0, 50), total: size(d) };
  });

  add("post", "backup", W, () => {
    if (!fs.existsSync(FILE)) throw bad("មិនទាន់មានឯកសារចំណេះដឹង", 404);
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const name = `learned-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    fs.copyFileSync(FILE, path.join(BACKUP_DIR, name));
    return { name };
  });

  // ---------- លុប/ស្ដារ (5) ត្រូវការ confirm ----------
  add("post", "forget-bulk", D, (req) => {
    const qs = req.body && req.body.qs;
    if (!Array.isArray(qs) || !qs.length) throw bad("ត្រូវការ qs (array មិនទទេ)");
    if (qs.length > 200) throw bad("qs អតិបរមា 200 ក្នុងមួយដង");
    const d = data();
    let removed = 0;
    const missing = [];
    for (const q of qs) {
      const k = norm(text(q));
      if (k && has(d, k)) { delete d[k]; removed++; } else missing.push(text(q).slice(0, 60));
    }
    if (removed) save(d);
    return { removed, missing, total: size(d) };
  });

  add("post", "forget-prefix", D, (req) => {
    const b = req.body || {};
    const pf = norm(text(b.prefix));
    if (pf.length < 2) throw bad("prefix ត្រូវមានយ៉ាងតិច 2 តួ");
    const d = data();
    const hit = Object.keys(d).filter((k) => k.startsWith(pf));
    if (b.confirm !== true) return { confirmed: false, matches: hit.length, sample: hit.slice(0, 10) };
    for (const k of hit) delete d[k];
    if (hit.length) save(d);
    return { confirmed: true, removed: hit.length, total: size(d) };
  });

  add("post", "clean", D, (req) => {
    const d = data();
    const hit = Object.entries(d).filter(([k, v]) => problems(k, v).length).map(([k]) => k);
    if (!req.body || req.body.confirm !== true) return { confirmed: false, matches: hit.length, sample: hit.slice(0, 10) };
    for (const k of hit) delete d[k];
    if (hit.length) save(d);
    return { confirmed: true, removed: hit.length, total: size(d) };
  });

  add("post", "restore", D, (req) => {
    const b = req.body || {};
    const name = text(b.name);
    if (!/^learned-[A-Za-z0-9-]+\.json$/.test(name)) throw bad("name មិនត្រឹមត្រូវ");
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, name), "utf8"));
    } catch {
      throw bad("អាន backup មិនបាន", 404);
    }
    if (!isObj(parsed)) throw bad("backup មិនមែនទម្រង់ត្រឹមត្រូវ");
    const current = size(data());
    if (b.confirm !== true) return { confirmed: false, name, backupEntries: size(parsed), currentEntries: current };
    save(parsed);
    return { confirmed: true, name, restored: size(parsed), previous: current };
  });

  add("post", "clear", D, (req) => {
    if (!req.body || req.body.confirm !== "CLEAR") throw bad('ត្រូវការ confirm: "CLEAR"');
    const n = size(data());
    save({});
    return { cleared: n };
  });

  return routes;
}
