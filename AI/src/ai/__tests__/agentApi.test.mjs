import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";

const m = vi.hoisted(() => ({ khoemReply: vi.fn() }));
vi.mock("../khoem.mjs", () => ({ khoemReply: m.khoemReply }));
// Keep the real audit exports but never write the real audit log.
vi.mock("../audit.mjs", async (importOriginal) => ({
  ...(await importOriginal()),
  recordAuditEvent: vi.fn(),
  readRecentAuditEvents: vi.fn(() => []),
}));

const KEY = "secret-key-123";
const auth = { "x-api-key": KEY };
const routes = [];
let savedKey;

beforeAll(async () => {
  const { registerApi } = await import("../api.mjs");
  const fakeApp = {};
  for (const method of ["get", "post", "put", "patch", "delete", "use"]) {
    fakeApp[method] = (path, ...handlers) => routes.push({ method, path, handlers });
  }
  registerApi(fakeApp);
});

beforeEach(() => {
  savedKey = process.env.KHOEM_API_KEY;
  process.env.KHOEM_API_KEY = KEY;
  m.khoemReply.mockReset();
  m.khoemReply.mockResolvedValue("mock reply");
});

afterEach(() => {
  if (savedKey === undefined) delete process.env.KHOEM_API_KEY;
  else process.env.KHOEM_API_KEY = savedKey;
});

