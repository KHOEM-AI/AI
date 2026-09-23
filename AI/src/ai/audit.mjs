// src/ai/audit.mjs
// Persistent, append-only audit/event log (JSONL).
// Never throws — a logging failure must not break the AI pipeline.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "..", "data");
const LOG_FILE = path.join(
  LOG_DIR,
  process.env.VITEST ? "audit-log.test.jsonl" : "audit-log.jsonl"
);
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
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n", "utf8");
  } catch (e) {
    // Audit logging must never crash the app.
    console.error("[audit] write failed:", e && e.message);
  }
}

export function readRecentAuditEvents(limit = 50) {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const lines = fs.readFileSync(LOG_FILE, "utf8").trim().split("\n").filter(Boolean);
    return lines.slice(-limit).map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch (e) {
    return [];
  }
}
