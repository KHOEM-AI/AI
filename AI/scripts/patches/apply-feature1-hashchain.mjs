import fs from "node:fs";

const AUDIT_FILE = "src/ai/audit.mjs";
const TEST_FILE = "src/ai/__tests__/auditChain.test.mjs";

let src = fs.readFileSync(AUDIT_FILE, "utf8");
const backup = AUDIT_FILE + ".bak-feature1";
fs.writeFileSync(backup, src, "utf8");
console.log("✅ backup saved:", backup);

if (src.includes("verifyAuditChain")) {
  console.log("⚠️  already patched — skipping");
} else {
  // Add crypto import
  src = src.replace(
    `import fs from "node:fs";`,
    `import fs from "node:fs";\nimport crypto from "node:crypto";`
  );

  // Replace recordAuditEvent to add hash chaining
  const oldRecord = `export function recordAuditEvent(eventName, data = {}) {
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
}`;

  const newRecord = `// Returns the hash of the last log line, or a fixed genesis hash if empty.
function getLastHash() {
  try {
    if (!fs.existsSync(LOG_FILE)) return "GENESIS";
    const lines = fs.readFileSync(LOG_FILE, "utf8").trim().split("\\n").filter(Boolean);
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
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\\n", "utf8");
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
    const lines = fs.readFileSync(LOG_FILE, "utf8").trim().split("\\n").filter(Boolean);
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
}`;

  if (src.includes(oldRecord)) {
    src = src.replace(oldRecord, newRecord);
  } else {
    console.log("⚠️  recordAuditEvent anchor not found — please check audit.mjs manually");
  }

  fs.writeFileSync(AUDIT_FILE, src, "utf8");
  console.log("✅ patched", AUDIT_FILE, "with hash chain");
}

// ---- test file ----
if (fs.existsSync(TEST_FILE)) {
  console.log("⚠️  test file already exists — skipping");
} else {
  const testContent = `import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { recordAuditEvent, verifyAuditChain } from "../audit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, "..", "..", "..", "data", "audit-log.jsonl");

describe("audit.mjs — tamper-evident hash chain", () => {
  it("verifies a valid, untouched chain", () => {
    recordAuditEvent("TEST_EVENT_1", { note: "chain test" });
    recordAuditEvent("TEST_EVENT_2", { note: "chain test" });
    const result = verifyAuditChain();
    expect(result.valid).toBe(true);
  });

  it("detects tampering when a line's data is edited after the fact", () => {
    recordAuditEvent("TEST_EVENT_3", { note: "before tamper" });
    const lines = fs.readFileSync(LOG_FILE, "utf8").trim().split("\\n");
    const last = JSON.parse(lines[lines.length - 1]);
    last.data.note = "TAMPERED"; // edit content but keep old hash
    lines[lines.length - 1] = JSON.stringify(last);
    fs.writeFileSync(LOG_FILE, lines.join("\\n") + "\\n", "utf8");
    const result = verifyAuditChain();
    expect(result.valid).toBe(false);
  });

  it("detects a deleted/removed line breaking the chain", () => {
    recordAuditEvent("TEST_EVENT_4", { note: "a" });
    recordAuditEvent("TEST_EVENT_5", { note: "b" });
    const lines = fs.readFileSync(LOG_FILE, "utf8").trim().split("\\n");
    lines.splice(lines.length - 2, 1); // remove second-to-last line
    fs.writeFileSync(LOG_FILE, lines.join("\\n") + "\\n", "utf8");
    const result = verifyAuditChain();
    expect(result.valid).toBe(false);
  });
});
`;
  fs.writeFileSync(TEST_FILE, testContent, "utf8");
  console.log("✅ created", TEST_FILE);
}

console.log("\\nNext steps:");
console.log("  npm test -- auditChain");
console.log("  npx tsc --noEmit");
console.log("  npm run build");
