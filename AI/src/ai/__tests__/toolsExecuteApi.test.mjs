import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from "vitest";

const m = vi.hoisted(() => ({ khoemReply: vi.fn() }));

vi.mock("../khoem.mjs", () => ({ khoemReply: m.khoemReply }));
// Keep the real audit module's exports but never write the real audit log.
vi.mock("../audit.mjs", async (importOriginal) => ({
  ...(await importOriginal()),
  recordAuditEvent: vi.fn(),
  readRecentAuditEvents: vi.fn(() => []),
}));

import { getBudget } from "../budget.mjs";

const LIMIT = 3;
const KEY = "secret-key-123";
const auth = { "x-api-key": KEY };
const routes = [];
let savedKey;
let savedLimit;

beforeAll(async () => {
  savedLimit = process.env.KHOEM_TOOL_RATE_PER_MIN;
  process.env.KHOEM_TOOL_RATE_PER_MIN = String(LIMIT); // read inside registerApi()
  const { registerApi } = await import("../api.mjs");
  const fakeApp = {};
  for (const method of ["get", "post", "put", "patch", "delete", "use"]) {
    fakeApp[method] = (path, ...handlers) => routes.push({ method, path, handlers });
  }
  registerApi(fakeApp);
});

afterAll(() => {
  if (savedLimit === undefined) delete process.env.KHOEM_TOOL_RATE_PER_MIN;
  else process.env.KHOEM_TOOL_RATE_PER_MIN = savedLimit;
});

// Every test gets its own minute so the per-minute rate buckets never overlap.
let n = 0;
let now;
beforeEach(() => {
  savedKey = process.env.KHOEM_API_KEY;
  process.env.KHOEM_API_KEY = KEY;
  m.khoemReply.mockReset();
  m.khoemReply.mockResolvedValue("mock reply");
  now = Date.UTC(2030, 0, 1) + ++n * 10 * 60000;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(now));
});
afterEach(() => {
  vi.useRealTimers();
  if (savedKey === undefined) delete process.env.KHOEM_API_KEY;
  else process.env.KHOEM_API_KEY = savedKey;
});

async function exec(id, { headers = auth, body = {} } = {}) {
  const route = routes.find((r) => r.method === "post" && r.path === "/api/tools/:id/execute");
  if (!route) throw new Error("route not found");
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const req = { body, query: {}, params: { id }, get: (k) => h[String(k).toLowerCase()] };
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

const bucketId = () => "toolrate:user:" + Math.floor(Date.now() / 60000);

describe("POST /api/tools/:id/execute — allowlist", () => {
  it("scan-repo runs through executeTool", async () => {
    const r = await exec("scan-repo");
    expect(r.status).toBe(200);
    expect(r.json.result.status).toBe("EXECUTED");
    expect(r.json.result.result).toBe("mock reply");
    expect(m.khoemReply).toHaveBeenCalledWith([{ role: "user", content: "/scan" }]);
  });
  it("find-symbol passes input.q to the finder", async () => {
    const r = await exec("find-symbol", { body: { input: { q: "createGoal" } } });
    expect(r.status).toBe(200);
    expect(r.json.result.status).toBe("EXECUTED");
    expect(m.khoemReply).toHaveBeenCalledWith([{ role: "user", content: "/find createGoal" }]);
  });
  it("find-symbol without input.q -> 400", async () => {
    const r = await exec("find-symbol", { body: {} });
    expect(r.status).toBe(400);
  });
  it.each(["apply-patch", "propose-patch", "run-verification", "constructor", "__proto__", "toString", "nope"])(
    "%s is refused with 403 and nothing runs",
    async (id) => {
      const r = await exec(id);
      expect(r.status).toBe(403);
      expect(m.khoemReply).not.toHaveBeenCalled();
    },
  );
  it("a missing API key -> 401 and nothing runs", async () => {
    const r = await exec("scan-repo", { headers: {} });
    expect(r.status).toBe(401);
    expect(m.khoemReply).not.toHaveBeenCalled();
  });
});

describe("POST /api/tools/:id/execute — rate limit", () => {
  it(`allows ${LIMIT} calls per minute, then 429`, async () => {
    for (let i = 0; i < LIMIT; i++) {
      expect((await exec("scan-repo")).status).toBe(200);
    }
    const blocked = await exec("scan-repo");
    expect(blocked.status).toBe(429);
    expect(String(blocked.json.error)).toContain("rate limit");
    expect(m.khoemReply).toHaveBeenCalledTimes(LIMIT);
  });
  it("the next minute allows calls again", async () => {
    for (let i = 0; i < LIMIT; i++) await exec("scan-repo");
    expect((await exec("scan-repo")).status).toBe(429);
    vi.setSystemTime(new Date(now + 61000));
    expect((await exec("scan-repo")).status).toBe(200);
  });
  it("counts real usage in the budget bucket", async () => {
    await exec("scan-repo");
    await exec("scan-repo");
    expect(getBudget(bucketId()).usage.toolCalls).toBe(2);
  });
  it("refused (403) calls do not consume the limit", async () => {
    await exec("apply-patch");
    await exec("constructor");
    for (let i = 0; i < LIMIT; i++) {
      expect((await exec("scan-repo")).status).toBe(200);
    }
  });
});