async function runAgentApi(body, headers = auth) {
  const route = routes.find((r) => r.method === "post" && r.path === "/api/agent/run");
  if (!route) throw new Error("route not found");
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const req = { body, query: {}, params: {}, get: (k) => h[String(k).toLowerCase()] };
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

const okStep = { description: "scan the repo", tools: ["scan-repo"] };
const okBody = (over = {}) => ({
  goal: "scan the project",
  steps: [okStep],
  verificationCriteria: ["scan finished"],
  ...over,
});

describe("POST /api/agent/run — valid run", () => {
  it("a string-result tool cannot be verified, so the run is FAILED", async () => {
    const r = await runAgentApi(okBody());
    expect(r.status).toBe(200);
    expect(r.json.result.status).toBe("FAILED");
    expect(m.khoemReply).toHaveBeenCalledWith([{ role: "user", content: "/scan" }]);
  });

  it("passes step input to the tool", async () => {
    const r = await runAgentApi(okBody({
      steps: [{ description: "find it", tools: ["find-symbol"], input: { q: "createGoal" } }],
    }));
    expect(r.status).toBe(200);
    expect(r.json.result.status).toBe("FAILED");
    expect(m.khoemReply).toHaveBeenCalledWith([{ role: "user", content: "/find createGoal" }]);
  });

  it("without verificationCriteria the plan is invalid and nothing runs", async () => {
    const r = await runAgentApi(okBody({ verificationCriteria: [] }));
    expect(r.status).toBe(200);
    expect(r.json.result.status).toBe("FAILED");
    expect(r.json.result.reason).toMatch(/MISSING_VERIFICATION_CRITERIA/);
    expect(m.khoemReply).not.toHaveBeenCalled();
  });
});

describe("POST /api/agent/run — input validation (400)", () => {
  it.each([
    ["no body", undefined],
    ["goal missing", okBody({ goal: undefined })],
    ["goal empty", okBody({ goal: "   " })],
    ["goal not a string", okBody({ goal: 123 })],
    ["goal over 200 chars", okBody({ goal: "x".repeat(201) })],
    ["steps missing", okBody({ steps: undefined })],
    ["steps empty", okBody({ steps: [] })],
    ["steps over 5", okBody({ steps: Array(6).fill(okStep) })],
    ["more than 3 tools in a step", okBody({ steps: [{ description: "d", tools: ["scan-repo", "scan-repo", "scan-repo", "scan-repo"] }] })],
  ])("%s -> 400 and nothing runs", async (_name, body) => {
    const r = await runAgentApi(body);
    expect(r.status).toBe(400);
    expect(m.khoemReply).not.toHaveBeenCalled();
  });

  it("goal of exactly 200 chars is accepted", async () => {
    const r = await runAgentApi(okBody({ goal: "x".repeat(200) }));
    expect(r.status).toBe(200);
  });
});

describe("POST /api/agent/run — structured tool", () => {
  it("scan-repo-data runs through the agent without calling khoemReply", async () => {
    const r = await runAgentApi(okBody({
      steps: [{ description: "scan data", tools: ["scan-repo-data"] }],
      verificationCriteria: ["scan.fileCount>0"],
    }));
    expect(r.status).toBe(200);
    expect(r.json.result.status).toBe("SUCCESS");
    expect(r.json.result.evidence).toContain("step 1: tool scan-repo-data executed");
    expect(m.khoemReply).not.toHaveBeenCalled();
  });
});

describe("POST /api/agent/run — allowlisted criteria", () => {
  const dataStep = [{ description: "scan data", tools: ["scan-repo-data"] }];
  it("an unknown criterion cannot be verified, so the run is FAILED", async () => {
    const r = await runAgentApi(okBody({ steps: dataStep, verificationCriteria: ["deploy to production"] }));
    expect(r.status).toBe(200);
    expect(r.json.result.status).toBe("FAILED");
  });
  it("one unknown criterion next to a known one still FAILS", async () => {
    const r = await runAgentApi(okBody({ steps: dataStep, verificationCriteria: ["scan.fileCount>0", "deploy to production"] }));
    expect(r.json.result.status).toBe("FAILED");
  });
  it("evidence names each criterion", async () => {
    const r = await runAgentApi(okBody({ steps: dataStep, verificationCriteria: ["scan.fileCount>0"] }));
    expect(r.json.result.status).toBe("SUCCESS");
    expect(r.json.result.evidence).toContain("criterion scan.fileCount>0: met");
  });
});

describe("POST /api/agent/run — goalVerifier criteria", () => {
  const dataStep = [{ description: "scan data", tools: ["scan-repo-data"] }];
  it("scan.ok=true is verified against the real scan result", async () => {
    const r = await runAgentApi(okBody({ steps: dataStep, verificationCriteria: ["scan.ok=true"] }));
    expect(r.json.result.status).toBe("SUCCESS");
    expect(r.json.result.evidence).toContain("criterion scan.ok=true: met");
  });
});

describe("POST /api/agent/run — allowlist (403)", () => {
  it.each(["apply-patch", "propose-patch", "run-verification", "constructor", "__proto__", "toString", "nope"])(
    "tool %s is refused with 403 and nothing runs",
    async (t) => {
      const r = await runAgentApi(okBody({ steps: [{ description: "bad tool", tools: [t] }] }));
      expect(r.status).toBe(403);
      expect(m.khoemReply).not.toHaveBeenCalled();
    },
  );

  it("one bad tool in a later step blocks the whole run", async () => {
    const r = await runAgentApi(okBody({ steps: [okStep, { description: "bad", tools: ["apply-patch"] }] }));
    expect(r.status).toBe(403);
    expect(m.khoemReply).not.toHaveBeenCalled();
  });

  it("a step cannot raise its own risk above LOW", async () => {
    const r = await runAgentApi(okBody({ steps: [{ ...okStep, risk: "HIGH" }] }));
    expect(r.status).toBe(200);
    expect(r.json.result.status).toBe("FAILED");
  });
});

describe("POST /api/agent/run — auth", () => {
  it("missing API key -> 401 and nothing runs", async () => {
    const r = await runAgentApi(okBody(), {});
    expect(r.status).toBe(401);
    expect(m.khoemReply).not.toHaveBeenCalled();
  });

  it("wrong API key -> 401", async () => {
    const r = await runAgentApi(okBody(), { "x-api-key": "X".repeat(KEY.length) });
    expect(r.status).toBe(401);
    expect(m.khoemReply).not.toHaveBeenCalled();
  });
});
