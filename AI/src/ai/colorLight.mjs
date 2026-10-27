// Read-only API over the khoem-now color/light data store.
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(process.env.COLORLIGHT_DIR || path.join(os.homedir(), "khoem-now-github"));

async function readJson(rel) {
  const full = path.resolve(ROOT, rel);
  if (!full.startsWith(ROOT + path.sep)) {
    throw new Error("path is outside the data folder");
  }
  return JSON.parse(await readFile(full, "utf8"));
}

async function loadIndex() {
  const idx = await readJson("data/index.json");
  return Array.isArray(idx.datasets) ? idx.datasets : [];
}

export function registerColorLightApi(app) {
  app.get("/api/colorlight", async (req, res) => {
    try {
      res.json({ datasets: await loadIndex() });
    } catch (err) {
      res.status(503).json({ error: "colorlight_unavailable", message: err.message });
    }
  });

  app.get("/api/colorlight/data", async (req, res) => {
    try {
      const wanted = String(req.query.path || "");
      const entry = (await loadIndex()).find((d) => d.path === wanted);
      if (!entry) {
        return res.status(404).json({ error: "unknown_dataset" });
      }
      const data = await readJson(entry.path);
      if (!Array.isArray(data.items)) {
        return res.json(data);
      }
      const q = String(req.query.q || "").trim().toLowerCase();
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 1000);
      const found = q
        ? data.items.filter((it) => JSON.stringify(it).toLowerCase().includes(q))
        : data.items;
      res.json({
        path: entry.path,
        name_en: data.name_en,
        name_km: data.name_km,
        total: found.length,
        items: found.slice(0, limit),
      });
    } catch (err) {
      res.status(500).json({ error: "colorlight_failed", message: err.message });
    }
  });
}
