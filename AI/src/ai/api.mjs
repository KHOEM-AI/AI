import crypto from "node:crypto";
import { khoemReply } from "./khoem.mjs";
import { policyCheck, getAudit, DECISION } from "./permission.mjs";
import {
  createApprovalRequest, getApproval, listApprovals,
  approveRequest, rejectRequest, verifyBeforeExecution, markExecuted,
} from "./approvals.mjs";
import { emit, getAllTasks, getTask, getEvents } from "./tasks.mjs";
import { isKilled, activateKillSwitch, deactivateKillSwitch, getKillSwitchStatus } from "./killswitch.mjs";
import { createSnapshot, listSnapshots, getSnapshot, buildRollbackPlan } from "./rollback.mjs";
import { runSandboxTest } from "./sandbox.mjs";
import { proposePatch, getProposal, listProposals, applyPatch } from "./patch.mjs";
import { runVerification, getLastVerification, listVerifications } from "./verification.mjs";
import { readRecentAuditEvents } from "./audit.mjs";

const run = (text) => khoemReply([{ role: "user", content: text }]);
// Caller-supplied identity. Still only as trustworthy as the shared API key —
// there is one guard() key for everyone — but this at least lets requester
// and approver be recorded as different people so self-approval can be caught.
const actorOf = (req) => String(req.get("x-actor") || "user");
const bad = (m, status = 400) => Object.assign(new Error(m), { status });

function guard(req, res, next) {
  const key = process.env.KHOEM_API_KEY;
  if (!key) return res.status(503).json({ error: "មិនទាន់កំណត់ KHOEM_API_KEY ក្នុង .env" });
  const a = Buffer.from(String(req.get("x-api-key") || ""));
  const b = Buffer.from(key);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b))
    return res.status(401).json({ error: "key មិនត្រឹមត្រូវ" });
  next();
}

function policy(action) {
  return (req, res, next) => {
    const actor = actorOf(req);
    if (isKilled() && action !== "system.kill" && action !== "system.resume") {
      return res.status(503).json({ error: "ប្រព័ន្ធត្រូវបានផ្អាក (kill switch active)", action });
    }
    const rec = policyCheck(action, actor);
    if (rec.decision === DECISION.DENY) {
      return res.status(403).json({ error: "សកម្មភាពនេះមិនត្រូវបានអនុញ្ញាត", action, risk: rec.risk });
    }
    if (rec.decision === DECISION.REQUIRE_APPROVAL) {
      const approval = createApprovalRequest({
        action, actor, permission: rec.permission, risk: rec.risk,
        reason: "risk requires human approval",
      });
      return res.status(202).json({
        status: "PENDING_APPROVAL", approvalId: approval.id,
        action, risk: rec.risk, expiresAt: approval.expiresAt,
      });
    }
    next();
  };
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ result: await fn(req) });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "មានបញ្ហា" });
  }
};

