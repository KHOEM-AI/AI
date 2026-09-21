import { performance } from "node:perf_hooks";
import {
  API_HEALTH_TIMEOUT_MS,
  KNOWLEDGE_TIMEOUT_MS,
  LEARN_TIMEOUT_MS,
  TOOL_TIMEOUT_MS,
  DEVELOPING_MODULES,
} from "../config/timeouts.mjs";

// ចំនួន request ដែលកំពុងដំណើរការពិតប្រាកដ (សម្រាប់ ACTIVE)
export const active = { chat: 0, learn: 0, tool: 0 };

export function trackActivity(req, res, next) {
  const p = req.path;
  let key = null;
  if (p === "/api/chat") key = "chat";
  else if (p === "/api/learn" || p === "/api/forget") key = "learn";
  else if (/^\/api\/(scan|check|funcs|read|find)$/.test(p)) key = "tool";
  if (!key) return next();
  active[key]++;
  let done = false;
  const end = () => {
    if (!done) {
      done = true;
      active[key]--;
    }
  };
  res.on("finish", end);
  res.on("close", end);
  next();
}

const PRIORITY = ["ERROR", "OFFLINE", "TIMEOUT", "LOADING", "UPDATING", "ACTIVE", "READY", "ONLINE", "DEVELOPING", "UNKNOWN"];
const pickStatus = (list) => list.slice().sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b))[0];

async function loadModule(path) {
  try {
    return await import(path);
  } catch (e) {
    e.loadFailed = true;
    throw e;
  }
}

function withTimeout(fn, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Object.assign(new Error("timeout"), { timeout: true })), ms);
    Promise.resolve()
      .then(fn)
      .then(
        (v) => { clearTimeout(t); resolve(v); },
        (e) => { clearTimeout(t); reject(e); }
      );
  });
}

async function probe(id, ms, fn) {
  const t0 = performance.now();
  const lastChecked = new Date().toISOString();
  try {
    const r = await withTimeout(fn, ms);
    return { id, lastChecked, responseTimeMs: Math.round(performance.now() - t0), ...r };
  } catch (e) {
    const responseTimeMs = Math.round(performance.now() - t0);
    if (e && e.timeout) {
      return { id, lastChecked, responseTimeMs: ms, status: "TIMEOUT",
        reasonKm: `មិនបានឆ្លើយតបក្នុង ${ms} ms`, reasonEn: `No response within ${ms} ms` };
    }
    if (e && e.loadFailed) {
      return { id, lastChecked, responseTimeMs, status: "OFFLINE",
        reasonKm: "Module មិនអាច load បាន", reasonEn: "Module could not be loaded", error: String(e.message) };
    }
    return { id, lastChecked, responseTimeMs, status: "ERROR",
      reasonKm: "ប្រតិបត្តិការបរាជ័យ", reasonEn: "Operation failed", error: String(e && e.message) };
  }
}

const CRITICAL = ["core", "khmer", "tools", "model"];
const PROBLEM = ["ERROR", "OFFLINE", "TIMEOUT"];

function systemHealth(cards) {
  const crit = cards.filter((c) => CRITICAL.includes(c.id));
  const critErr = crit.filter((c) => c.status === "ERROR" || c.status === "TIMEOUT");
  const critOff = crit.filter((c) => c.status === "OFFLINE");
  const other = cards.filter((c) => !CRITICAL.includes(c.id) && (PROBLEM.includes(c.status) || c.status === "LOADING"));
  const ids = (list) => list.map((c) => c.id).join(", ");
  const lastChecked = new Date().toISOString();
  if (critErr.length)
    return { status: "ERROR", lastChecked, reasonKm: `Critical service មានបញ្ហា: ${ids(critErr)}`, reasonEn: `Critical service problem: ${ids(critErr)}` };
  if (critOff.length)
    return { status: "OFFLINE", lastChecked, reasonKm: `Critical service មិនអាចប្រើបាន: ${ids(critOff)}`, reasonEn: `Critical service unavailable: ${ids(critOff)}` };
  if (other.length)
    return { status: "DEGRADED", lastChecked, reasonKm: `ប្រព័ន្ធអាចប្រើបាន ប៉ុន្តែមានបញ្ហា: ${ids(other)}`, reasonEn: `Usable, but problems in: ${ids(other)}` };
  return { status: "HEALTHY", lastChecked, reasonKm: "Core services ចាំបាច់ទាំងអស់ឆ្លើយតបបាន", reasonEn: "All required core services respond" };
}

