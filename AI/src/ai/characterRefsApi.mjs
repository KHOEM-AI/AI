import { guard, policy } from "./api.mjs";
import { listRefs, addRef, removeRef } from "./characterRefs.mjs";

const CODE = { not_found: 404, bad_path: 400, bad_index: 400, too_many: 409 };
const fail = (res, r) => res.status(CODE[r?.reason] ?? 400).json({ error: r?.reason ?? "failed" });

export function listHandler(req, res) {
  const refs = listRefs(req.params.id);
  return refs ? res.json({ refs }) : fail(res, { reason: "not_found" });
}
export function addHandler(req, res) {
  try {
    const r = addRef(req.params.id, req.body || {});
    return r.ok ? res.json(r) : fail(res, r);
  } catch {
    return res.status(500).json({ error: "failed" });
  }
}
export function removeHandler(req, res) {
  try {
    const r = removeRef(req.params.id, req.params.n);
    return r.ok ? res.json(r) : fail(res, r);
  } catch {
    return res.status(500).json({ error: "failed" });
  }
}

export function registerCharacterRefsApi(app) {
  app.get("/api/characters/:id/refs", guard, policy("characters.read"), listHandler);
  app.post("/api/characters/:id/refs", guard, policy("characters.write"), addHandler);
  app.delete("/api/characters/:id/refs/:n", guard, policy("characters.write"), removeHandler);
}
