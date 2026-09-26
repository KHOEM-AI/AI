const fs = require("fs");

const path = "src/ai/khmer.mjs";

function normalize(s) {
  return String(s)
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const text = fs.readFileSync(path, "utf8");

const groups = new Map();

for (const m of text.matchAll(/^\s*\["((?:\\.|[^"\\])*)"/gm)) {
  const raw = m[1];
  const key = normalize(raw);

  if (!groups.has(key)) {
    groups.set(key, []);
  }

  groups.get(key).push(raw);
}

const duplicates = [...groups.entries()]
  .filter(([, values]) => values.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

const totalEntries = [...groups.values()]
  .reduce((sum, values) => sum + values.length, 0);

const duplicateEntryCount = duplicates
  .reduce((sum, [, values]) => sum + values.length, 0);

console.log("========================================");
console.log("🔍 DUPLICATE QUESTION AUDIT");
console.log("========================================");
console.log(`📦 Parsed entries: ${totalEntries}`);
console.log(`🧠 Unique questions: ${groups.size}`);
console.log(`🔁 Duplicate groups: ${duplicates.length}`);
console.log(`📊 Entries involved in duplicates: ${duplicateEntryCount}`);
console.log("========================================");

if (duplicates.length === 0) {
  console.log("✅ No duplicate questions found.");
} else {
  console.log("\n⚠️ Duplicate groups:\n");

  for (const [key, values] of duplicates) {
    console.log(`🔁 ${values.length}x  ${values[0]}`);

    for (const value of values.slice(1)) {
      console.log(`   ↳ ${value}`);
    }

    console.log("");
  }
}
