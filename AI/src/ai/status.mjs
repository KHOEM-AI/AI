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
import { checkModelHealth } from "./model.mjs";
import { checkSessionHealth } from "./session.mjs";

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

    probe("model", API_HEALTH_TIMEOUT_MS, async () => checkModelHealth(aiCore, active)),

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
      const mc = typeof m.matchLearned === "function" ? m.matchLearned("__healthcheck__") : null;
      if (!mc || !["HIGH", "MEDIUM", "UNCERTAIN"].includes(mc.confidence)) throw new Error("matchLearned confidence check failed");
      const busy = active.learn > 0;
      return {
        status: pickStatus(["READY", busy ? "ACTIVE" : "READY"]),
        reasonKm: `អានទិន្នន័យដែលបានរៀនបាន (${Object.keys(data).length} ធាតុ)`,
        reasonEn: `Learned data readable (${Object.keys(data).length} entries)`,
        module: "learn.mjs + matchLearned",
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

    probe("session", API_HEALTH_TIMEOUT_MS, async () => checkSessionHealth(aiCore)),

    probe("codeDataCenter", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./codeDataCenter.mjs");
      if (!m.isReady()) m.scanRepo();
      const { files } = m.getFileIndex();
      if (!Array.isArray(files) || files.length === 0) throw new Error("file index is empty after scan");
      return {
        status: "READY",
        reasonKm: `Index មានឯកសារ ${files.length} ក្នុងប្រព័ន្ធ`,
        reasonEn: `File index has ${files.length} files`,
        module: "codeDataCenter.mjs",
      };
    }),

    probe("approvals", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./approvals.mjs");
      const list = m.listApprovals();
      if (!Array.isArray(list)) throw new Error("bad approvals");
      return { status: "READY", reasonKm: `សំណើអនុញ្ញាត ${list.length}`, reasonEn: `Approvals: ${list.length}`, module: "approvals.mjs" };
    }),
    probe("audit", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./audit.mjs");
      const r = m.verifyAuditChain();
      if (!(r === true || (r && r.ok !== false))) throw new Error("audit fail");
      return { status: "READY", reasonKm: "Hash chain ត្រឹមត្រូវ", reasonEn: "Hash chain verified", module: "audit.mjs" };
    }),
    probe("budget", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./budget.mjs");
      const list = m.listBudgets();
      if (!Array.isArray(list)) throw new Error("bad budgets");
      return { status: "READY", reasonKm: `ថវិកា ${list.length}`, reasonEn: `Budgets: ${list.length}`, module: "budget.mjs" };
    }),
    probe("circuitBreaker", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./circuitBreaker.mjs");
      const list = m.listBreakers();
      if (!Array.isArray(list)) throw new Error("bad breakers");
      return { status: "READY", reasonKm: `Breaker ${list.length}`, reasonEn: `Breakers: ${list.length}`, module: "circuitBreaker.mjs" };
    }),
    probe("killswitch", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./killswitch.mjs");
      const active = m.isKilled();
      return { status: active ? "ACTIVE" : "READY", reasonKm: active ? "ផ្អាកកំពុងសកម្ម" : "រួចរាល់", reasonEn: active ? "Halted" : "Ready", module: "killswitch.mjs" };
    }),
    probe("retry", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./retry.mjs");
      if (typeof m.retryIdempotent !== "function") throw new Error("bad retry");
      return { status: "READY", reasonKm: "ព្យាយាមឡើងវិញអាចប្រើបាន", reasonEn: "Retry available", module: "retry.mjs" };
    }),
    probe("rollback", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./rollback.mjs");
      const list = m.listSnapshots();
      if (!Array.isArray(list)) throw new Error("bad snapshots");
      return { status: "READY", reasonKm: `Snapshot ${list.length}`, reasonEn: `Snapshots: ${list.length}`, module: "rollback.mjs" };
    }),
    probe("sandbox", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./sandbox.mjs");
      if (typeof m.runSandboxTest !== "function") throw new Error("bad sandbox");
      return { status: "READY", reasonKm: "Sandbox អាចប្រើបាន", reasonEn: "Sandbox available", module: "sandbox.mjs" };
    }),
    probe("verification", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./verification.mjs");
      const s = m.getVerificationStatuses();
      if (!s) throw new Error("bad verification");
      return { status: "READY", reasonKm: "ការផ្ទៀងផ្ទាត់អាចអានបាន", reasonEn: "Verification readable", module: "verification.mjs" };
    }),

    probe("permission", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./permission.mjs");
      const reg = await loadModule("./policyRegistry.mjs");
      const pv = m.getPolicyVersion();
      if (!pv) throw new Error("bad permission");
      const v = reg.validatePolicyRegistry();
      if (!v.ok) throw new Error("policy registry invalid: " + v.problems.length + " problem(s)");
      const n = Object.keys(reg.REGISTRY).length;
      return { status: "READY", reasonKm: `Policy v${pv} (${n} សកម្មភាព ត្រឹមត្រូវ)`, reasonEn: `Policy v${pv} (${n} actions, valid)`, module: "permission.mjs + policyRegistry.mjs" };
    }),
    probe("modelRouting", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./modelRouting.mjs");
      const list = m.listProviders();
      if (!Array.isArray(list)) throw new Error("bad providers");
      return { status: "READY", reasonKm: `Provider ${list.length}`, reasonEn: `Providers: ${list.length}`, module: "modelRouting.mjs" };
    }),
    probe("goal", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./goal.mjs");
      const list = m.listGoals();
      if (!Array.isArray(list)) throw new Error("bad goals");
      return { status: "READY", reasonKm: `គោលដៅ ${list.length}`, reasonEn: `Goals: ${list.length}`, module: "goal.mjs" };
    }),
    probe("ideas", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./ideas.mjs");
      const list = m.listIdeas();
      if (!Array.isArray(list)) throw new Error("bad ideas");
      return { status: "READY", reasonKm: `គំនិត ${list.length}`, reasonEn: `Ideas: ${list.length}`, module: "ideas.mjs" };
    }),
    probe("planning", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./planning.mjs");
      const list = m.listPlans();
      if (!Array.isArray(list)) throw new Error("bad plans");
      return { status: "READY", reasonKm: `ផែនការ ${list.length}`, reasonEn: `Plans: ${list.length}`, module: "planning.mjs" };
    }),
    probe("experiments", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./experiments.mjs");
      const list = m.listExperiments();
      if (!Array.isArray(list)) throw new Error("bad experiments");
      return { status: "READY", reasonKm: `ពិសោធន៍ ${list.length}`, reasonEn: `Experiments: ${list.length}`, module: "experiments.mjs" };
    }),
    probe("enginesSummary", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./enginesSummary.mjs");
      const s = m.summarizeEngines();
      if (!s) throw new Error("bad summary");
      return { status: "READY", reasonKm: "សេចក្តីសង្ខេបខួរអាចអានបាន", reasonEn: "Engine summary readable", module: "enginesSummary.mjs" };
    }),
    probe("selfConsistency", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./selfConsistency.mjs");
      const r = m.analyzeConsistency(["ping", "ping"]);
      if (!r) throw new Error("bad consistency");
      return { status: "READY", reasonKm: "ត្រួតពិនិត្យភាពស៊ីសង្វាក់បាន", reasonEn: "Consistency check ran", module: "selfConsistency.mjs" };
    }),

    probe("selfEval", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./selfEval.mjs");
      const s = m.getEvalStats();
      if (!s) throw new Error("bad selfEval");
      return { status: "READY", reasonKm: "ស្ថិតិវាយតម្លៃខ្លួនឯងអាចអានបាន", reasonEn: "Self-eval stats readable", module: "selfEval.mjs" };
    }),
    probe("metrics", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./metrics.mjs");
      const s = m.getMetrics();
      if (!s) throw new Error("bad metrics");
      return { status: "READY", reasonKm: "ម៉ែត្រិកអាចប្រមូលបាន", reasonEn: "Metrics working", module: "metrics.mjs" };
    }),
    probe("patch", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./patch.mjs");
      const list = m.listProposals();
      if (!Array.isArray(list)) throw new Error("bad patch");
      return { status: "READY", reasonKm: `ស្នើកែកូដ ${list.length}`, reasonEn: `Patches: ${list.length}`, module: "patch.mjs" };
    }),
    probe("tasks", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./tasks.mjs");
      const list = m.getAllTasks();
      if (!Array.isArray(list)) throw new Error("bad tasks");
      return { status: "READY", reasonKm: `ការងារ ${list.length}`, reasonEn: `Tasks: ${list.length}`, module: "tasks.mjs" };
    }),
    probe("chinese", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./chinese.mjs");
      if (typeof m.chineseReply !== "function") throw new Error("bad chinese");
      const dev = DEVELOPING_MODULES.includes("chinese");
      return { status: dev ? "DEVELOPING" : "READY", reasonKm: "ខួរភាសាចិនកំពុងអភិវឌ្ឍ", reasonEn: "Chinese brain developing", module: "chinese.mjs" };
    }),
    probe("thai", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./thai.mjs");
      if (typeof m.thaiReply !== "function") throw new Error("bad thai");
      const dev = DEVELOPING_MODULES.includes("thai");
      return { status: dev ? "DEVELOPING" : "READY", reasonKm: "ខួរភាសាថៃកំពុងអភិវឌ្ឍ", reasonEn: "Thai brain developing", module: "thai.mjs" };
    }),
    probe("langCheckers", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./langCheckers.mjs");
      const list = m.listSupportedLanguages();
      if (!Array.isArray(list)) throw new Error("bad langCheckers");
      return { status: "READY", reasonKm: `គាំទ្រភាសា ${list.length}`, reasonEn: `Languages: ${list.length}`, module: "langCheckers.mjs" };
    }),
    probe("languageCenter", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./languageCenter.mjs");
      const list = m.listSupportedLanguages();
      if (!Array.isArray(list)) throw new Error("bad languageCenter");
      return { status: "READY", reasonKm: `កណ្តាលភាសា ${list.length}`, reasonEn: `Center languages: ${list.length}`, module: "languageCenter.mjs" };
    }),
    probe("languageRegistry", API_HEALTH_TIMEOUT_MS, async () => {
      const m = await loadModule("./languageRegistry.mjs");
      const keys = Object.keys(m.LANGUAGE_REGISTRY || {});
      if (keys.length === 0) throw new Error("bad registry");
      return { status: "READY", reasonKm: `ចុះបញ្ជីភាសា ${keys.length}`, reasonEn: `Registry: ${keys.length}`, module: "languageRegistry.mjs" };
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
  WAITING: ['RUNNING', 'TIMEOUT', 'CANCELLED', 'FAILED'],
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
    if (this.state.task !== next && !allowed.includes(next)) {
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
