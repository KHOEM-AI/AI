import fs from "node:fs";

console.log("=== PHASE 2: MODEL + SESSION layer, bugfix, tests ===");

// ---- 1. src/ai/model.mjs ----
const MODEL_FILE = "src/ai/model.mjs";
if (fs.existsSync(MODEL_FILE)) {
  console.log("⚠️  model.mjs already exists — skipping creation");
} else {
  const modelContent = `// src/ai/model.mjs
// MODEL layer (Part 1 #9): model configuration, availability, health, routing.
// Single source of truth for model health — used by status.mjs.

export function checkModelHealth(aiCore, active) {
  if (!aiCore || !aiCore.provider) {
    return {
      status: "OFFLINE",
      reasonKm: "រកមិនឃើញ provider ក្នុង configuration",
      reasonEn: "No provider in model configuration",
    };
  }
  const busy = active.chat > 0;
  return {
    status: busy ? "ACTIVE" : "READY",
    reasonKm: busy ? "Model កំពុង process request" : "Model configuration មាន និងអាចប្រើបាន",
    reasonEn: busy ? "Model is processing a request" : "Model configuration exists and is usable",
    module: String(aiCore.provider),
  };
}

export function getModelInfo(aiCore) {
  return {
    provider: aiCore && aiCore.provider ? String(aiCore.provider) : null,
    configured: !!(aiCore && aiCore.provider),
  };
}
`;
  fs.writeFileSync(MODEL_FILE, modelContent, "utf8");
  console.log("✅ created", MODEL_FILE);
}

// ---- 2. src/ai/session.mjs ----
const SESSION_FILE = "src/ai/session.mjs";
if (fs.existsSync(SESSION_FILE)) {
  console.log("⚠️  session.mjs already exists — skipping creation");
} else {
  const sessionContent = `// src/ai/session.mjs
// SESSION layer (Part 1 #10): session lifecycle, state, timeout, conversation state.
// checkSessionHealth is the single source of truth used by status.mjs.

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const sessions = new Map();

export const SESSION_STATE = Object.freeze({
  ACTIVE: "ACTIVE",
  IDLE: "IDLE",
  EXPIRED: "EXPIRED",
});

export function checkSessionHealth(aiCore) {
  const mem = aiCore && aiCore.memory;
  if (!mem || typeof mem.add !== "function" || typeof mem.get !== "function") {
    throw new Error("session memory interface missing");
  }
  return {
    status: "READY",
    reasonKm: "Session memory មាន add/get និងអាចប្រើបាន",
    reasonEn: "Session memory exposes add/get and is usable",
    module: "memory.mjs",
  };
}

export function startSession(sessionId) {
  const now = Date.now();
  const s = { createdAt: now, lastActiveAt: now, state: SESSION_STATE.ACTIVE };
  sessions.set(sessionId, s);
  return s;
}

export function touchSession(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  s.lastActiveAt = Date.now();
  s.state = SESSION_STATE.ACTIVE;
  return s;
}

export function getSessionState(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  const idleMs = Date.now() - s.lastActiveAt;
  if (idleMs > SESSION_TIMEOUT_MS) s.state = SESSION_STATE.EXPIRED;
  else if (idleMs > SESSION_TIMEOUT_MS / 2) s.state = SESSION_STATE.IDLE;
  return { ...s, idleMs };
}

export function endSession(sessionId) {
  return sessions.delete(sessionId);
}

export function activeSessionCount() {
  let n = 0;
  for (const s of sessions.values()) {
    if (s.state !== SESSION_STATE.EXPIRED) n++;
  }
  return n;
}
`;
  fs.writeFileSync(SESSION_FILE, sessionContent, "utf8");
  console.log("✅ created", SESSION_FILE);
}

// ---- 3. patch status.mjs ----
const STATUS_FILE = "src/ai/status.mjs";
let src = fs.readFileSync(STATUS_FILE, "utf8");
fs.writeFileSync(STATUS_FILE + ".bak-phase2", src, "utf8");
console.log("✅ backup saved:", STATUS_FILE + ".bak-phase2");
let changed = false;

const importAnchor = `import { recordAuditEvent } from "./audit.mjs";`;
if (src.includes(importAnchor) && !src.includes('from "./model.mjs"')) {
  src = src.replace(importAnchor,
    `import { recordAuditEvent } from "./audit.mjs";\nimport { checkModelHealth } from "./model.mjs";\nimport { checkSessionHealth } from "./session.mjs";`);
  changed = true;
}

