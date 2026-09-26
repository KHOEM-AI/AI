const fs = require("fs");

const path = "src/ai/khmer.mjs";
const text = fs.readFileSync(path, "utf8");

function normalize(s) {
  return String(s)
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const responseMap = new Map();
const entries = [];

for (const m of text.matchAll(
  /^\s*\["((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\s*\],?/gm
)) {
  const q = m[1];
  const r = m[2];

  const key = normalize(r);

  entries.push({ q, r });

  if (!responseMap.has(key)) {
    responseMap.set(key, []);
  }

  responseMap.get(key).push(q);
}

const repeated = [...responseMap.entries()]
  .filter(([, questions]) => questions.length >= 5)
  .sort((a, b) => b[1].length - a[1].length);

const responseCounts = [...responseMap.values()]
  .map(v => v.length)
  .sort((a, b) => b - a);

console.log("========================================");
console.log("🔍 QUALITY AUDIT — RESPONSE REPETITION");
console.log("========================================");

console.log(`📦 String-response entries: ${entries.length}`);
console.log(`💬 Unique responses: ${responseMap.size}`);
console.log(`📊 Most repeated response: ${responseCounts[0] || 0}x`);
console.log(`🔁 Responses repeated ≥5x: ${repeated.length}`);

console.log("----------------------------------------");

if (repeated.length === 0) {
  console.log("✅ No heavily repeated responses found.");
} else {
  console.log("\n⚠️ Frequently repeated responses:\n");

  for (const [response, questions] of repeated.slice(0, 30)) {
    console.log(`🔁 ${questions.length}x`);
    console.log(`💬 ${response}`);
    console.log(`   Example: ${questions[0]}`);
    console.log("");
  }
}

console.log("========================================");
