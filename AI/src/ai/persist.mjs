// src/ai/persist.mjs — tiny atomic JSON persistence (off under Vitest or KHOEM_PERSIST=0)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = process.env.KHOEM_DATA_DIR || fileURLToPath(new URL("../../data", import.meta.url));
const ON = !process.env.VITEST && process.env.KHOEM_PERSIST !== "0";

export function loadItems(name) {
  if (!ON) return [];
  try {
    const j = JSON.parse(fs.readFileSync(path.join(DIR, name + ".json"), "utf8"));
    return Array.isArray(j.items) ? j.items : [];
  } catch { return []; }
}

export function saveItems(name, items) {
  if (!ON) return;
  try {
    fs.mkdirSync(DIR, { recursive: true });
    const f = path.join(DIR, name + ".json");
    fs.writeFileSync(f + ".tmp", JSON.stringify({ version: 1, items }, null, 2));
    fs.renameSync(f + ".tmp", f);
  } catch (e) { console.error("[persist]", name, e.message); }
}
