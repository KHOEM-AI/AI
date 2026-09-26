const fs = require("fs");

const path = "src/ai/khmer.mjs";

function normalize(s) {
  return String(s)
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function escapeJs(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}

const subjects = [
  "អាកាសធាតុ",
  "ភ្លៀង",
  "ថ្ងៃក្តៅ",
  "ខ្យល់",
  "ពពក",
  "ព្យុះ",
  "ទឹកជំនន់",
  "ធូលី",
  "កម្ដៅ",
  "សីតុណ្ហភាព",

  "ផ្ទះ",
  "បន្ទប់",
  "ផ្ទះបាយ",
  "បន្ទប់គេង",
  "បន្ទប់ទឹក",
  "ទ្វារ",
  "បង្អួច",
  "ភ្លើងក្នុងផ្ទះ",
  "ទឹកក្នុងផ្ទះ",
  "សម្អាតផ្ទះ",

  "ទូរស័ព្ទ",
  "ថ្មទូរស័ព្ទ",
  "អេក្រង់",
  "កាមេរ៉ា",
  "កាស",
  "សំឡេង",
  "មីក្រូហ្វូន",
  "WiFi",
  "Bluetooth",
  "អ៊ីនធឺណិត",

  "កុំព្យូទ័រ",
  "ក្តារចុច",
  "Mouse",
  "អេក្រង់កុំព្យូទ័រ",
  "Printer",
  "File",
  "Folder",
  "PDF",
  "កម្មវិធី",
  "ការអាប់ដេត",

  "ការធ្វើដំណើរ",
  "ឡាន",
  "ម៉ូតូ",
  "កង់",
  "ផ្លូវ",
  "ស្ពាន",
  "ស្ថានីយ៍",
  "ព្រលានយន្តហោះ",
  "សណ្ឋាគារ",
  "វ៉ាលី",

  "ផ្សារ",
  "ហាង",
  "តម្លៃ",
  "ការបញ្ចុះតម្លៃ",
  "ការទិញទំនិញ",
  "ការបញ្ជាទិញ",
  "ការដឹកជញ្ជូន",
  "វិក្កយបត្រ",
  "ការបង់ប្រាក់",
  "ប្រាក់អាប់",

  "គ្រួសារ",
  "មិត្តភក្តិ",
  "អ្នកជិតខាង",
  "ការសន្ទនា",
  "ការសុំជំនួយ",
  "ការអរគុណ",
  "ការសុំទោស",
  "ការអញ្ជើញ",
  "ថ្ងៃខួប",
  "អំណោយ"
];

const templates = [
  s => `តើអាចប្រាប់ខ្ញុំអំពី${s}បានទេ?`,
  s => `ខ្ញុំចង់ដឹងបន្ថែមអំពី${s}`,
  s => `តើ${s}មានន័យដូចម្តេច?`,
  s => `តើអ្វីដែលខ្ញុំគួរដឹងអំពី${s}?`,
  s => `អាចជួយពន្យល់អំពី${s}ឲ្យខ្ញុំបានទេ?`,
  s => `បើខ្ញុំមានបញ្ហាជាមួយ${s}តើគួរធ្វើដូចម្តេច?`,
  s => `តើមានវិធីងាយស្រួលក្នុងការដោះស្រាយ${s}ទេ?`,
  s => `ខ្ញុំមិនសូវយល់អំពី${s}ទេ`,
  s => `តើមានចំណុចសំខាន់អ្វីខ្លះទាក់ទងនឹង${s}?`,
  s => `ជួយណែនាំខ្ញុំអំពី${s}ផង`
];

const responses = [
  s => `បាន។ ខ្ញុំអាចជួយពន្យល់អំពី${s} និងផ្តល់ព័ត៌មានតាមបរិបទដែលអ្នកត្រូវការ។`,
  s => `បាន។ សម្រាប់${s} ខ្ញុំនឹងពន្យល់ជាជំហានៗឲ្យងាយយល់។`,
  s => `ខ្ញុំអាចជួយបាន។ ប្រាប់ខ្ញុំបន្ថែមថា អ្នកចង់ដឹងផ្នែកណារបស់${s}។`,
  s => `ច្បាស់ហើយ។ ខ្ញុំនឹងពន្យល់អំពី${s} តាមរបៀបសាមញ្ញ។`,
  s => `បាន។ ចំពោះ${s} គួរពិនិត្យព័ត៌មានសំខាន់ៗ និងបរិបទជាមុន។`,
  s => `ខ្ញុំអាចជួយរកវិធីដោះស្រាយដែលសមស្របសម្រាប់${s}។`,
  s => `បាន។ យើងអាចពិនិត្យ${s} ម្តងមួយជំហាន ដើម្បីងាយស្រួលយល់។`,
  s => `កុំបារម្ភ។ ខ្ញុំអាចពន្យល់${s} ពីមូលដ្ឋានទៅចំណុចលម្អិត។`,
  s => `សម្រាប់${s} ព័ត៌មានត្រឹមត្រូវអាស្រ័យលើស្ថានភាពជាក់ស្តែងរបស់អ្នក។`,
  s => `បាន។ សូមប្រាប់ខ្ញុំថា តើអ្នកកំពុងជួបបញ្ហាអ្វីជាមួយ${s}។`
];

const text = fs.readFileSync(path, "utf8");

const existing = new Set();
for (const m of text.matchAll(/^\s*\["((?:\\.|[^"\\])*)"/gm)) {
  existing.add(normalize(m[1]));
}

const candidates = [];

for (let i = 0; i < subjects.length; i++) {
  const subject = subjects[i];

  for (let j = 0; j < templates.length; j++) {
    const q = templates[j](subject);
    const r = responses[(i + j) % responses.length](subject);

    candidates.push([q, r]);
  }
}

const seen = new Set();
const selected = [];

for (const [q, r] of candidates) {
  const key = normalize(q);

  if (!key) continue;
  if (existing.has(key)) continue;
  if (seen.has(key)) continue;

  seen.add(key);
  selected.push([q, r]);
}

console.log(`📦 Existing entries: ${existing.size}`);
console.log(`🧩 Generated candidates: ${candidates.length}`);
console.log(`➕ Unique new entries: ${selected.length}`);

if (selected.length < 500) {
  throw new Error(
    `❌ Not enough unique entries: ${selected.length}. Need at least 500.`
  );
}

const finalEntries = selected.slice(0, 500);

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backup = `${path}.bak-add500-batch7-${stamp}`;

fs.copyFileSync(path, backup);
console.log(`💾 Backup: ${backup}`);

const block = finalEntries
  .map(([q, r]) => `  ["${escapeJs(q)}", "${escapeJs(r)}"],`)
  .join("\n");

const pos = text.lastIndexOf("];");

if (pos === -1) {
  throw new Error("❌ Could not find final ];");
}

const updated =
  text.slice(0, pos) +
  block +
  "\n" +
  text.slice(pos);

fs.writeFileSync(path, updated, "utf8");

console.log(`✅ Added: ${finalEntries.length}`);
console.log(`📁 Updated: ${path}`);
