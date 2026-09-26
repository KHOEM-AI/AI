const fs = require("fs");

const file = "src/ai/khmer.mjs";

const content = fs.readFileSync(file, "utf8");

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backup = `${file}.bak-${stamp}`;
fs.copyFileSync(file, backup);

let changedLines = 0;
let removedAliases = 0;

const output = content.split(/\r?\n/).map((line) => {
  const m = line.match(/^(\s*)\["([^"]+)"(\s*,.*)$/);

  if (!m) return line;

  const aliases = m[2].split("|");

  const seen = new Set();
  const unique = [];

  let changed = false;

  for (const alias of aliases) {
    const key = alias.trim().toLowerCase();

    if (seen.has(key)) {
      changed = true;
      removedAliases++;
      continue;
    }

    seen.add(key);
    unique.push(alias);
  }

  if (!changed) return line;

  changedLines++;

  return `${m[1]}["${unique.join("|")}"${m[3]}`;
}).join("\n");

fs.writeFileSync(file, output, "utf8");

console.log("✅ Cleanup complete");
console.log(`📄 Changed lines: ${changedLines}`);
console.log(`🗑️ Removed duplicate aliases: ${removedAliases}`);
console.log(`💾 Backup: ${backup}`);