export function registerApi(app) {
  app.get("/api/scan", guard, policy("tool.scan"), wrap(() => run("/scan")));
  app.get("/api/check", guard, policy("tool.check"), wrap(() => run("/check")));
  app.get("/api/learned", guard, policy("knowledge.readLearned"), wrap(() => run("/learned")));
  app.get("/api/find", guard, policy("tool.find"), wrap((req) => {
    if (!req.query.q) throw bad("ត្រូវការ ?q=ពាក្យ");
    return run("/find " + req.query.q);
  }));
  app.get("/api/funcs", guard, policy("tool.funcs"), wrap((req) => {
    if (!req.query.file) throw bad("ត្រូវការ ?file=src/...");
    return run("/funcs " + req.query.file);
  }));
  app.get("/api/read", guard, policy("tool.read"), wrap((req) => {
    if (!req.query.file) throw bad("ត្រូវការ ?file=src/...");
    return run("/read " + req.query.file);
  }));
  app.post("/api/learn", guard, policy("learning.write"), wrap((req) => {
    const { q, a } = req.body || {};
    if (!q || !a || String(q).includes("=")) throw bad("ត្រូវការ q និង a (q មិនមាន =)");
    return run(`/learn ${q} = ${a}`);
  }));
  app.post("/api/forget", guard, policy("learning.delete"), wrap((req) => {
    if (!req.body?.q) throw bad("ត្រូវការ q");
    return run("/forget " + req.body.q);
  }));
  // ---- Phase 3: Code Data Center (read/analyze only, spec Part 3) ----
  app.get("/api/code/index", guard, wrap(async () => {
    const cdc = await import("./codeDataCenter.mjs");
    if (!cdc.isReady()) cdc.scanRepo();
    return cdc.getFileIndex();
  }));

  app.post("/api/code/scan", guard, wrap(async () => {
    const cdc = await import("./codeDataCenter.mjs");
    return cdc.scanRepo();
  }));

  app.get("/api/code/symbols", guard, wrap(async () => {
    const cdc = await import("./codeDataCenter.mjs");
    if (!cdc.isReady()) cdc.scanRepo();
    return { files: cdc.getSymbolIndex() };
  }));

  app.get("/api/code/symbol", guard, wrap(async (req) => {
    if (!req.query.name) throw bad("ត្រូវការ ?name=ឈ្មោះ symbol");
    const cdc = await import("./codeDataCenter.mjs");
    if (!cdc.isReady()) cdc.scanRepo();
    return { name: req.query.name, hits: cdc.findSymbol(req.query.name) };
  }));

  app.get("/api/code/dependencies", guard, wrap(async (req) => {
    if (!req.query.file) throw bad("ត្រូវការ ?file=src/...");
    const cdc = await import("./codeDataCenter.mjs");
    if (!cdc.isReady()) cdc.scanRepo();
    return { file: req.query.file, dependencies: cdc.getDependencies(req.query.file) };
  }));

  app.get("/api/code/dependents", guard, wrap(async (req) => {
    if (!req.query.file) throw bad("ត្រូវការ ?file=src/...");
    const cdc = await import("./codeDataCenter.mjs");
    if (!cdc.isReady()) cdc.scanRepo();
    return { file: req.query.file, dependents: cdc.getDependents(req.query.file) };
  }));

  app.get("/api/code/circular", guard, wrap(async () => {
    const cdc = await import("./codeDataCenter.mjs");
    if (!cdc.isReady()) cdc.scanRepo();
    return { cycles: cdc.getCircularDependencies() };
  }));

  app.get("/api/code/health", guard, wrap(async () => {
    const cdc = await import("./codeDataCenter.mjs");
    return cdc.getCodeHealth();
  }));

  app.get("/api/code/findings", guard, wrap(async () => {
    const cdc = await import("./codeDataCenter.mjs");
    return cdc.getFindings();
  }));

  // ---- Phase 11: Task Engine observability (read-only) ----
  app.get("/api/tasks", guard, (req, res) => {
    res.json({ tasks: getAllTasks() });
  });

  app.get("/api/tasks/:id", guard, (req, res) => {
    const task = getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "រកមិនឃើញ task" });
    res.json({ task, events: getEvents(req.params.id) });
  });

    // ---- Phase 12: Kill Switch (emergency stop) ----
  app.get("/api/system/status", guard, (req, res) => {
    res.json(getKillSwitchStatus());
  });

  app.post("/api/system/kill", guard, policy("system.kill"), wrap((req) => {
    const reason = String(req.body?.reason || "manual");
    return activateKillSwitch(reason);
  }));

  app.post("/api/system/resume", guard, policy("system.resume"), wrap(() => {
    return deactivateKillSwitch();
  }));
  // ---- Phase 13: Rollback Strategy (snapshot + plan, read-only) ----
  app.post("/api/rollback/snapshot", guard, policy("rollback.snapshot"), wrap((req) => {
    const reason = String(req.body?.reason || "manual");
    return createSnapshot(reason);
  }));

  app.get("/api/rollback/snapshots", guard, policy("rollback.plan"), wrap(() => {
    return { snapshots: listSnapshots() };
  }));

  app.get("/api/rollback/snapshots/:id", guard, policy("rollback.plan"), wrap((req) => {
    const snap = getSnapshot(req.params.id);
    if (!snap) throw bad("រកមិនឃើញ snapshot", 404);
    return snap;
  }));

  app.get("/api/rollback/plan/:id", guard, policy("rollback.plan"), wrap((req) => {
    const plan = buildRollbackPlan(req.params.id);
    if (!plan) throw bad("រកមិនឃើញ snapshot", 404);
    return plan;
  }));
  // ---- Phase 20: Sandbox (proposed change tested in temp copy only) ----
  app.post("/api/sandbox/test", guard, policy("code.sandboxTest"), wrap((req) => {
    const { relPath, newContent, reason } = req.body || {};
    if (!relPath || typeof newContent !== "string") {
      throw bad("relPath and newContent (string) are required");
    }
    return runSandboxTest({ relPath, newContent, reason });
  }));
  // ---- Phase 21: Safe Code Patch Proposal (propose -> approve -> apply) ----
  app.post("/api/patch/propose", guard, policy("code.proposePatch"), wrap((req) => {
    const { relPath, newContent, reason } = req.body || {};
    if (!relPath || typeof newContent !== "string") {
      throw bad("relPath and newContent (string) are required");
    }
    return proposePatch({ relPath, newContent, reason, actor: actorOf(req) });
  }));

  app.get("/api/patch/proposals", guard, (req, res) => {
    res.json({ proposals: listProposals() });
  });

  app.get("/api/patch/proposals/:id", guard, (req, res) => {
    const p = getProposal(req.params.id);
    if (!p) return res.status(404).json({ error: "រកមិនឃើញ proposal" });
    res.json({ proposal: p });
  });

  app.post("/api/patch/apply", guard, wrap((req) => {
    const { proposalId, approvalId } = req.body || {};
    if (!proposalId || !approvalId) throw bad("proposalId and approvalId are required");
    const result = applyPatch(proposalId, approvalId, actorOf(req));
    if (!result.ok) throw bad(result.error, 409);
    return result;
  }));
  // ---- Phase 22: Testing + Verification Pipeline (evidence-based) ----
  app.post("/api/verify", guard, policy("code.verify"), wrap((req) => {
    return runVerification(String(req.body?.reason || "manual"));
  }));

  app.get("/api/verify/last", guard, (req, res) => {
    res.json({ verification: getLastVerification() });
  });

  app.get("/api/verify/history", guard, (req, res) => {
    res.json({ history: listVerifications() });
  });
