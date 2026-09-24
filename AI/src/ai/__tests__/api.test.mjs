import { describe, it, expect, vi, beforeEach } from "vitest";

const m = vi.hoisted(() => ({
  khoemReply: vi.fn(),
  policyCheck: vi.fn(),
  getAudit: vi.fn(),
  createApprovalRequest: vi.fn(),
  approveRequest: vi.fn(),
  rejectRequest: vi.fn(),
  isKilled: vi.fn(),
  getTask: vi.fn(),
  applyPatch: vi.fn(),
  readRecentAuditEvents: vi.fn(),
  listIdeas: vi.fn(),
  getIdea: vi.fn(),
  transitionExperiment: vi.fn(),
}));

vi.mock("../khoem.mjs", () => ({ khoemReply: m.khoemReply }));
vi.mock("../permission.mjs", () => ({
  policyCheck: m.policyCheck,
  getAudit: m.getAudit,
  DECISION: { ALLOW: "ALLOW", DENY: "DENY", REQUIRE_APPROVAL: "REQUIRE_APPROVAL" },
}));
vi.mock("../approvals.mjs", () => ({
  createApprovalRequest: m.createApprovalRequest,
  getApproval: vi.fn(), listApprovals: vi.fn(), approveRequest: m.approveRequest,
  rejectRequest: m.rejectRequest, verifyBeforeExecution: vi.fn(), markExecuted: vi.fn(),
}));
vi.mock("../tasks.mjs", () => ({ emit: vi.fn(), getAllTasks: vi.fn(), getTask: m.getTask, getEvents: vi.fn() }));
vi.mock("../killswitch.mjs", () => ({
  isKilled: m.isKilled, activateKillSwitch: vi.fn(),
  deactivateKillSwitch: vi.fn(), getKillSwitchStatus: vi.fn(),
}));
vi.mock("../rollback.mjs", () => ({
  createSnapshot: vi.fn(), listSnapshots: vi.fn(), getSnapshot: vi.fn(), buildRollbackPlan: vi.fn(),
}));
vi.mock("../sandbox.mjs", () => ({ runSandboxTest: vi.fn() }));
vi.mock("../patch.mjs", () => ({
  proposePatch: vi.fn(), getProposal: vi.fn(), listProposals: vi.fn(), applyPatch: m.applyPatch,
}));
vi.mock("../budget.mjs", () => ({
  createBudget: vi.fn(), recordUsage: vi.fn(), checkBudget: vi.fn(), getBudget: vi.fn(), listBudgets: vi.fn(),
}));
vi.mock("../circuitBreaker.mjs", () => ({ listBreakers: vi.fn(), getBreakerState: vi.fn() }));
vi.mock("../metrics.mjs", () => ({ getMetrics: vi.fn() }));
vi.mock("../goal.mjs", () => ({
  createGoal: vi.fn(), getGoal: vi.fn(), listGoals: vi.fn(), linkTaskToGoal: vi.fn(),
  getGoalProgress: vi.fn(), setGoalStatus: vi.fn(),
}));
vi.mock("../modelRouting.mjs", () => ({
  decideProvider: vi.fn(), listProviders: vi.fn(), getRoutingHistory: vi.fn(),
}));
vi.mock("../verification.mjs", () => ({
  runVerification: vi.fn(), getLastVerification: vi.fn(), listVerifications: vi.fn(),
}));
vi.mock("../audit.mjs", () => ({ readRecentAuditEvents: m.readRecentAuditEvents }));
vi.mock("../ideas.mjs", () => ({
  listIdeas: m.listIdeas, getIdea: m.getIdea, rankIdeas: vi.fn(), createIdea: vi.fn(),
}));
vi.mock("../planning.mjs", () => ({ listPlans: vi.fn(), getPlan: vi.fn(), createPlan: vi.fn() }));
vi.mock("../experiments.mjs", () => ({
  listExperiments: vi.fn(), getExperiment: vi.fn(), createExperiment: vi.fn(),
  transitionExperiment: m.transitionExperiment,
}));
vi.mock("../selfEval.mjs", () => ({ selfEvaluate: vi.fn() }));

import { registerApi } from "../api.mjs";

const routes = [];
const fakeApp = {};
for (const method of ["get", "post", "put", "patch", "delete", "use"]) {
  fakeApp[method] = (path, ...handlers) => routes.push({ method, path, handlers });
}
registerApi(fakeApp);

async function call(method, path, { headers = {}, body, query = {}, params = {} } = {}) {
  const route = routes.find((r) => r.method === method && r.path === path);
  if (!route) throw new Error("route not found: " + method + " " + path);
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const req = { body, query, params, get: (k) => h[String(k).toLowerCase()] };
  const out = { status: 200, json: undefined };
  const res = {
    status(c) { out.status = c; return res; },
    json(j) { out.json = j; return res; },
  };
  for (const handler of route.handlers) {
    let advanced = false;
    await handler(req, res, () => { advanced = true; });
    if (!advanced) break;
  }
  return out;
}

