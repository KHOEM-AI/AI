const fs = require("fs");

const file = "src/ai/khmer.mjs";
const content = fs.readFileSync(file, "utf8");

const backup =
  `${file}.bak-safe-merge-${new Date().toISOString().replace(/[:.]/g, "-")}`;

fs.copyFileSync(file, backup);

const mergeRules = {
  "សូមពន្យល់ម្តងទៀត": "បាន។ ខ្ញុំនឹងពន្យល់ម្តងទៀតឱ្យងាយយល់។",
  "និយាយម្តងទៀត": "បាន។ ខ្ញុំនឹងនិយាយម្តងទៀតឱ្យច្បាស់។",
  "សង្ខេបឱ្យខ្ញុំ": "បាន។ ខ្ញុំនឹងសង្ខេបចំណុចសំខាន់ៗឱ្យខ្លី។",
  "ខ្ញុំចង់ចាប់ផ្តើមថ្មី": "ល្អណាស់។ 🌱 ចាប់ផ្តើមពីជំហានតូចមួយដែលអាចធ្វើបានថ្ងៃនេះ។",
  "ខ្ញុំស្រឡាញ់គ្រួសារ": "ល្អណាស់។ ❤️ ការយកចិត្តទុកដាក់ចំពោះគ្រួសារមានតម្លៃណាស់។"
};

const lines = content.split(/\r?\n/);

const seen = new Set();
let removed = 0;

const output = [];

for (const line of lines) {
  const match = line.match(
    /^(\s*)\["([^"]+)"\s*,\s*"([^"]*)"\](.*)$/
  );

  if (!match) {
    output.push(line);
    continue;
  }

  const indent = match[1];
  const aliases = match[2]
    .split("|")
    .map(x => x.trim())
    .filter(Boolean);

  const response = match[3];
  const rest = match[4];

  const key = aliases[0];

  if (!mergeRules[key]) {
    output.push(line);
    continue;
  }

  if (seen.has(key)) {
    removed++;
    continue;
  }

  seen.add(key);

  output.push(
    `${indent}["${aliases.join("|")}", "${mergeRules[key]}"]${rest}`
  );
}

fs.writeFileSync(file, output.join("\n"));

console.log("✅ Safe merge completed");
console.log(`Removed duplicate lines: ${removed}`);
console.log(`Backup: ${backup}`);
