import { describe, it, expect, beforeAll } from "vitest";

const KEY = "test-key-engines";
const routes = [];
let ready = false;

async function call(method, path, { body, key = KEY } = {}) {
  const route = routes.find((r) => r.method === method && r.path === path);
  if (!route) throw new Error("route not registered: " + method + " " + path);
  const params = {};
  const m = path.match(/:(\w+)/);
  if (m && body && body.__param) { params[m[1]] = body.__param; }
  const headers = { "x-api-key": key };
  const req = { get: (h) => headers[h.toLowerCase()], body: body && body.__param ? body.payload : body, params, query: {} };
  const res = {
    statusCode: 200, body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  for (const h of route.handlers) {
    let nexted = false;
    await h(req, res, () => { nexted = true; });
    if (!nexted) break;
  }
  return res;
}

beforeAll(async () => {
  process.env.KHOEM_API_KEY = KEY;
  const { registerApi } = await import("../api.mjs");
  const app = new Proxy({}, {
    get: (_, method) => (path, ...handlers) => {
      if (typeof path === "string") routes.push({ method: method.toUpperCase(), path, handlers });
    },
  });
  registerApi(app);
  ready = true;
});

describe("engine API routes (Phases 15/16/18/19)", () => {
  it("registers the new routes", () => {
    expect(ready).toBe(true);
    for (const p of ["/api/ideas", "/api/plans", "/api/experiments", "/api/selfeval"]) {
      expect(routes.some((r) => r.path === p)).toBe(true);
    }
  });

  it("rejects a missing/wrong api key with 401", async () => {
    const res = await call("GET", "/api/ideas", { key: "wrong" });
    expect(res.statusCode).toBe(401);
  });

  it("creates and lists an idea; bad input gives 400", async () => {
    const ok = await call("POST", "/api/ideas", { body: { title: "api idea", benefitScore: 5 } });
    expect(ok.statusCode).toBe(200);
    expect(ok.body.result.executable).toBe(false);
    const list = await call("GET", "/api/ideas");
    expect(list.body.result.some((i) => i.title === "api idea")).toBe(true);
    const bad = await call("POST", "/api/ideas", { body: {} });
    expect(bad.statusCode).toBe(400);
  });

  it("returns 404 for an unknown idea id", async () => {
    const res = await call("GET", "/api/ideas/:id", { body: { __param: "nope", payload: {} } });
    expect(res.statusCode).toBe(404);
  });

  it("creates a plan and flags HIGH risk as needing approval", async () => {
    const res = await call("POST", "/api/plans", {
      body: { goal: "g", steps: [{ description: "deploy", risk: "HIGH" }], verificationCriteria: ["ok"] },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.result.requiresApproval).toBe(true);
    expect(res.body.result.executable).toBe(false);
  });

  it("experiment transitions: valid ok, invalid gives 409, unknown gives 404", async () => {
    const created = await call("POST", "/api/experiments", { body: { goal: "g", hypothesis: "h" } });
    const id = created.body.result.experimentId;
    const skip = await call("POST", "/api/experiments/:id/transition", { body: { __param: id, payload: { to: "COMPLETED" } } });
    expect(skip.statusCode).toBe(409);
    const run = await call("POST", "/api/experiments/:id/transition", { body: { __param: id, payload: { to: "RUNNING" } } });
    expect(run.statusCode).toBe(200);
    const none = await call("POST", "/api/experiments/:id/transition", { body: { __param: "nope", payload: { to: "RUNNING" } } });
    expect(none.statusCode).toBe(404);
  });

  it("selfeval is advisory and test failure overrides a success claim", async () => {
    const res = await call("POST", "/api/selfeval", { body: { goalAchieved: true, testsPassed: false, evidence: ["x"] } });
    expect(res.statusCode).toBe(200);
    expect(res.body.result.result).toBe("FAILED");
    expect(res.body.result.advisory).toBe(true);
  });
});
