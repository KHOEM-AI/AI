const fs = require("fs");

const path = "src/ai/khmer.mjs";
const text = fs.readFileSync(path, "utf8");

const stringEntries = [];
const functionEntries = [];
const emptyQuestions = [];
const emptyResponses = [];

// Normal string -> string entries
for (const m of text.matchAll(
  /^\s*\["((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\s*\],?/gm
)) {
  const q = m[1];
  const r = m[2];

  stringEntries.push({ q, r });

  if (!q.trim()) emptyQuestions.push(q);
  if (!r.trim()) emptyResponses.push(q);
}

// Valid function-response entries
for (const m of text.matchAll(
  /^\s*\["((?:\\.|[^"\\])*)"\s*,\s*\(\)\s*=>/gm
)) {
  functionEntries.push(m[1]);

  if (!m[1].trim()) {
    emptyQuestions.push(m[1]);
  }
}

// IDs
const ids = [...text.matchAll(/id="([^"]+)"/g)].map(m => m[1]);

const idMap = new Map();

for (const id of ids) {
  if (!idMap.has(id)) idMap.set(id, []);
  idMap.get(id).push(id);
}

const duplicateIds = [...idMap.entries()]
  .filter(([, values]) => values.length > 1);

const arrayLines = (text.match(/^\s*\[/gm) || []).length;

console.log("========================================");
console.log("🔍 STRUCTURE AUDIT — 10,000 DATASET");
console.log("========================================");

console.log(`📦 Array entries detected: ${arrayLines}`);
console.log(`📝 String-response entries: ${stringEntries.length}`);
console.log(`⚙️ Function-response entries: ${functionEntries.length}`);
console.log(`🆔 IDs detected: ${ids.length}`);

console.log("----------------------------------------");
console.log(`⚠️ Empty questions: ${emptyQuestions.length}`);
console.log(`⚠️ Empty responses: ${emptyResponses.length}`);
console.log(`🔁 Duplicate IDs: ${duplicateIds.length}`);
console.log("----------------------------------------");

if (functionEntries.length > 0) {
  console.log("\n⚙️ Function-response entries:");
  for (const q of functionEntries) {
    console.log(`   • ${q}`);
  }
}

if (duplicateIds.length > 0) {
  console.log("\n⚠️ Duplicate IDs:");
  for (const [id, values] of duplicateIds) {
    console.log(`   • ${id} (${values.length}x)`);
  }
}

if (emptyQuestions.length > 0) {
  console.log("\n⚠️ Empty questions:");
  for (const q of emptyQuestions) {
    console.log(`   • "${q}"`);
  }
}

if (emptyResponses.length > 0) {
  console.log("\n⚠️ Empty responses:");
  for (const q of emptyResponses) {
    console.log(`   • "${q}"`);
  }
}

console.log("\n========================================");

if (
  emptyQuestions.length === 0 &&
  emptyResponses.length === 0 &&
  duplicateIds.length === 0
) {
  console.log("✅ No empty fields or duplicate IDs found.");
}

if (functionEntries.length === 3) {
  console.log("✅ 3 function-response entries recognized as valid.");
}

console.log("========================================");
