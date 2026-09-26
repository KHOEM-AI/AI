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
function tokenize(s) {
  return normalize(s).split(/\s+/).filter(Boolean);
}
function similarity(a, b) {
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const x of A) if (B.has(x)) common++;
  return common / Math.max(A.size, B.size);
}

const entries = [];
const re = /^\s*\["((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\s*\],?/gm;
for (const m of text.matchAll(re)) entries.push(m[1]);

console.log("========================================");
console.log("🔍 GLOBAL NEAR-DUPLICATE AUDIT");
console.log("========================================");
console.log(`📦 Total entries: ${entries.length}`);
console.log("⏳ Bucketing by token count for speed...");

// Bucket by token count to avoid full O(n^2)
const buckets = new Map();
entries.forEach((q, i) => {
  const len = tokenize(q).length;
  if (!buckets.has(len)) buckets.set(len, []);
  buckets.get(len).push({ i, q });
});

const THRESHOLD = 0.85;
let found = 0;
const results = [];

for (const [len, list] of buckets) {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const sim = similarity(list[i].q, list[j].q);
      if (sim >= THRESHOLD) {
        found++;
        results.push({ a: list[i].i + 1, b: list[j].i + 1, sim, q1: list[i].q, q2: list[j].q });
      }
    }
  }
}

console.log(`⚠️ Near duplicates (>=${THRESHOLD*100}%): ${found}`);
console.log("----------------------------------------");
for (const r of results.slice(0, 100)) {
  console.log(`Entry ${r.a} ↔ ${r.b}  (${(r.sim*100).toFixed(0)}%)`);
  console.log(`  Q1: ${r.q1}`);
  console.log(`  Q2: ${r.q2}`);
}
if (results.length > 100) console.log(`... and ${results.length - 100} more`);
console.log("========================================");
console.log("✅ AUDIT ONLY — DATASET NOT MODIFIED");
console.log("========================================");