const KEY = "secret-key-123";
const auth = { "x-api-key": KEY };

beforeEach(() => {
  vi.resetAllMocks();
  process.env.KHOEM_API_KEY = KEY;
  m.isKilled.mockReturnValue(false);
  m.policyCheck.mockReturnValue({ decision: "ALLOW", permission: "p", risk: "low" });
  m.khoemReply.mockResolvedValue("ok");
});

describe("guard (x-api-key)", () => {
  it("returns 503 when KHOEM_API_KEY is not configured", async () => {
    delete process.env.KHOEM_API_KEY;
    const r = await call("get", "/api/ideas", { headers: auth });
    expect(r.status).toBe(503);
  });
  it("returns 401 when the key is missing", async () => {
    const r = await call("get", "/api/ideas");
    expect(r.status).toBe(401);
  });
  it("returns 401 when the key has a different length", async () => {
    const r = await call("get", "/api/ideas", { headers: { "x-api-key": "short" } });
    expect(r.status).toBe(401);
  });
  it("returns 401 when the key has the same length but is wrong", async () => {
    const r = await call("get", "/api/ideas", { headers: { "x-api-key": "X".repeat(KEY.length) } });
    expect(r.status).toBe(401);
  });
  it("lets a correct key through", async () => {
    m.listIdeas.mockReturnValue([]);
    const r = await call("get", "/api/ideas", { headers: auth });
    expect(r.status).toBe(200);
  });
});

describe("policy", () => {
  it("returns 503 when the kill switch is active", async () => {
    m.isKilled.mockReturnValue(true);
    const r = await call("get", "/api/ideas", { headers: auth });
    expect(r.status).toBe(503);
    expect(m.policyCheck).not.toHaveBeenCalled();
  });
  it("returns 403 when the action is denied", async () => {
    m.policyCheck.mockReturnValue({ decision: "DENY", risk: "high" });
    const r = await call("get", "/api/ideas", { headers: auth });
    expect(r.status).toBe(403);
    expect(r.json.action).toBe("ideas.read");
  });
  it("returns 202 and creates an approval when approval is required", async () => {
    m.policyCheck.mockReturnValue({ decision: "REQUIRE_APPROVAL", permission: "p", risk: "high" });
    m.createApprovalRequest.mockReturnValue({ id: "ap1", expiresAt: "2099-01-01" });
    const r = await call("post", "/api/ideas", { headers: auth, body: {} });
    expect(r.status).toBe(202);
    expect(r.json.status).toBe("PENDING_APPROVAL");
    expect(r.json.approvalId).toBe("ap1");
  });
  it("uses x-actor as the actor, defaulting to user", async () => {
    m.listIdeas.mockReturnValue([]);
    await call("get", "/api/ideas", { headers: { ...auth, "x-actor": "alice" } });
    expect(m.policyCheck).toHaveBeenLastCalledWith("ideas.read", "alice");
    await call("get", "/api/ideas", { headers: auth });
    expect(m.policyCheck).toHaveBeenLastCalledWith("ideas.read", "user");
  });
});

describe("wrap and found", () => {
  it("wraps a successful value in { result }", async () => {
    m.listIdeas.mockReturnValue([{ id: "1" }]);
    const r = await call("get", "/api/ideas", { headers: auth });
    expect(r.json).toEqual({ result: [{ id: "1" }] });
  });
  it("returns 404 when an idea is not found", async () => {
    m.getIdea.mockReturnValue(null);
    const r = await call("get", "/api/ideas/:id", { headers: auth, params: { id: "x" } });
    expect(r.status).toBe(404);
  });
  it("returns 500 when the handler throws without a status", async () => {
    m.listIdeas.mockImplementation(() => { throw new Error("boom"); });
    const r = await call("get", "/api/ideas", { headers: auth });
    expect(r.status).toBe(500);
    expect(r.json.error).toBe("boom");
  });
});

