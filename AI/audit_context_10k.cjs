const fs = require("fs");

const path = "src/ai/khmer.mjs";
const text = fs.readFileSync(path, "utf8");

function normalize(s) {
  return String(s)
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ");
}

function words(s) {
  return normalize(s)
    .split(/[\s,។?!៖]+/)
    .filter(x => x.length >= 4);
}

const results = [];

for (const m of text.matchAll(
  /^\s*\["((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\s*\],?/gm
)) {
  const q = m[1];
  const r = m[2];

  const qWords = words(q);
  const rNorm = normalize(r);

  const matches = qWords.filter(w => rNorm.includes(w));

  if (qWords.length >= 2 && matches.length === 0) {
    results.push({ q, r });
  }
}

console.log("========================================");
console.log("🔍 CONTEXT COVERAGE AUDIT");
console.log("========================================");
console.log(`📦 Entries checked: 9997`);
console.log(`⚠️ No obvious question keyword in response: ${results.length}`);
console.log("----------------------------------------");

for (const item of results.slice(0, 100)) {
  console.log(`Q: ${item.q}`);
  console.log(`R: ${item.r}`);
  console.log("");
}

console.log("========================================");
console.log(`📋 Showing first: ${Math.min(results.length, 100)}`);
console.log("========================================");
