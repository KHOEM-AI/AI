// src/ai/charactersApi.mjs
// Routes: /api/library, /api/characters  (ត្រូវការ x-api-key ដូច route ផ្សេងៗ)
import crypto from "node:crypto";
import express from "express";
import { GROUPS, listItems, getItem } from "./library.mjs";
import {
  createCharacter, getCharacter, listCharacters, mergeCharacter, getTimeline, buildPrompt,
} from "./characters.mjs";
import { createAsset, searchAssets, pickForStory, seedAssets } from "./assets.mjs";
import { guard, policy } from "./api.mjs";

const wrap = (fn) => (req, res) => {
  try {
    const r = fn(req);
    if (r && r.ok === false) return res.status(r.reason === "not_found" ? 404 : 400).json({ error: r.reason });
    res.json({ result: r });
  } catch (e) {
    res.status(500).json({ error: e.message || "មានបញ្ហា" });
  }
};

export function registerCharactersApi(app) {
  const big = express.json({ limit: "2mb" });
  app.get("/api/library/groups", guard, policy("library.read"), wrap(() => GROUPS));
  app.get("/api/library", guard, policy("library.read"), wrap((req) => listItems({
    group: req.query.group, tag: req.query.tag, source: req.query.source,
  })));
  app.get("/api/library/:id", guard, policy("library.read"), wrap((req) => getItem(req.params.id) ?? { ok: false, reason: "not_found" }));

  // ធនធានទូទៅ (assets) — ត្រូវដាក់ "/api/assets" ក្នុង BRIDGE_GET/POST របស់ server.mjs ដែរ
  const bool = (v) => (v === "true" ? true : v === "false" ? false : undefined);
  app.get("/api/assets", guard, policy("assets.read"), wrap((req) => searchAssets({
    q: req.query.q, group: req.query.group, country: req.query.country,
    region: req.query.region, tag: req.query.tag, alcohol: bool(req.query.alcohol),
  })));
  app.get("/api/assets/pick", guard, policy("assets.read"), wrap((req) => pickForStory({
    country: req.query.country, region: req.query.region, limit: req.query.limit,
    groups: req.query.groups ? String(req.query.groups).split(",") : undefined,
    alcohol: bool(req.query.alcohol),
  })));
  app.post("/api/assets", guard, policy("assets.write"), wrap((req) => createAsset(req.body || {})));
  app.post("/api/assets/seed", guard, policy("assets.write"), wrap(() => seedAssets()));

  app.get("/api/characters", guard, policy("characters.read"), wrap(() => listCharacters()));
  app.post("/api/characters", guard, policy("characters.write"), big, wrap((req) => createCharacter(req.body || {})));
  app.get("/api/characters/:id", guard, policy("characters.read"), wrap((req) => getCharacter(req.params.id) ?? { ok: false, reason: "not_found" }));
  app.post("/api/characters/:id/merge", guard, policy("characters.write"), big, wrap((req) =>
    mergeCharacter(req.params.id, req.body?.update, { force: req.body?.force === true })));
  app.get("/api/characters/:id/timeline", guard, policy("characters.read"), wrap((req) => getTimeline(req.params.id) ?? { ok: false, reason: "not_found" }));
  app.get("/api/characters/:id/prompt", guard, policy("characters.read"), wrap((req) =>
    ({ prompt: buildPrompt(req.params.id, { outfit: req.query.outfit }) })));
}
