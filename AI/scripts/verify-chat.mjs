#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { findChatReply } from "../src/ai/chatData.mjs";

const KHOEM = process.env.KHOEM_PATH || path.join(process.env.HOME || ".", "khoem-now");
const CHAT = path.join(KHOEM, "data/chat");
const INDEX = path.join(KHOEM, "data/index.json");
const SCOPE = /^(tech|code|tsx|tsx-advanced)\.json$/;
const ALL = process.argv.includes("--all");

let fail = 0;
const bad = (m) => { console.error("FAIL:", m); fail++; };

if (!fs.existsSync(CHAT)) { console.error("missing", CHAT); process.exit(2); }
const index = JSON.parse(fs.readFileSync(INDEX, "utf8"));
const indexed = new Set(index.datasets.filter(d => d.path.startsWith("data/chat/")).map(d => d.path));

let total = 0;
const seen = new Map();
const files = fs.readdirSync(CHAT).filter(n => n.endsWith(".json")).sort();

for (const name of files) {
  const rel = "data/chat/" + name;
  let ds;
  try { ds = JSON.parse(fs.readFileSync(path.join(CHAT, name), "utf8")); }
  catch (e) { bad(name + ": JSON — " + e.message); continue; }
  if (!indexed.has(rel)) bad(name + ": missing from data/index.json");
  if (!ds.items) continue;
  if (!ALL && !SCOPE.test(name)) continue;

  for (const it of ds.items) {
    if (!Array.isArray(it.keys) || !it.keys.length) { bad(name + ": item without keys"); continue; }
    if (!it.km?.[0]) bad(name + ": item missing km[0]");
    if (!it.en?.[0]) bad(name + ": item missing en[0]");
    for (const k of it.keys) {
      const q = k.replace(/^=/, "");
      if (seen.has(q)) console.log("WARN dup key '" + q + "' in " + name + " and " + seen.get(q));
      seen.set(q, name);
      const a = await findChatReply(q);
      if (![...(it.km || []), ...(it.en || [])].some((x) => a === x.replaceAll("{pro}", "ប្រូ") || a === x.replaceAll("{pro}", ""))) { bad(name + ": '" + q + "' mismatched"); }
      total++;
    }
  }
}

console.log("checked " + total + " keys / " + files.length + " files — " + fail + " issue(s)");
console.log("scope: " + (ALL ? "ALL" : SCOPE.source));
process.exit(fail ? 1 : 0);
