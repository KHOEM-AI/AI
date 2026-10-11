import { guard, policy } from "./api.mjs";
import { buildShotList, splitBeats } from "./shotlist.mjs";
import { listCharacters, buildPrompt } from "./characters.mjs";
import { searchAssets } from "./assets.mjs";

const arr = (x) => (Array.isArray(x) ? x : Array.isArray(x?.items) ? x.items : []);
const safePrompt = (id) => {
  try { return buildPrompt(id) ?? null; } catch { return null; }
};

export function shotlistHandler(req, res) {
  try {
    const b = req.body || {};
    const text = typeof b.text === "string" ? b.text : "";
    const beats = Array.isArray(b.beats) ? b.beats.map(String) : splitBeats(text);
    if (!beats.length) return res.status(400).json({ error: "beats or text is required" });
    if (beats.join("").length > 20000) return res.status(413).json({ error: "input too long" });
    const characters = arr(listCharacters()).map((c) => ({
      id: c.id ?? null,
      name: c.name ?? c.nameKm ?? c.nameEn ?? "",
      prompt: c.id ? safePrompt(c.id) : null,
    }));
    const assets = arr(searchAssets({}));
    const voices = b.voices && typeof b.voices === "object" && !Array.isArray(b.voices) ? b.voices : {};
    return res.json(buildShotList({ title: b.title, beats, characters, assets, voices, maxShots: b.maxShots }));
  } catch {
    return res.status(500).json({ error: "shotlist failed" });
  }
}

export function registerShotlistApi(app) {
  app.post("/api/shotlist", guard, policy("characters.read"), policy("assets.read"), shotlistHandler);
}