const modelAnchor = `    probe("model", API_HEALTH_TIMEOUT_MS, async () => {
      if (!aiCore?.provider)
        return { status: "OFFLINE", reasonKm: "រកមិនឃើញ provider ក្នុង configuration", reasonEn: "No provider in model configuration" };
      const busy = active.chat > 0;
      return {
        status: pickStatus(["READY", busy ? "ACTIVE" : "READY"]),
        reasonKm: busy ? "Model កំពុង process request" : "Model configuration មាន និងអាចប្រើបាន",
        reasonEn: busy ? "Model is processing a request" : "Model configuration exists and is usable",
        module: String(aiCore.provider),
      };
    }),`;
if (src.includes(modelAnchor)) {
  src = src.replace(modelAnchor, `    probe("model", API_HEALTH_TIMEOUT_MS, async () => checkModelHealth(aiCore, active)),`);
  changed = true;
} else if (!src.includes("checkModelHealth(aiCore, active)")) {
  console.log("⚠️  model probe anchor not found — check manually");
}

const sessionAnchor = `    probe("session", API_HEALTH_TIMEOUT_MS, async () => {
      const mem = aiCore?.memory;
      if (!mem || typeof mem.add !== "function" || typeof mem.get !== "function")
        throw new Error("session memory interface missing");
      return { status: "READY", reasonKm: "Session memory មាន add/get និងអាចប្រើបាន", reasonEn: "Session memory exposes add/get and is usable", module: "memory.mjs" };
    }),`;
if (src.includes(sessionAnchor)) {
  src = src.replace(sessionAnchor, `    probe("session", API_HEALTH_TIMEOUT_MS, async () => checkSessionHealth(aiCore)),`);
  changed = true;
} else if (!src.includes("checkSessionHealth(aiCore)")) {
  console.log("⚠️  session probe anchor not found — check manually");
}

// 3d. bugfix: illegal task transition guard
const taskAnchor = `  setTaskState(next) {
    if (!Object.values(TASK_STATE).includes(next)) {
      throw new Error(\`Invalid TASK_STATE: \${next}\`);
    }
    const allowed = TASK_TRANSITIONS[this.state.task] || [];
    if (this.state.task !== next && allowed.length && !allowed.includes(next)) {
      throw new Error(\`Illegal task transition: \${this.state.task} -> \${next}\`);
    }
    this._emit(\`TASK_\${next}\`, { task: next });
  }`;
const taskFixed = `  setTaskState(next) {
    if (!Object.values(TASK_STATE).includes(next)) {
      throw new Error(\`Invalid TASK_STATE: \${next}\`);
    }
    const allowed = TASK_TRANSITIONS[this.state.task] || [];
    if (this.state.task !== next && !allowed.includes(next)) {
      throw new Error(\`Illegal task transition: \${this.state.task} -> \${next}\`);
    }
    this._emit(\`TASK_\${next}\`, { task: next });
  }`;
if (src.includes(taskAnchor)) {
  src = src.replace(taskAnchor, taskFixed);
  changed = true;
  console.log("✅ fixed setTaskState() terminal-state bug");
} else if (!src.includes("this.state.task !== next && !allowed.includes(next)")) {
  console.log("⚠️  setTaskState anchor not found — check manually");
}

if (changed) {
  fs.writeFileSync(STATUS_FILE, src, "utf8");
  console.log("✅ patched", STATUS_FILE);
}

// ---- 4. package.json: add vitest + test script ----
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
let pkgChanged = false;
if (!pkg.scripts) pkg.scripts = {};
if (!pkg.scripts.test) { pkg.scripts.test = "vitest run"; pkgChanged = true; }
if (!pkg.devDependencies) pkg.devDependencies = {};
if (!pkg.devDependencies.vitest) { pkg.devDependencies.vitest = "^2.1.1"; pkgChanged = true; }
if (pkgChanged) {
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n", "utf8");
  console.log("✅ patched package.json");
} else {
  console.log("⚠️  package.json already has vitest/test — skipped");
}

// ---- 5. tests ----
const TEST_DIR = "src/ai/__tests__";
if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });

