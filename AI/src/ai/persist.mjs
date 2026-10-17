// src/ai/persist.mjs — tiny atomic JSON persistence (off under Vitest or KHOEM_PERSIST=0)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = process.env.KHOEM_DATA_DIR || fileURLToPath(new URL("../../data", import.meta.url));
const ON = !process.env.VITEST && process.env.KHOEM_PERSIST !== "0";

// A corrupt file is never silently overwritten: keep a copy first, then warn.
function quarantine(file, name, why) {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const copy = file + ".corrupt-" + stamp;
    fs.copyFileSync(file, copy);
    console.error("[persist]", name, "unreadable (" + why + "); copy kept at", copy);
  } catch (e) {
    console.error("[persist]", name, "unreadable (" + why + "); could not keep a copy:", e.message);
  }
}

export function loadItems(name) {
  if (!ON) return [];
  const file = path.join(DIR, name + ".json");
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (e) {
    if (!e || e.code !== "ENOENT") console.error("[persist]", name, "read failed:", e && e.message);
    return [];
  }
  try {
    const j = JSON.parse(raw);
    if (j && Array.isArray(j.items)) return j.items;
    throw new Error("items is not an array");
  } catch (e) {
    quarantine(file, name, e.message);
    return [];
  }
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
