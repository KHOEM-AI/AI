const fs = require("fs");
const path = "src/ai/khmer.mjs";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(path, `${path}.bak-dedupe-${stamp}`);
console.log(`Backup: ${path}.bak-dedupe-${stamp}`);

const text = fs.readFileSync(path, "utf8");
const lines = text.split(/\r?\n/);

const re = /^\s*\["((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\s*\],?/;

function normalize(s) {
  return String(s)
    .normalize("NFC")
    .toLowerCase()
    .replace(/[|]+/g, " ")
    .replace(/[។?!៖,:;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const seen = new Set();
let removed = 0;
const out = [];

for (const line of lines) {
  const m = line.match(re);
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

fs.writeFileSync(path, out.join("\n"), "utf8");
console.log(`Removed duplicate entries: ${removed}`);
