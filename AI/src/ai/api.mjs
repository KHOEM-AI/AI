import crypto from "node:crypto";
import { khoemReply } from "./khoem.mjs";
import { policyCheck, getAudit, DECISION } from "./permission.mjs";
import {
  createApprovalRequest, getApproval, listApprovals,
  approveRequest, rejectRequest, verifyBeforeExecution, markExecuted,
} from "./approvals.mjs";
import { emit } from "./tasks.mjs";

const run = (text) => khoemReply([{ role: "user", content: text }]);
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
    const rec = policyCheck(action, "user");
    if (rec.decision === DECISION.DENY) {
      return res.status(403).json({ error: "សកម្មភាពនេះមិនត្រូវបានអនុញ្ញាត", action, risk: rec.risk });
    }
    if (rec.decision === DECISION.REQUIRE_APPROVAL) {
      const approval = createApprovalRequest({
        action, actor: "user", permission: rec.permission, risk: rec.risk,
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
  app.get("/api/audit", guard, (req, res) => {
    res.json({ audit: getAudit(50) });
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
    const decidedBy = "human:" + (req.body?.decidedBy || "control-center");
    const result = approveRequest(req.params.id, decidedBy, req.body?.reason);
    if (result.error) return res.status(409).json({ error: result.error });
    res.json({ approval: result.request });
  });

  app.post("/api/approvals/:id/reject", guard, (req, res) => {
    const decidedBy = "human:" + (req.body?.decidedBy || "control-center");
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
