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

const map = new Map();

for (const m of text.matchAll(
  /^\s*\["((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\s*\],?/gm
)) {
  const q = m[1];
  const r = m[2];
  const key = normalize(r);

  if (!map.has(key)) {
    map.set(key, {
      response: r,
      questions: []
    });
  }

  map.get(key).questions.push(q);
}

const repeated = [...map.values()]
  .filter(x => x.questions.length >= 20)
  .sort((a, b) => b.questions.length - a.questions.length);

const lines = [];

lines.push("========================================");
lines.push("REPEATED RESPONSE QUALITY REPORT");
lines.push("========================================");
lines.push(`Groups >=20 uses: ${repeated.length}`);
lines.push("");

for (const item of repeated) {
  lines.push("----------------------------------------");
  lines.push(`COUNT: ${item.questions.length}`);
  lines.push(`RESPONSE: ${item.response}`);
  lines.push("QUESTIONS:");

  for (const q of item.questions) {
    lines.push(`- ${q}`);
  }

  lines.push("");
}

const out = "repeated_responses_10k_report.txt";
fs.writeFileSync(out, lines.join("\n"), "utf8");

console.log(`✅ Report created: ${out}`);
console.log(`📊 Groups >=20 uses: ${repeated.length}`);
