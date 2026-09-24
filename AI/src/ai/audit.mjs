// src/ai/audit.mjs
// Persistent, append-only audit/event log (JSONL).
// Never throws — a logging failure must not break the AI pipeline.
import fs from "node:fs";
import crypto from "node:crypto";
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

// Returns the hash of the last log line, or a fixed genesis hash if empty.
function getLastHash() {
  try {
    if (!fs.existsSync(LOG_FILE)) return "GENESIS";
    const lines = fs.readFileSync(LOG_FILE, "utf8").trim().split("\n").filter(Boolean);
    if (lines.length === 0) return "GENESIS";
    const last = JSON.parse(lines[lines.length - 1]);
    return last.hash || "GENESIS";
  } catch {
    return "GENESIS";
  }
}

function computeHash(prevHash, entryWithoutHash) {
  const payload = prevHash + JSON.stringify(entryWithoutHash);
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function recordAuditEvent(eventName, data = {}) {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    const prevHash = getLastHash();
    const base = {
      event: eventName,
      at: new Date().toISOString(),
      data: scrub(data),
      prevHash,
    };
    const hash = computeHash(prevHash, base);
    const entry = { ...base, hash };
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n", "utf8");
  } catch (e) {
    // Audit logging must never crash the app.
    console.error("[audit] write failed:", e && e.message);
  }
}

// Walks the entire log and verifies every hash links correctly to the
// previous one. Returns { valid: true } or { valid: false, brokenAt: <line index> }.
// This is how tampering (edited/deleted/reordered lines) gets detected.
export function verifyAuditChain() {
  try {
    if (!fs.existsSync(LOG_FILE)) return { valid: true, checked: 0 };
    const lines = fs.readFileSync(LOG_FILE, "utf8").trim().split("\n").filter(Boolean);
    let prevHash = "GENESIS";
    for (let i = 0; i < lines.length; i++) {
      let entry;
      try {
        entry = JSON.parse(lines[i]);
      } catch {
        return { valid: false, brokenAt: i, reason: "unparsable line" };
      }
      const { hash, ...base } = entry;
      if (base.prevHash !== prevHash) {
        return { valid: false, brokenAt: i, reason: "prevHash mismatch (chain broken or reordered)" };
      }
      const expectedHash = computeHash(prevHash, base);
      if (hash !== expectedHash) {
        return { valid: false, brokenAt: i, reason: "hash mismatch (entry content was edited)" };
      }
      prevHash = hash;
    }
    return { valid: true, checked: lines.length };
  } catch (e) {
    return { valid: false, brokenAt: -1, reason: "verify failed: " + (e && e.message) };
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
