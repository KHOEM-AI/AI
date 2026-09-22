import crypto from "node:crypto";
import { khoemReply } from "./khoem.mjs";
import { policyCheck, getAudit, DECISION } from "./permission.mjs";

const run = (text) => khoemReply([{ role: "user", content: text }]);
const bad = (m) => Object.assign(new Error(m), { status: 400 });

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
      return res.status(202).json({ status: "PENDING_APPROVAL", action, risk: rec.risk });
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
}
