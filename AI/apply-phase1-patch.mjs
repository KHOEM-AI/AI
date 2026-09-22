import fs from "node:fs";

const AUDIT_FILE = "src/ai/audit.mjs";
const STATUS_FILE = "src/ai/status.mjs";

// ---- 1. Create audit.mjs (new file — persistent event log) ----
if (fs.existsSync(AUDIT_FILE)) {
  console.log("⚠️  audit.mjs already exists — skipping creation");
} else {
  const auditContent = `// src/ai/audit.mjs
// Persistent, append-only audit/event log (JSONL).
// Never throws — a logging failure must not break the AI pipeline.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "..", "data");
const LOG_FILE = path.join(LOG_DIR, "audit-log.jsonl");
const MAX_FIELD_LEN = 500;

function safeTrim(v) {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s && s.length > MAX_FIELD_LEN ? s.slice(0, MAX_FIELD_LEN) + "...[truncated]" : s;
}

// Never write secrets/keys into the audit log
function scrub(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const clone = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/key|secret|token|password/i.test(k)) continue;
    clone[k] = typeof v === "string" ? safeTrim(v) : v;
  }
  return clone;
}

export function recordAuditEvent(eventName, data = {}) {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    const entry = {
      event: eventName,
      at: new Date().toISOString(),
      data: scrub(data),
    };
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\\n", "utf8");
  } catch (e) {
    // Audit logging must never crash the app.
    console.error("[audit] write failed:", e && e.message);
  }
}

export function readRecentAuditEvents(limit = 50) {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const lines = fs.readFileSync(LOG_FILE, "utf8").trim().split("\\n").filter(Boolean);
    return lines.slice(-limit).map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch (e) {
    return [];
  }
}
`;
  fs.writeFileSync(AUDIT_FILE, auditContent, "utf8");
  console.log("✅ created", AUDIT_FILE);
}

// ---- 2. Patch status.mjs (additive, with backup) ----
let src = fs.readFileSync(STATUS_FILE, "utf8");
const backup = STATUS_FILE + ".bak-phase1";
fs.writeFileSync(backup, src, "utf8");
console.log("✅ backup saved:", backup);

let changed = false;

// 2a. Import audit module
const importAnchor = `} from "../config/timeouts.mjs";`;
if (src.includes(importAnchor) && !src.includes('from "./audit.mjs"')) {
  src = src.replace(
    importAnchor,
    `} from "../config/timeouts.mjs";\nimport { recordAuditEvent } from "./audit.mjs";`
  );
  changed = true;
}

// 2b. Add SAFETY_STATE and CONFIDENCE_STATE enums after COGNITIVE_STATE
const cogAnchor = `export const COGNITIVE_STATE = Object.freeze({
  UNDERSTANDING: 'UNDERSTANDING',
  PLANNING: 'PLANNING',
  REASONING: 'REASONING',
  VERIFYING: 'VERIFYING',
  ANSWERING: 'ANSWERING',
});`;
const newEnums = `

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
});`;
if (src.includes(cogAnchor) && !src.includes("SAFETY_STATE")) {
  src = src.replace(cogAnchor, cogAnchor + newEnums);
  changed = true;
}

// 2c. Extend createInitialState with safety/confidence defaults
const initAnchor = `    cognitive: null,
    taskId: null,`;
if (src.includes(initAnchor) && !src.includes("safety: SAFETY_STATE.SAFE")) {
  src = src.replace(
    initAnchor,
    `    cognitive: null,\n    safety: SAFETY_STATE.SAFE,\n    confidence: CONFIDENCE_STATE.MEDIUM,\n    taskId: null,`
  );
  changed = true;
}

// 2d. Hook _emit to also write to persistent audit log (best-effort, non-blocking)
const emitAnchor = `    this.state.history.push({ event: eventName, at: this.state.updatedAt });
    if (this.state.history.length > MAX_HISTORY) this.state.history.shift();
    for (const fn of this.listeners) fn(this.getState());
  }`;
if (src.includes(emitAnchor) && !src.includes("recordAuditEvent(eventName")) {
  src = src.replace(
    emitAnchor,
    `    this.state.history.push({ event: eventName, at: this.state.updatedAt });
    if (this.state.history.length > MAX_HISTORY) this.state.history.shift();
    recordAuditEvent(eventName, { taskId: this.state.taskId, patch });
    for (const fn of this.listeners) fn(this.getState());
  }`
  );
  changed = true;
}

// 2e. Add setSafetyState / setConfidenceState methods after setCognitiveState
const cogMethodAnchor = `  setCognitiveState(next) {
    if (next !== null && !Object.values(COGNITIVE_STATE).includes(next)) {
      throw new Error(\`Invalid COGNITIVE_STATE: \${next}\`);
    }
    this._emit(next ? \`COGNITIVE_\${next}\` : 'COGNITIVE_CLEARED', { cognitive: next });
  }`;
const newMethods = `

  // ---- Safety ----
  setSafetyState(next) {
    if (!Object.values(SAFETY_STATE).includes(next)) {
      throw new Error(\`Invalid SAFETY_STATE: \${next}\`);
    }
    this._emit(\`SAFETY_\${next}\`, { safety: next });
  }

  // ---- Confidence ----
  setConfidenceState(next) {
    if (!Object.values(CONFIDENCE_STATE).includes(next)) {
      throw new Error(\`Invalid CONFIDENCE_STATE: \${next}\`);
    }
    this._emit(\`CONFIDENCE_\${next}\`, { confidence: next });
  }`;
if (src.includes(cogMethodAnchor) && !src.includes("setSafetyState")) {
  src = src.replace(cogMethodAnchor, cogMethodAnchor + newMethods);
  changed = true;
}

if (changed) {
  fs.writeFileSync(STATUS_FILE, src, "utf8");
  console.log("✅ patched", STATUS_FILE);
} else {
  console.log("⚠️  no changes applied (anchors not found or already patched) — check manually");
}

console.log("\\nNext steps:");
console.log("  git diff " + STATUS_FILE);
console.log("  npx tsc --noEmit");
console.log("  npm run build");