export async function collectStatus(aiCore) {
  const cards = await Promise.all([
    probe("core", API_HEALTH_TIMEOUT_MS, async () => {
      if (typeof aiCore?.chat !== "function") throw new Error("aiCore.chat is not a function");
      return { status: "ONLINE", reasonKm: "AI Core កំពុងដំណើរការ និងមាន chat()", reasonEn: "AI Core is running and exposes chat()", module: String(aiCore.provider) };
    }),

    probe("model", API_HEALTH_TIMEOUT_MS, async () => {
      if (!aiCore?.provider)
        return { status: "OFFLINE", reasonKm: "រកមិនឃើញ provider ក្នុង configuration", reasonEn: "No provider in model configuration" };
      const busy = active.chat > 0;
      return {
        status: pickStatus(["READY", busy ? "ACTIVE" : "READY"]),
        reasonKm: busy ? "Model កំពុង process request" : "Model configuration មាន និងអាចប្រើបាន",
        reasonEn: busy ? "Model is processing a request" : "Model configuration exists and is usable",
        module: String(aiCore.provider),
      };
    }),

    probe("memory", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./memory.mjs");
      if (typeof m.AIMemory !== "function") throw new Error("AIMemory class not found");
      return { status: "READY", reasonKm: "Module load បាន (មិនទាន់តេស្ត read/write)", reasonEn: "Module loads (read/write not tested)", module: "memory.mjs" };
    }),

    probe("learning", LEARN_TIMEOUT_MS, async () => {
      const m = await loadModule("./learn.mjs");
      if (typeof m.handleLearn !== "function") throw new Error("handleLearn not found");
      const data = m.load();
      if (data === null || typeof data !== "object") throw new Error("learned data is not readable");
      const busy = active.learn > 0;
      return {
        status: pickStatus(["READY", busy ? "ACTIVE" : "READY"]),
        reasonKm: `អានទិន្នន័យដែលបានរៀនបាន (${Object.keys(data).length} ធាតុ)`,
        reasonEn: `Learned data readable (${Object.keys(data).length} entries)`,
        module: "learn.mjs",
      };
    }),

    probe("knowledge", KNOWLEDGE_TIMEOUT_MS, async () => {
      const m = await loadModule("./knowledge.mjs");
      const dbs = Object.entries(m).filter(([, v]) => Array.isArray(v));
      if (dbs.length === 0) throw new Error("no knowledge DB exported");
      m.searchTechDB("test");
      const total = dbs.reduce((n, [, v]) => n + v.length, 0);
      return { status: "READY", reasonKm: `អានបាន ${dbs.length} DB (${total} ធាតុ)`, reasonEn: `Readable: ${dbs.length} DBs (${total} entries)`, module: "knowledge.mjs" };
    }),

    probe("english", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./english.mjs");
      if (typeof m.englishReply !== "function") throw new Error("englishReply not found");
      await m.englishReply("hello", {});
      const dev = DEVELOPING_MODULES.includes("english");
      return {
        status: dev ? "DEVELOPING" : "READY",
        reasonKm: dev ? "Module ដំណើរការ តែ knowledge នៅកំពុងបន្ថែម" : "English module អាចប្រើបាន",
        reasonEn: dev ? "Module runs; knowledge still being added" : "English module usable",
        module: "english.mjs",
      };
    }),

    probe("khmer", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./khoem.mjs");
      const r = await m.khoemReply([{ content: "/help" }]);
      if (typeof r !== "string" || r.length === 0) throw new Error("khoemReply returned no text");
      return { status: "READY", reasonKm: "khoemReply ឆ្លើយតបបាន", reasonEn: "khoemReply responds", module: "khoem.mjs" };
    }),

    probe("tools", TOOL_TIMEOUT_MS, async () => {
      const t = await loadModule("./tools.mjs");
      const f = await loadModule("./find.mjs");
      const found = [
        typeof t.funcs === "function" && "funcs",
        typeof t.check === "function" && "check",
        typeof f.find === "function" && "find",
      ].filter(Boolean);
      if (found.length === 0) throw new Error("no tools found");
      const busy = active.tool > 0;
      return {
        status: pickStatus(["READY", busy ? "ACTIVE" : "READY"]),
        reasonKm: `រកឃើញ tools: ${found.join(", ")}`,
        reasonEn: `Tools found: ${found.join(", ")}`,
        module: "tools.mjs",
      };
    }),
  ]);

  cards.push({
    id: "session",
    status: "UNKNOWN",
    reasonKm: "មិនទាន់មានការត្រួតពិនិត្យ session ក្នុង server",
    reasonEn: "No session check implemented on the server yet",
    lastChecked: new Date().toISOString(),
  });

  return { checkedAt: new Date().toISOString(), system: systemHealth(cards), cards };
}
