// Chat replies from the khoem-now data store (data/chat/*.json). Read-only.
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(
  process.env.CHAT_DATA_DIR || process.env.COLORLIGHT_DIR || path.join(os.homedir(), "khoem-now"),
);
const PRO_RATE = 0.5;
let cache = null;
let cacheAt = 0;

async function readJson(rel) {
  const full = path.resolve(ROOT, rel);
  if (!full.startsWith(ROOT + path.sep)) throw new Error("path is outside the data folder");
  return JSON.parse(await readFile(full, "utf8"));
}

async function loadRules() {
  if (cache && Date.now() - cacheAt < 30000) return cache;
  const idx = await readJson("data/index.json");
  const sets = (Array.isArray(idx.datasets) ? idx.datasets : []).filter(
    (d) => typeof d.path === "string" && d.path.startsWith("data/chat/"),
  );
  const rules = [];
  for (const d of sets) {
    const data = await readJson(d.path);
    if (Array.isArray(data.items)) rules.push(...data.items);
  }
  cache = rules;
  cacheAt = Date.now();
  return rules;
}

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[\s?!។៕.,]/g, "")
    .replaceAll("ប្រូ", "")
    .replace(/ដ/g, "ត");

const isAscii = (s) => /^[\x00-\x7f]*$/.test(s);

// Substring matches are only trusted for short, non-negated sentences.
// Longer or negated sentences fall through to KHOEM_AI.
const NEGATION = ["មិន", "អត់", "កុំ", "គ្មាន"];
const MAX_EXTRA = 8;

function matches(q, key) {
  if (key.startsWith("=")) return q === norm(key.slice(1));
  const nk = norm(key);
  if (isAscii(nk)) return q === nk;
  if (!q.includes(nk)) return false;
  const rest = q.replace(nk, "");
  if (rest.length > MAX_EXTRA) return false;
  return !NEGATION.some((w) => rest.includes(w));
}

const fill = (s) => s.replace(/\{pro\}/g, () => (Math.random() < PRO_RATE ? "ប្រូ" : ""));

export async function findChatReply(input) {
  const q = norm(input);
  if (!q) return null;
  const lang = /[\u1780-\u17FF]/.test(String(input)) ? "km" : "en";
  const rules = await loadRules();
  const hit = rules.find((r) => Array.isArray(r.keys) && r.keys.some((k) => matches(q, k)));
  if (!hit) return null;
  const list = lang === "km" ? hit.km : hit.en;
  if (!Array.isArray(list) || list.length === 0) return null;
  const text = list[Math.floor(Math.random() * list.length)];
  return lang === "km" ? fill(text) : text.replaceAll("{pro}", "");
}