describe("tool routes", () => {
  it("/api/find requires q", async () => {
    const r = await call("get", "/api/find", { headers: auth });
    expect(r.status).toBe(400);
    expect(m.khoemReply).not.toHaveBeenCalled();
  });
  it("/api/find forwards q to khoemReply", async () => {
    const r = await call("get", "/api/find", { headers: auth, query: { q: "abc" } });
    expect(r.status).toBe(200);
    expect(m.khoemReply).toHaveBeenCalledWith([{ role: "user", content: "/find abc" }]);
  });
  it("/api/read requires file", async () => {
    const r = await call("get", "/api/read", { headers: auth });
    expect(r.status).toBe(400);
  });
  it("/api/learn rejects a missing answer or a q containing =", async () => {
    let r = await call("post", "/api/learn", { headers: auth, body: { q: "a" } });
    expect(r.status).toBe(400);
    r = await call("post", "/api/learn", { headers: auth, body: { q: "a=b", a: "c" } });
    expect(r.status).toBe(400);
    expect(m.khoemReply).not.toHaveBeenCalled();
  });
  it("/api/learn forwards q and a", async () => {
    await call("post", "/api/learn", { headers: auth, body: { q: "hi", a: "សួស្តី" } });
    expect(m.khoemReply).toHaveBeenCalledWith([{ role: "user", content: "/learn hi = សួស្តី" }]);
  });
  it("/api/forget requires q", async () => {
    const r = await call("post", "/api/forget", { headers: auth, body: {} });
    expect(r.status).toBe(400);
  });
});

describe("experiment transition", () => {
  const path = "/api/experiments/:id/transition";
  it("requires `to` to be a string", async () => {
    const r = await call("post", path, { headers: auth, params: { id: "e1" }, body: {} });
    expect(r.status).toBe(400);
  });
  it("returns 404 when the experiment does not exist", async () => {
    m.transitionExperiment.mockReturnValue({ ok: false, error: "NOT_FOUND" });
    const r = await call("post", path, { headers: auth, params: { id: "e1" }, body: { to: "running" } });
    expect(r.status).toBe(404);
  });
  it("returns 409 on any other transition error", async () => {
    m.transitionExperiment.mockReturnValue({ ok: false, error: "BAD_TRANSITION" });
    const r = await call("post", path, { headers: auth, params: { id: "e1" }, body: { to: "done" } });
    expect(r.status).toBe(409);
  });
  it("returns the experiment on success", async () => {
    m.transitionExperiment.mockReturnValue({ ok: true, experiment: { id: "e1", state: "running" } });
    const r = await call("post", path, { headers: auth, params: { id: "e1" }, body: { to: "running" } });
    expect(r.status).toBe(200);
    expect(r.json.result).toEqual({ id: "e1", state: "running" });
  });
});

describe("approvals", () => {
  const path = "/api/approvals/:id/approve";
  it("records the approver with a human: prefix", async () => {
    m.approveRequest.mockReturnValue({ request: { id: "a1" } });
    const r = await call("post", path, {
      headers: { ...auth, "x-actor": "bob" }, params: { id: "a1" }, body: {},
    });
    expect(m.approveRequest).toHaveBeenCalledWith("a1", "human:bob", undefined);
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ approval: { id: "a1" } });
  });
  it("returns 409 when the approval fails", async () => {
    m.approveRequest.mockReturnValue({ error: "EXPIRED" });
    const r = await call("post", path, { headers: auth, params: { id: "a1" }, body: {} });
    expect(r.status).toBe(409);
    expect(r.json.error).toBe("EXPIRED");
  });
  it("returns 409 when a rejection fails", async () => {
    m.rejectRequest.mockReturnValue({ error: "ALREADY_DECIDED" });
    const r = await call("post", "/api/approvals/:id/reject", { headers: auth, params: { id: "a1" }, body: {} });
    expect(r.status).toBe(409);
  });
});

describe("patch apply, tasks and audit", () => {
  it("/api/patch/apply requires proposalId and approvalId", async () => {
    const r = await call("post", "/api/patch/apply", { headers: auth, body: { proposalId: "p1" } });
    expect(r.status).toBe(400);
    expect(m.applyPatch).not.toHaveBeenCalled();
  });
  it("/api/patch/apply returns 409 when applying fails", async () => {
    m.applyPatch.mockReturnValue({ ok: false, error: "NOT_APPROVED" });
    const r = await call("post", "/api/patch/apply", {
      headers: auth, body: { proposalId: "p1", approvalId: "a1" },
    });
    expect(r.status).toBe(409);
  });
  it("/api/tasks/:id returns 404 when the task does not exist", async () => {
    m.getTask.mockReturnValue(null);
    const r = await call("get", "/api/tasks/:id", { headers: auth, params: { id: "t1" } });
    expect(r.status).toBe(404);
  });
  it("/api/audit caps the limit at 500 and defaults to 50", async () => {
    m.getAudit.mockReturnValue([]);
    m.readRecentAuditEvents.mockReturnValue([]);
    await call("get", "/api/audit", { headers: auth, query: { limit: "9999" } });
    expect(m.getAudit).toHaveBeenLastCalledWith(500);
    await call("get", "/api/audit", { headers: auth });
    expect(m.getAudit).toHaveBeenLastCalledWith(50);
  });
});