app.get("/api/audit", guard, (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 500);
    res.json({
      policyDecisions: getAudit(limit),
      events: readRecentAuditEvents(limit),
    });
  });

  // ---- Phase 14: Human Approval Gate ----

  // Mock HIGH-risk action (spec 4.13) — policy() ខាងលើនឹង block វារហូតដល់
  // approval ត្រូវបាន APPROVE, មិនអនុវត្តដោយផ្ទាល់ជាដាច់ខាត។
  app.post("/api/approvals/test-action", guard, policy("approval.test.high-risk"), wrap(() => {
    return { message: "សកម្មភាពសាកល្បង HIGH-risk (mock — គ្មានផលប៉ះពាល់ពិតប្រាកដ)" };
  }));

  app.get("/api/approvals", guard, (req, res) => {
    res.json({ approvals: listApprovals({ status: req.query.status }) });
  });

  app.get("/api/approvals/:id", guard, (req, res) => {
    const a = getApproval(req.params.id);
    if (!a) return res.status(404).json({ error: "រកមិនឃើញ approval request" });
    res.json({ approval: a });
  });

  app.post("/api/approvals/:id/approve", guard, (req, res) => {
    const decidedBy = "human:" + (req.body?.decidedBy || actorOf(req));
    const result = approveRequest(req.params.id, decidedBy, req.body?.reason);
    if (result.error) return res.status(409).json({ error: result.error });
    res.json({ approval: result.request });
  });

  app.post("/api/approvals/:id/reject", guard, (req, res) => {
    const decidedBy = "human:" + (req.body?.decidedBy || actorOf(req));
    const result = rejectRequest(req.params.id, decidedBy, req.body?.reason);
    if (result.error) return res.status(409).json({ error: result.error });
    res.json({ approval: result.request });
  });

  // ប្រតិបត្តិសំណើដែល APPROVED រួច — verify ម្តងទៀតភ្លាមៗមុនប្រតិបត្តិ (spec 4.8)
  app.post("/api/approvals/:id/execute", guard, wrap(async (req) => {
    const approval = getApproval(req.params.id);
    if (!approval) throw bad("រកមិនឃើញ approval request", 404);
    const check = verifyBeforeExecution(req.params.id, { action: approval.action, target: approval.target });
    if (!check.ok) throw bad("ការអនុញ្ញាតមិនត្រឹមត្រូវសម្រាប់ការប្រតិបត្តិ: " + check.error, 409);

    emit(approval.id, "EXECUTION_AUTHORIZED", { approvalId: approval.id, action: approval.action });
    emit(approval.id, "EXECUTION_STARTED", { approvalId: approval.id, action: approval.action });
    const outcome = {
      message: "សកម្មភាពត្រូវបានប្រតិបត្តិ (mock, គ្មានផលប៉ះពាល់ពិតប្រាកដ)",
      approvalId: approval.id, action: approval.action,
    };
    markExecuted(approval.id);
    emit(approval.id, "EXECUTION_COMPLETED", { approvalId: approval.id, action: approval.action });
    return outcome;
  }));
}
