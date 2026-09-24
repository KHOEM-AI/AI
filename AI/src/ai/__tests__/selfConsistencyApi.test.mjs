import { describe, it, expect, vi, beforeEach } from "vitest";

const m = vi.hoisted(() => ({
  analyzeConsistency: vi.fn(),
}));

vi.mock("../selfConsistency.mjs", () => ({
  analyzeConsistency: m.analyzeConsistency,
}));

vi.mock("../khoem.mjs", () => ({
  khoemReply: vi.fn(),
}));

vi.mock("../permission.mjs", () => ({
  policyCheck: vi.fn(),
  getAudit: vi.fn(),
  DECISION: {
    ALLOW: "ALLOW",
    DENY: "DENY",
    REQUIRE_APPROVAL: "REQUIRE_APPROVAL",
  },
}));

vi.mock("../approvals.mjs", () => ({
  createApprovalRequest: vi.fn(),
  getApproval: vi.fn(),
  listApprovals: vi.fn(),
  approveRequest: vi.fn(),
  rejectRequest: vi.fn(),
  verifyBeforeExecution: vi.fn(),
  markExecuted: vi.fn(),
}));

vi.mock("../tasks.mjs", () => ({
  emit: vi.fn(),
  getAllTasks: vi.fn(),
  getTask: vi.fn(),
  getEvents: vi.fn(),
}));

vi.mock("../killswitch.mjs", () => ({
  isKilled: vi.fn(() => false),
  activateKillSwitch: vi.fn(),
  deactivateKillSwitch: vi.fn(),
  getKillSwitchStatus: vi.fn(),
}));

vi.mock("../rollback.mjs", () => ({
  createSnapshot: vi.fn(),
  listSnapshots: vi.fn(),
  getSnapshot: vi.fn(),
  buildRollbackPlan: vi.fn(),
}));

vi.mock("../sandbox.mjs", () => ({
  runSandboxTest: vi.fn(),
}));

vi.mock("../patch.mjs", () => ({
  proposePatch: vi.fn(),
  getProposal: vi.fn(),
  listProposals: vi.fn(),
  applyPatch: vi.fn(),
}));

vi.mock("../budget.mjs", () => ({
  createBudget: vi.fn(),
  recordUsage: vi.fn(),
  checkBudget: vi.fn(),
  getBudget: vi.fn(),
  listBudgets: vi.fn(),
}));

vi.mock("../circuitBreaker.mjs", () => ({
  listBreakers: vi.fn(),
  getBreakerState: vi.fn(),
}));

vi.mock("../metrics.mjs", () => ({
  getMetrics: vi.fn(),
}));

vi.mock("../goal.mjs", () => ({
  createGoal: vi.fn(),
  getGoal: vi.fn(),
  listGoals: vi.fn(),
  linkTaskToGoal: vi.fn(),
  getGoalProgress: vi.fn(),
  setGoalStatus: vi.fn(),
}));

vi.mock("../modelRouting.mjs", () => ({
  decideProvider: vi.fn(),
  listProviders: vi.fn(),
  getRoutingHistory: vi.fn(),
}));

vi.mock("../verification.mjs", () => ({
  runVerification: vi.fn(),
  getLastVerification: vi.fn(),
  listVerifications: vi.fn(),
}));

vi.mock("../audit.mjs", () => ({
  readRecentAuditEvents: vi.fn(),
}));

vi.mock("../ideas.mjs", () => ({
  listIdeas: vi.fn(),
  rankIdeas: vi.fn(),
  getIdea: vi.fn(),
}));

vi.mock("../planning.mjs", () => ({
  listPlans: vi.fn(),
  getPlan: vi.fn(),
}));

vi.mock("../experiments.mjs", () => ({
  listExperiments: vi.fn(),
  getExperiment: vi.fn(),
  transitionExperiment: vi.fn(),
}));

vi.mock("../selfEval.mjs", () => ({
  selfEvaluate: vi.fn(),
}));

import { registerApi } from "../api.mjs";

const routes = [];
const fakeApp = {};

for (const method of ["get", "post", "put", "patch", "delete", "use"]) {
  fakeApp[method] = (path, ...handlers) => {
    routes.push({ method, path, handlers });
  };
}

registerApi(fakeApp);

function findRoute(method, path) {
  const route = routes.find(
    (r) => r.method === method && r.path === path
  );

  if (!route) throw new Error(`Route not found: ${method} ${path}`);
  return route;
}

async function call(method, path, { headers = {}, body } = {}) {
  const route = findRoute(method, path);

  const req = {
    body,
    get(name) {
      const key = Object.keys(headers).find(
        (k) => k.toLowerCase() === name.toLowerCase()
      );
      return key ? headers[key] : undefined;
    },
  };

  let result = null;

  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      result = value;
      return this;
    },
  };

  let index = 0;

  const next = async () => {
    const handler = route.handlers[index++];
    if (handler) return handler(req, res, next);
  };

  await next();

  return {
    status: res.statusCode,
    body: result,
  };
}

const KEY = "secret-key-123";

beforeEach(() => {
  vi.resetAllMocks();
  process.env.KHOEM_API_KEY = KEY;
});

describe("POST /api/self-consistency", () => {
  it("returns the consistency analysis for valid answers", async () => {
    m.analyzeConsistency.mockReturnValue({
      status: "CONSISTENT",
      confidence: "HIGH",
      count: 3,
      agreementRatio: 1,
    });

    const r = await call("post", "/api/self-consistency", {
      headers: { "x-api-key": KEY },
      body: {
        answers: ["Phnom Penh", "Phnom Penh", "Phnom Penh"],
      },
    });

    expect(r.status).toBe(200);
    expect(r.body).toEqual({
      result: {
        status: "CONSISTENT",
        confidence: "HIGH",
        count: 3,
        agreementRatio: 1,
      },
    });

    expect(m.analyzeConsistency).toHaveBeenCalledWith([
      "Phnom Penh",
      "Phnom Penh",
      "Phnom Penh",
    ]);
  });

  it("returns 400 when answers is not an array", async () => {
    const r = await call("post", "/api/self-consistency", {
      headers: { "x-api-key": KEY },
      body: {
        answers: "Phnom Penh",
      },
    });

    expect(r.status).toBe(400);
    expect(r.body).toEqual({
      error: "answers must be an array",
    });

    expect(m.analyzeConsistency).not.toHaveBeenCalled();
  });

  it("returns 401 when the API key is missing", async () => {
    const r = await call("post", "/api/self-consistency", {
      body: {
        answers: ["A", "A"],
      },
    });

    expect(r.status).toBe(401);
    expect(m.analyzeConsistency).not.toHaveBeenCalled();
  });

  it("returns 503 when KHOEM_API_KEY is not configured", async () => {
    delete process.env.KHOEM_API_KEY;

    const r = await call("post", "/api/self-consistency", {
      headers: { "x-api-key": KEY },
      body: {
        answers: ["A", "A"],
      },
    });

    expect(r.status).toBe(503);
    expect(m.analyzeConsistency).not.toHaveBeenCalled();
  });
});
