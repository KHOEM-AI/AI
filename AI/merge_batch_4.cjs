const fs = require("fs");
const path = "src/ai/khmer.mjs";

const content = fs.readFileSync(path, "utf8");

// Backup
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `${path}.bak-batch4-${stamp}`;
fs.copyFileSync(path, backup);
console.log(`💾 Backup: ${backup}`);

// Merge map — keep the strongest/useful response
const mergeMap = {
  "ប្រាកដទេ":
    "គួរពិនិត្យព័ត៌មានប្រភព ឬបរិបទបន្ថែម ប្រសិនបើត្រូវការភាពប្រាកដប្រជា។ បើបងផ្ញើព័ត៌មានបន្ថែម ខ្ញុំនឹងជួយពិនិត្យ និងបញ្ជាក់តាមព័ត៌មានដែលមាន។",

  "ខ្ញុំអស់សង្ឃឹម":
    "កុំបោះបង់ងាយៗណា។ ❤️ សាកសម្រាកបន្តិច ហើយបំបែកបញ្ហាជាជំហានតូចៗ។ បើមានអារម្មណ៍ថាមិនអាចទ្រាំម្នាក់ឯងបាន សូមទាក់ទងមនុស្សដែលបងទុកចិត្ត ហើយប្រសិនបើមានគ្រោះថ្នាក់ភ្លាមៗ សូមស្វែងរកជំនួយបន្ទាន់នៅកន្លែងដែលបងនៅ។",

  "ចង់សរសេរ CV":
    "បាន។ សូមផ្តល់ព័ត៌មានអំពីការសិក្សា បទពិសោធន៍ ជំនាញ និងគោលដៅការងារ។ ខ្ញុំអាចជួយរៀបចំជា CV ឱ្យមានរបៀបរៀបរយ។",

  "ខ្ញុំឈឺក្បាល":
    "សូមថែខ្លួន។ 🙂 សាកសម្រាក ផឹកទឹកឱ្យបានគ្រប់គ្រាន់ និងជៀសវាងពន្លឺខ្លាំង ឬការងារដែលធ្វើឱ្យហត់។ បើឈឺខ្លាំង ឬមិនធូរ គួរពិគ្រោះអ្នកជំនាញសុខភាព។",

  "ខ្ញុំតានតឹង":
    "សូមថែខ្លួន។ ❤️ សាកសម្រាកបន្តិច ដកដង្ហើមយឺតៗ ផឹកទឹក និងបំបែកការងារជាផ្នែកតូចៗ។ បើចង់ជជែក អាចប្រាប់ខ្ញុំបាន។",

  "ខ្ញុំសោកសៅ":
    "សូមថែខ្លួន និងទុកពេលឱ្យអារម្មណ៍របស់បង។ ❤️ កុំទុកអារម្មណ៍ទាំងនេះនៅម្នាក់ឯង បើចង់និយាយ ខ្ញុំនៅទីនេះស្តាប់បង។",

  "ខ្ញុំខឹង":
    "ខ្ញុំយល់។ សាកឈប់សិន សម្រាក និងដកដង្ហើមជ្រៅៗ ឬយឺតៗ។ ពេលអារម្មណ៍ស្ងប់ អាចគិត និងឆ្លើយតបបានច្បាស់ជាងមុន។",

  "ខ្ញុំបារម្ភ":
    "ខ្ញុំយល់ថាការបារម្ភអាចធ្វើឱ្យពិបាកចិត្ត។ សាកបំបែកបញ្ហាជាផ្នែកតូចៗ ហើយផ្តោតលើអ្វីដែលអាចធ្វើបានឥឡូវនេះ។ បើចង់ប្រាប់លម្អិត ខ្ញុំអាចស្តាប់បាន។",

  "ខ្ញុំឯកា":
    "សូមថែខ្លួន។ ❤️ បើអាច សាកទាក់ទងមនុស្សដែលបងទុកចិត្ត ឬចូលរួមសកម្មភាពដែលបងចូលចិត្ត។ ហើយបើចង់ជជែក ខ្ញុំនៅទីនេះស្តាប់បង។"
};

const lines = content.split("\n");
const seen = new Map();
const output = [];
const removed = new Set();
let updated = 0;

function normalize(s) {
  return s.trim().toLowerCase();
}

// Find all first-field entries
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^\s*\["([^"]*)",\s*"([^"]*)"\],?\s*$/);
  if (!m) {
    output.push(lines[i]);
    continue;
  }

  const key = m[1];
  const norm = normalize(key);

  if (!mergeMap[norm] && !mergeMap[key]) {
    output.push(lines[i]);
    continue;
  }

  const mergeKey = mergeMap[norm] ? norm : key;

  if (!seen.has(mergeKey)) {
    const response = mergeMap[mergeKey];

    const escaped = response
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\r?\n/g, "\\n");

    output.push(`["${key}", "${escaped}"],`);
    seen.set(mergeKey, true);
    updated++;
  } else {
    removed.add(i);
  }
}

fs.writeFileSync(path, output.join("\n"), "utf8");

console.log(`✅ Updated entries: ${updated}`);
console.log(`🗑️ Removed duplicate lines: ${removed.size}`);
console.log(`🔑 Merge keys: ${Object.keys(mergeMap).length}`);
console.log(`💾 Backup: ${backup}`);
