import fs from "node:fs";
console.log("=== PHASE 4: real actor identity, full audit endpoint, session cap ===");

function backup(f) { fs.writeFileSync(f + ".bak-phase4", fs.readFileSync(f, "utf8"), "utf8"); }
function patch(file, edits) {
  let src = fs.readFileSync(file, "utf8");
  backup(file);
  let changed = false;
  for (const [label, from, to] of edits) {
    if (!src.includes(from)) { console.log(`⚠️  [${file}] anchor not found: ${label} — check manually`); continue; }
    src = src.replace(from, to);
    changed = true;
    console.log(`✅ [${file}] ${label}`);
  }
  if (changed) fs.writeFileSync(file, src, "utf8");
  return changed;
}

// ---- api.mjs: real actor identity via x-actor header; full audit endpoint ----
patch("src/ai/api.mjs", [
  ["import readRecentAuditEvents",
   `import { emit } from "./tasks.mjs";`,
   `import { emit } from "./tasks.mjs";\nimport { readRecentAuditEvents } from "./audit.mjs";`],
  ["add actorOf() helper",
   `const run = (text) => khoemReply([{ role: "user", content: text }]);`,
   `const run = (text) => khoemReply([{ role: "user", content: text }]);\n// Caller-supplied identity. Still only as trustworthy as the shared API key —\n// there is one guard() key for everyone — but this at least lets requester\n// and approver be recorded as different people so self-approval can be caught.\nconst actorOf = (req) => String(req.get("x-actor") || "user");`],
  ["policy() uses real actor instead of hardcoded 'user'",
   `    const rec = policyCheck(action, "user");
    if (rec.decision === DECISION.DENY) {
      return res.status(403).json({ error: "សកម្មភាពនេះមិនត្រូវបានអនុញ្ញាត", action, risk: rec.risk });
    }
    if (rec.decision === DECISION.REQUIRE_APPROVAL) {
      const approval = createApprovalRequest({
        action, actor: "user", permission: rec.permission, risk: rec.risk,
        reason: "risk requires human approval",
      });`,
   `    const actor = actorOf(req);
    const rec = policyCheck(action, actor);
    if (rec.decision === DECISION.DENY) {
      return res.status(403).json({ error: "សកម្មភាពនេះមិនត្រូវបានអនុញ្ញាត", action, risk: rec.risk });
    }
    if (rec.decision === DECISION.REQUIRE_APPROVAL) {
      const approval = createApprovalRequest({
        action, actor, permission: rec.permission, risk: rec.risk,
        reason: "risk requires human approval",
      });`],
  ["approve endpoint uses x-actor for decidedBy",
   `  app.post("/api/approvals/:id/approve", guard, (req, res) => {
    const decidedBy = "human:" + (req.body?.decidedBy || "control-center");`,
   `  app.post("/api/approvals/:id/approve", guard, (req, res) => {
    const decidedBy = "human:" + (req.body?.decidedBy || actorOf(req));`],
  ["reject endpoint uses x-actor for decidedBy",
   `  app.post("/api/approvals/:id/reject", guard, (req, res) => {
    const decidedBy = "human:" + (req.body?.decidedBy || "control-center");`,
   `  app.post("/api/approvals/:id/reject", guard, (req, res) => {
    const decidedBy = "human:" + (req.body?.decidedBy || actorOf(req));`],
  ["audit endpoint returns full persistent trail, not just policy decisions",
   `  app.get("/api/audit", guard, (req, res) => {
    res.json({ audit: getAudit(50) });
  });`,
   `  app.get("/api/audit", guard, (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 500);
    res.json({
      policyDecisions: getAudit(limit),
      events: readRecentAuditEvents(limit),
    });
  });`],
]);

// ---- memory.mjs: cap total number of sessions (not just messages per session) ----
patch("src/ai/memory.mjs", [
  ["add MAX_SESSIONS constant",
   `export class AIMemory {
  constructor({ maxMessages = 50 } = {}) {
    this.maxMessages = maxMessages;
    this.sessions = new Map();
  }`,
   `const MAX_SESSIONS = 1000;

export class AIMemory {
  constructor({ maxMessages = 50, maxSessions = MAX_SESSIONS } = {}) {
    this.maxMessages = maxMessages;
    this.maxSessions = maxSessions;
    this.sessions = new Map();
  }`],
  ["evict oldest session when cap exceeded",
   `  createSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }

    return sessionId;
  }`,
   `  createSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      if (this.sessions.size >= this.maxSessions) {
        this.sessions.delete(this.sessions.keys().next().value);
      }
      this.sessions.set(sessionId, []);
    }

    return sessionId;
  }`],
]);

// ---- tests ----
const TEST_DIR = "src/ai/__tests__";
function writeTest(file, content) {
  if (fs.existsSync(file)) { console.log("⚠️ ", file, "exists — skipped"); return; }
  fs.writeFileSync(file, content, "utf8");
  console.log("✅ created", file);
}

writeTest(TEST_DIR + "/memory.test.mjs", `import { describe, it, expect } from "vitest";
import { AIMemory } from "../memory.mjs";

describe("memory.mjs", () => {
  it("caps messages per session", () => {
    const mem = new AIMemory({ maxMessages: 3 });
    for (let i = 0; i < 5; i++) mem.add("s1", { role: "user", content: String(i) });
    expect(mem.get("s1").length).toBe(3);
    expect(mem.get("s1")[0].content).toBe("2");
  });
  it("evicts oldest session when session cap exceeded", () => {
    const mem = new AIMemory({ maxSessions: 2 });
    mem.add("a", { role: "user", content: "x" });
    mem.add("b", { role: "user", content: "x" });
    mem.add("c", { role: "user", content: "x" });
    expect(mem.sessions.has("a")).toBe(false);
    expect(mem.sessions.has("b")).toBe(true);
    expect(mem.sessions.has("c")).toBe(true);
  });
  it("rejects missing sessionId or malformed message", () => {
    const mem = new AIMemory();
    expect(() => mem.add(null, { role: "user", content: "x" })).toThrow();
    expect(() => mem.add("s", { role: "user" })).toThrow();
  });
});
`);

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