function writeTest(file, content) {
  if (fs.existsSync(file)) { console.log("⚠️ ", file, "exists — skipped"); return; }
  fs.writeFileSync(file, content, "utf8");
  console.log("✅ created", file);
}

writeTest(TEST_DIR + "/audit.test.mjs", `import { describe, it, expect } from "vitest";
import { recordAuditEvent, readRecentAuditEvents } from "../audit.mjs";

describe("audit.mjs", () => {
  it("records and scrubs secrets", () => {
    recordAuditEvent("TEST_EVENT", { password: "secret", note: "ok" });
    const events = readRecentAuditEvents(5);
    const found = events.find((e) => e.event === "TEST_EVENT");
    expect(found).toBeTruthy();
    expect(found.data.password).toBeUndefined();
    expect(found.data.note).toBe("ok");
  });

  it("never throws on circular data", () => {
    const circ = {}; circ.self = circ;
    expect(() => recordAuditEvent("CIRCULAR_TEST", circ)).not.toThrow();
  });
});
`);

writeTest(TEST_DIR + "/model.test.mjs", `import { describe, it, expect } from "vitest";
import { checkModelHealth, getModelInfo } from "../model.mjs";

describe("model.mjs", () => {
  it("OFFLINE when no provider", () => {
    expect(checkModelHealth({}, { chat: 0 }).status).toBe("OFFLINE");
  });
  it("READY when idle with provider", () => {
    expect(checkModelHealth({ provider: "khoem-local" }, { chat: 0 }).status).toBe("READY");
  });
  it("ACTIVE when busy", () => {
    expect(checkModelHealth({ provider: "khoem-local" }, { chat: 1 }).status).toBe("ACTIVE");
  });
  it("getModelInfo reflects config", () => {
    expect(getModelInfo({}).configured).toBe(false);
    expect(getModelInfo({ provider: "x" }).configured).toBe(true);
  });
});
`);

writeTest(TEST_DIR + "/session.test.mjs", `import { describe, it, expect } from "vitest";
import { checkSessionHealth, startSession, touchSession, getSessionState, endSession, activeSessionCount, SESSION_STATE } from "../session.mjs";

describe("session.mjs", () => {
  it("throws when memory interface missing", () => {
    expect(() => checkSessionHealth({})).toThrow();
  });
  it("passes when memory has add/get", () => {
    expect(checkSessionHealth({ memory: { add: () => {}, get: () => [] } }).status).toBe("READY");
  });
  it("lifecycle: start, touch, end", () => {
    startSession("s1");
    expect(activeSessionCount()).toBeGreaterThan(0);
    expect(touchSession("s1").state).toBe(SESSION_STATE.ACTIVE);
    expect(getSessionState("s1").state).toBe(SESSION_STATE.ACTIVE);
    endSession("s1");
    expect(getSessionState("s1")).toBeNull();
  });
});
`);

writeTest(TEST_DIR + "/status.test.mjs", `import { describe, it, expect } from "vitest";
import { aiStatus, TASK_STATE, SAFETY_STATE, CONFIDENCE_STATE } from "../status.mjs";

describe("status.mjs state machine", () => {
  it("rejects transitions out of a terminal task state", () => {
    aiStatus.reset();
    aiStatus.startTask("t1");
    aiStatus.setTaskState(TASK_STATE.QUEUED);
    aiStatus.setTaskState(TASK_STATE.RUNNING);
    aiStatus.setTaskState(TASK_STATE.COMPLETED);
    expect(() => aiStatus.setTaskState(TASK_STATE.RUNNING)).toThrow();
  });
  it("rejects invalid SAFETY_STATE", () => {
    aiStatus.reset();
    expect(() => aiStatus.setSafetyState("BOGUS")).toThrow();
    aiStatus.setSafetyState(SAFETY_STATE.REVIEW_REQUIRED);
    expect(aiStatus.getState().safety).toBe(SAFETY_STATE.REVIEW_REQUIRED);
  });
  it("rejects invalid CONFIDENCE_STATE", () => {
    aiStatus.reset();
    expect(() => aiStatus.setConfidenceState("BOGUS")).toThrow();
    aiStatus.setConfidenceState(CONFIDENCE_STATE.LOW);
    expect(aiStatus.getState().confidence).toBe(CONFIDENCE_STATE.LOW);
  });
});
`);

console.log("\nNext: npm install && npx tsc --noEmit && npm run build && npx vitest run");
