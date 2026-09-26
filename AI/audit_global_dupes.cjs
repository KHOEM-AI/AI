const fs = require("fs");
const path = "src/ai/khmer.mjs";
const text = fs.readFileSync(path, "utf8");

function normalize(s) {
  return String(s)
    .normalize("NFC")
    .toLowerCase()
    .replace(/[|]+/g, " ")
    .replace(/[។?!៖,:;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const entries = [];
const re = /^\s*\["((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\s*\],?/gm;
for (const m of text.matchAll(re)) {
  entries.push({ q: m[1], r: m[2] });
}

console.log("========================================");
console.log("🔍 GLOBAL DUPLICATE AUDIT (all entries)");
console.log("========================================");
console.log(`📦 Total entries: ${entries.length}`);
console.log("----------------------------------------");

const seen = new Map();
const dupes = [];
entries.forEach((e, i) => {
  const key = normalize(e.q);
  if (seen.has(key)) {
    dupes.push({ a: seen.get(key) + 1, b: i + 1, q: e.q });
  } else {
    seen.set(key, i);
  }
});

console.log(`⚠️ Global exact duplicates: ${dupes.length}`);
console.log("----------------------------------------");
for (const d of dupes) {
  console.log(`Lines (entry#) ${d.a} ↔ ${d.b}`);
  console.log(`Q: ${d.q}`);
  console.log("");
}
console.log("========================================");
console.log("✅ AUDIT ONLY — DATASET NOT MODIFIED");
console.log("========================================");
