import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

vi.mock("../api.mjs", () => ({ guard: () => {}, policy: (k) => ({ policy: k }) }));

let C, R, A, dir, id;
const mkRes = () => ({ code: 200, body: null, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; } });

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "refs-test-"));
  process.env.LIBRARY_FILE = path.join(dir, "library.json");
  C = await import("../characters.mjs");
  R = await import("../characterRefs.mjs");
  A = await import("../characterRefsApi.mjs");
  id = C.createCharacter({ name: "ទទួលសាកល្បង" }).item.id;
});
afterAll(() => {
  delete process.env.LIBRARY_FILE;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("characterRefs", () => {
  it("accepts only safe local or https paths", () => {
    expect(R.validRefPath("data/refs/me.jpg")).toBe(true);
    expect(R.validRefPath("https://example.com/a.png")).toBe(true);
    for (const bad of ["../x.jpg", "data/refs/../x.jpg", "/etc/passwd", "http://a.com/a.jpg", "data/refs/a.txt", "data\\refs\\a.jpg", "", "file:///a.jpg", "data/refs/a\u0000.jpg"]) {
      expect(R.validRefPath(bad)).toBe(false);
    }
  });
  it("adds, lists, dedupes and removes", () => {
    const a = R.addRef(id, { label: "front", path: "data/refs/me.jpg" });
    expect(a.ok).toBe(true);
    expect(a.duplicate).toBe(false);
    expect(R.addRef(id, { path: "data/refs/me.jpg" }).duplicate).toBe(true);
    expect(R.listRefs(id)).toEqual([{ label: "front", path: "data/refs/me.jpg" }]);
    R.addRef(id, { path: "data/refs/two.png" });
    const r = R.removeRef(id, 0);
    expect(r.ok).toBe(true);
    expect(r.refs.map((x) => x.path)).toEqual(["data/refs/two.png"]);
    expect(R.removeRef(id, 5).reason).toBe("bad_index");
  });
  it("limits the number of refs and rejects unknown characters", () => {
    const id2 = C.createCharacter({ name: "ដែនកំណត់" }).item.id;
    for (let i = 0; i < R.MAX_REFS; i++) expect(R.addRef(id2, { path: "data/refs/p" + i + ".jpg" }).ok).toBe(true);
    expect(R.addRef(id2, { path: "data/refs/extra.jpg" }).reason).toBe("too_many");
    expect(R.addRef("nope", { path: "data/refs/a.jpg" }).reason).toBe("not_found");
    expect(R.listRefs("nope")).toBeNull();
  });
});

describe("characterRefsApi", () => {
  it("registers 3 routes behind guard and policies", () => {
    const routes = [];
    const app = { get: (p, ...h) => routes.push(["GET", p, h]), post: (p, ...h) => routes.push(["POST", p, h]), delete: (p, ...h) => routes.push(["DELETE", p, h]) };
    A.registerCharacterRefsApi(app);
    expect(routes.map((r) => r[0] + " " + r[1])).toEqual(["GET /api/characters/:id/refs", "POST /api/characters/:id/refs", "DELETE /api/characters/:id/refs/:n"]);
    expect(routes[1][2][1]).toEqual({ policy: "characters.write" });
    expect(routes[0][2][1]).toEqual({ policy: "characters.read" });
  });
  it("answers 400, 404 and 200 correctly", () => {
    let res = mkRes();
    A.addHandler({ params: { id }, body: { path: "../x.jpg" } }, res);
    expect(res.code).toBe(400);
    res = mkRes();
    A.addHandler({ params: { id: "nope" }, body: { path: "data/refs/a.jpg" } }, res);
    expect(res.code).toBe(404);
    res = mkRes();
    A.addHandler({ params: { id }, body: { label: "side", path: "data/refs/side.webp" } }, res);
    expect(res.code).toBe(200);
    res = mkRes();
    A.listHandler({ params: { id } }, res);
    expect(res.body.refs.some((r) => r.path === "data/refs/side.webp")).toBe(true);
  });
});
