// src/ai/status.mjs
// Single source of truth: backend status (collectStatus) + state machine (aiStatus)
import { performance } from "node:perf_hooks";
import {
  API_HEALTH_TIMEOUT_MS,
  KNOWLEDGE_TIMEOUT_MS,
  LEARN_TIMEOUT_MS,
  TOOL_TIMEOUT_MS,
  DEVELOPING_MODULES,
} from "../config/timeouts.mjs";
import { recordAuditEvent } from "./audit.mjs";

// Actual count of requests currently in progress (used for ACTIVE)
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

// Do not expose file path or stack trace in error output
const safeMsg = (m) =>
  String(m ?? "unknown error").replace(/(file:\/\/)?(\/[^\s:'"]+)+/g, "[path]").slice(0, 200);

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
        reasonKm: "Module មិនអាច load បាន", reasonEn: "Module could not be loaded", error: safeMsg(e.message) };
    }
    return { id, lastChecked, responseTimeMs, status: "ERROR",
      reasonKm: "ប្រតិបត្តិការបរាជ័យ", reasonEn: "Operation failed", error: safeMsg(e && e.message) };
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

// ---- Phase 1: status schema extension (available / lastSuccessfulCheck / stale / version) ----
const STALE_AFTER_MS = 30000;
const APP_VERSION = process.env.npm_package_version || "unknown";
const lastOk = new Map();

function enrichCards(cards) {
  return cards.map((c) => {
    const ok = !PROBLEM.includes(c.status) && c.status !== "UNKNOWN";
    if (ok) lastOk.set(c.id, c.lastChecked);
    const last = lastOk.get(c.id) || null;
    const stale = !last || Date.now() - Date.parse(last) > STALE_AFTER_MS;
    return { ...c, available: ok, lastSuccessfulCheck: last, stale, version: APP_VERSION };
  });
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
      const mem = new m.AIMemory(); // instance ដាច់ដោយឡែក មិនប៉ះ session ពិត
      mem.add("__healthcheck__", { role: "user", content: "ping" });
      const got = mem.get("__healthcheck__");
      if (!Array.isArray(got) || got.length !== 1) throw new Error("memory write/read check failed");
      return { status: "READY", reasonKm: "សាកល្បង write/read ក្នុង memory បានជោគជ័យ", reasonEn: "Memory write/read test passed", module: "memory.mjs" };
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

    probe("session", API_HEALTH_TIMEOUT_MS, async () => {
      const mem = aiCore?.memory;
      if (!mem || typeof mem.add !== "function" || typeof mem.get !== "function")
        throw new Error("session memory interface missing");
      return { status: "READY", reasonKm: "Session memory មាន add/get និងអាចប្រើបាន", reasonEn: "Session memory exposes add/get and is usable", module: "memory.mjs" };
    }),
  ]);

  const enriched = enrichCards(cards);
  return { checkedAt: new Date().toISOString(), system: systemHealth(enriched), cards: enriched };
}

// ================= STATE MACHINE (Task / Execution / Cognitive) =================


// ---------- ENUMS ----------

export const SERVICE_STATE = Object.freeze({
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  ERROR: 'ERROR',
  TIMEOUT: 'TIMEOUT',
});

export const TASK_STATE = Object.freeze({
  CREATED: 'CREATED',
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  WAITING: 'WAITING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  TIMEOUT: 'TIMEOUT',
});

export const EXECUTION_STATE = Object.freeze({
  IDLE: 'IDLE',
  THINKING: 'THINKING',
  TOOL_CALL: 'TOOL_CALL',
  RETRIEVING: 'RETRIEVING',
  LEARNING: 'LEARNING',
  RESPONDING: 'RESPONDING',
});

export const COGNITIVE_STATE = Object.freeze({
  UNDERSTANDING: 'UNDERSTANDING',
  PLANNING: 'PLANNING',
  REASONING: 'REASONING',
  VERIFYING: 'VERIFYING',
  ANSWERING: 'ANSWERING',
});

