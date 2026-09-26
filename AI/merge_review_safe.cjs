const fs = require("fs");

const file = "src/ai/khmer.mjs";
const backup =
  `${file}.bak-review-merge-${new Date().toISOString().replace(/[:.]/g, "-")}`;

fs.copyFileSync(file, backup);

const rules = {
  "អាចជួយខ្ញុំបានទេ": "បាន។ ប្រាប់ខ្ញុំថាត្រូវការជំនួយអ្វី។",
  "បានហើយ": "ល្អណាស់។ 🙂 បើមានអ្វីបន្ថែម អាចប្រាប់ខ្ញុំបាន។",
  "អញ្ចឹងហើយ": "បាន។ យល់ហើយ។ 🙂",
  "តោះទៅ": "បាន! 🚀 តោះចាប់ផ្តើម។"
};

const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);

const seen = new Set();
const output = [];
let removed = 0;

for (const line of lines) {
  const m = line.match(/^(\s*)\["([^"]+)"\s*,\s*"([^"]*)"\](.*)$/);

  if (!m) {
    output.push(line);
    continue;
  }

  const aliases = m[2]
    .split("|")
    .map(x => x.trim())
    .filter(Boolean);

  const key = aliases[0];

  if (!rules[key]) {
    output.push(line);
    continue;
  }

  if (seen.has(key)) {
    removed++;
    continue;
  }

  seen.add(key);

  output.push(
    `${m[1]}["${aliases.join("|")}", "${rules[key]}"]${m[4]}`
  );
}

fs.writeFileSync(file, output.join("\n"));

console.log("✅ Review-safe merge completed");
console.log(`Removed duplicate lines: ${removed}`);
console.log(`Backup: ${backup}`);
