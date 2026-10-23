// src/ai/conversations.mjs — read-only seed of { input, response } pairs for khoem-local.
// Learned answers (~/khoem-learned.json) always win. Never writes anything.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { norm } from "./learn.mjs";

export const SEED_FILE =
  process.env.KHOEM_CONVERSATIONS_FILE ||
  fileURLToPath(new URL("./data/conversations.json", import.meta.url));

let cache = { mtime: -1, map: {} };

export function parseConversations(list) {
  const map = {};
  if (!Array.isArray(list)) return map;
  for (const e of list) {
    if (!e || typeof e.input !== "string" || typeof e.response !== "string") continue;
    const k = norm(e.input);
    if (k && e.response.trim() && !Object.hasOwn(map, k)) map[k] = e.response;
  }
  return map;
}

export function loadConversations(file = SEED_FILE) {
  try {
    const mtime = fs.statSync(file).mtimeMs;
    if (file === SEED_FILE && mtime === cache.mtime) return cache.map;
    const map = parseConversations(JSON.parse(fs.readFileSync(file, "utf8")));
    if (file === SEED_FILE) cache = { mtime, map };
    return map;
  } catch {
    return {};
  }
}

export function withSeed(learned, seed = loadConversations()) {
  return { ...seed, ...(learned ?? {}) };
}
