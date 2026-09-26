const fs = require("fs");

const path = process.argv[2] || "src/ai/khmer.mjs";

function normalize(s) {
  return String(s)
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const text = fs.readFileSync(path, "utf8");
const lines = text.split("\n");

const seen = new Set();
let removed = 0;
const out = [];

const entryLineRe = /^\s*\["((?:\\.|[^"\\])*)"\s*,/;

for (const line of lines) {
  const m = line.match(entryLineRe);
  if (m) {
    const key = normalize(m[1]);
    if (seen.has(key)) {
      removed++;
      continue;
    }
    seen.add(key);
  }
  out.push(line);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `${path}.bak-dedupe-${stamp}`;
fs.copyFileSync(path, backup);
console.log(`Backup: ${backup}`);

fs.writeFileSync(path, out.join("\n"), "utf8");
console.log(`Removed duplicate lines: ${removed}`);
console.log(`Updated: ${path}`);
