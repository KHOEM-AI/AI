const fs = require("fs");

const file = "src/ai/khmer.mjs";
const content = fs.readFileSync(file, "utf8");
const lines = content.split(/\r?\n/);

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `${file}.bak-batch3-${stamp}`;

fs.copyFileSync(file, backup);

const mergeMap = {
  "ចង់សរសេរ cv":
    "បាន។ ខ្ញុំអាចជួយរៀបចំ CV ឱ្យមានរបៀបរៀបរយ និងសមនឹងការងារដែលបងចង់ដាក់ពាក្យ។",

  "ខ្ញុំនឹកគ្រួសារ":
    "បើបងនឹកគ្រួសារ អាចសាកទាក់ទង ឬនិយាយជាមួយពួកគេបន្តិច។ ❤️ ការរក្សាទំនាក់ទំនងជាមួយគ្រួសារអាចជួយឱ្យមានអារម្មណ៍ល្អឡើង។",

  "មានបញ្ចុះតម្លៃអត់":
    "បាន។ សូមប្រាប់ខ្ញុំថា បងចង់សួរអំពីផលិតផល ឬសេវាកម្មអ្វី ដើម្បីពិនិត្យថាមានការបញ្ចុះតម្លៃឬអត់។",

  "ថ្ងៃនេះយ៉ាងម៉េច":
    "ថ្ងៃនេះខ្ញុំនៅទីនេះ និងត្រៀមជួយបង។ 🙂 បងវិញថ្ងៃនេះយ៉ាងម៉េចដែរ? មានអ្វីចង់និយាយ ឬចង់ឱ្យខ្ញុំជួយទេ?",

  "ថ្ងៃនេះម៉េចដែរ":
    "ថ្ងៃនេះខ្ញុំនៅទីនេះ និងត្រៀមជួយបង។ 🙂 បងវិញថ្ងៃនេះយ៉ាងម៉េចដែរ? មានអ្វីចង់និយាយ ឬចង់ឱ្យខ្ញុំជួយទេ?"
};

const output = [];
const seen = new Set();

let changed = 0;
let removed = 0;

for (const line of lines) {
  const m = line.match(/^(\s*)\["([^"]+)"\s*,\s*"([^"]*)"(.*)$/);

  if (!m) {
    output.push(line);
    continue;
  }

  const indent = m[1];
  const key = m[2].trim();
  const normalized = key.toLowerCase();

  if (!Object.prototype.hasOwnProperty.call(mergeMap, key)) {
    output.push(line);
    continue;
  }

  if (seen.has(normalized)) {
    removed++;
    continue;
  }

  const response = mergeMap[key];

  output.push(
    `${indent}["${key}", "${response}"${m[4]}`
  );

  seen.add(normalized);
  changed++;
}

fs.writeFileSync(file, output.join("\n"));

console.log(`📦 Backup: ${backup}`);
console.log(`✏️ Updated entries: ${changed}`);
console.log(`🗑️ Removed duplicate lines: ${removed}`);
console.log(`📦 Backup kept: ${backup}`);