export const SAFETY_STATE = Object.freeze({
  SAFE: 'SAFE',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
  BLOCKED: 'BLOCKED',
});

export const CONFIDENCE_STATE = Object.freeze({
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  UNCERTAIN: 'UNCERTAIN',
});

// Legal task transitions — prevents e.g. COMPLETED -> RUNNING by mistake
const TASK_TRANSITIONS = {
  CREATED: ['QUEUED', 'CANCELLED'],
  QUEUED: ['RUNNING', 'CANCELLED', 'TIMEOUT'],
  RUNNING: ['WAITING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT'],
  WAITING: ['RUNNING', 'TIMEOUT', 'CANCELLED'],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
  TIMEOUT: [],
};

const MAX_HISTORY = 100;

function createInitialState() {
  return {
    service: SERVICE_STATE.ONLINE,
    task: TASK_STATE.CREATED,
    execution: EXECUTION_STATE.IDLE,
    cognitive: null,
    safety: SAFETY_STATE.SAFE,
    confidence: CONFIDENCE_STATE.MEDIUM,
    taskId: null,
    updatedAt: new Date().toISOString(),
    history: [], // event trace for debug/audit — not shown to end user
  };
}

// ---------- STATE MACHINE ----------

class AIStatus {
  constructor() {
    this.state = createInitialState();
    this.listeners = new Set();
  }

  getState() {
    return { ...this.state };
  }

  getTrace() {
    return [...this.state.history];
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _emit(eventName, patch) {
    this.state = {
      ...this.state,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.state.history.push({ event: eventName, at: this.state.updatedAt });
    if (this.state.history.length > MAX_HISTORY) this.state.history.shift();
    recordAuditEvent(eventName, { taskId: this.state.taskId, patch });
    for (const fn of this.listeners) fn(this.getState());
  }

  // ---- Service ----
  setServiceState(next) {
    if (!Object.values(SERVICE_STATE).includes(next)) {
      throw new Error(`Invalid SERVICE_STATE: ${next}`);
    }
    this._emit(`SERVICE_${next}`, { service: next });
  }

  // ---- Task ----
  startTask(taskId) {
    this.state.taskId = taskId;
    this._emit('TASK_CREATED', { task: TASK_STATE.CREATED, taskId });
  }

  setTaskState(next) {
    if (!Object.values(TASK_STATE).includes(next)) {
      throw new Error(`Invalid TASK_STATE: ${next}`);
    }
    const allowed = TASK_TRANSITIONS[this.state.task] || [];
    if (this.state.task !== next && allowed.length && !allowed.includes(next)) {
      throw new Error(`Illegal task transition: ${this.state.task} -> ${next}`);
    }
    this._emit(`TASK_${next}`, { task: next });
  }

  // ---- Execution ----
  setExecutionState(next) {
    if (!Object.values(EXECUTION_STATE).includes(next)) {
      throw new Error(`Invalid EXECUTION_STATE: ${next}`);
    }
    this._emit(`EXEC_${next}`, { execution: next });
  }

  // ---- Cognitive ----
  setCognitiveState(next) {
    if (next !== null && !Object.values(COGNITIVE_STATE).includes(next)) {
      throw new Error(`Invalid COGNITIVE_STATE: ${next}`);
    }
    this._emit(next ? `COGNITIVE_${next}` : 'COGNITIVE_CLEARED', { cognitive: next });
  }

  // ---- Safety ----
  setSafetyState(next) {
    if (!Object.values(SAFETY_STATE).includes(next)) {
      throw new Error(`Invalid SAFETY_STATE: ${next}`);
    }
    this._emit(`SAFETY_${next}`, { safety: next });
  }

  // ---- Confidence ----
  setConfidenceState(next) {
    if (!Object.values(CONFIDENCE_STATE).includes(next)) {
      throw new Error(`Invalid CONFIDENCE_STATE: ${next}`);
    }
    this._emit(`CONFIDENCE_${next}`, { confidence: next });
  }

  reset() {
    this.state = createInitialState();
  }
}

export const aiStatus = new AIStatus();
export default aiStatus;
