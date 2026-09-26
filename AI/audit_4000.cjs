const fs = require("fs");

const path = "src/ai/khmer.mjs";
const text = fs.readFileSync(path, "utf8");
const lines = text.split(/\r?\n/);

const entries = [];
const keys = new Map();

for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^\s*\["([^"]*)",\s*"([^"]*)"\],?\s*$/);

  if (!m) continue;

  const key = m[1].normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
  const response = m[2].trim();

  entries.push({
    line: i + 1,
    key: m[1],
    response
  });

  if (!keys.has(key)) keys.set(key, []);
  keys.get(key).push(i + 1);
}

const duplicates = [...keys.entries()].filter(([, lines]) => lines.length > 1);

const emptyResponses = entries.filter(e => !e.response);
const emptyKeys = entries.filter(e => !e.key);

const malformed = lines.filter(line =>
  line.trim().startsWith("[\"") &&
  !/^\s*\["([^"]*)",\s*"([^"]*)"\],?\s*$/.test(line)
);

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔎 KHMER DATASET AUDIT");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`📦 Parsed entries: ${entries.length}`);
console.log(`🎯 Target:         4000`);
console.log(`🔁 Duplicate keys: ${duplicates.length}`);
console.log(`⚠️ Empty keys:     ${emptyKeys.length}`);
console.log(`⚠️ Empty responses: ${emptyResponses.length}`);
console.log(`⚠️ Malformed lines: ${malformed.length}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

if (duplicates.length) {
  console.log("\n🔁 DUPLICATES:");
  for (const [key, lines] of duplicates) {
    console.log(`- ${key} → lines ${lines.join(", ")}`);
  }
}

if (emptyResponses.length) {
  console.log("\n⚠️ EMPTY RESPONSES:");
  for (const e of emptyResponses) {
    console.log(`- line ${e.line}: ${e.key}`);
  }
}

if (emptyKeys.length) {
  console.log("\n⚠️ EMPTY KEYS:");
  for (const e of emptyKeys) {
    console.log(`- line ${e.line}`);
  }
}

console.log("\n✅ Syntax check should also be run:");
console.log("node --check src/ai/khmer.mjs");
