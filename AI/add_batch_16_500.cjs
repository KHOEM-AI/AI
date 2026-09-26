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
  "ការរៀបចំឯកសារ",
  "ការរក្សាឯកសារ",
  "ការស្កេនឯកសារ",
  "ការថតចម្លងឯកសារ",
  "ការបោះពុម្ពឯកសារ",
  "ការចុះហត្ថលេខា",
  "ការបំពេញឯកសារ",
  "ការផ្ញើឯកសារ",
  "ការទាញយកឯកសារ",
  "ការបម្រុងទុកឯកសារ",

  "ការរៀបចំកិច្ចប្រជុំ",
  "ការកត់ត្រាកិច្ចប្រជុំ",
  "ការរៀបចំរបៀបវារៈ",
  "ការរៀបចំបទបង្ហាញ",
  "ការផ្ញើរបាយការណ៍",
  "ការសរសេររបាយការណ៍",
  "ការត្រួតពិនិត្យការងារ",
  "ការចែកការងារ",
  "ការតាមដានការងារ",
  "ការបញ្ចប់ការងារទាន់ពេល",

  "ការរៀបចំគម្រោង",
  "ការកំណត់ពេលវេលាគម្រោង",
  "ការបែងចែកភារកិច្ច",
  "ការតាមដានវឌ្ឍនភាព",
  "ការគ្រប់គ្រងហានិភ័យ",
  "ការដោះស្រាយបញ្ហាការងារ",
  "ការកែលម្អដំណើរការ",
  "ការត្រួតពិនិត្យគុណភាព",
  "ការរៀបចំលទ្ធផល",
  "ការវាយតម្លៃគម្រោង",

  "ការធ្វើការពីផ្ទះ",
  "ការរៀបចំតុធ្វើការ",
  "ការធ្វើការតាមអ៊ីនធឺណិត",
  "ការប្រជុំតាមវីដេអូ",
  "ការចែករំលែកអេក្រង់",
  "ការផ្ញើឯកសារតាមអ៊ីមែល",
  "ការរៀបចំប្រអប់សារ",
  "ការឆ្លើយអ៊ីមែល",
  "ការគ្រប់គ្រងការជូនដំណឹង",
  "ការរក្សាការផ្តោតអារម្មណ៍",

  "ការរៀបចំថ្ងៃឈប់សម្រាក",
  "ការរៀបចំផែនការប្រចាំសប្តាហ៍",
  "ការរៀបចំផែនការប្រចាំខែ",
  "ការរៀបចំផែនការប្រចាំឆ្នាំ",
  "ការកំណត់កាលបរិច្ឆេទ",
  "ការកំណត់ពេលណាត់ជួប",
  "ការរំលឹកកិច្ចការ",
  "ការរៀបចំអាទិភាព",
  "ការពិនិត្យកិច្ចការប្រចាំថ្ងៃ",
  "ការបញ្ចប់កិច្ចការសំខាន់"
];

const templates = [
  s => `តើ${s}គឺជាអ្វី?`,
  s => `តើខ្ញុំអាចធ្វើ${s}បានយ៉ាងដូចម្តេច?`,
  s => `ខ្ញុំចង់រៀនអំពី${s}`,
  s => `តើមានវិធីងាយៗសម្រាប់${s}ទេ?`,
  s => `តើមានគន្លឹះអ្វីខ្លះអំពី${s}?`,
  s => `តើអ្វីជាចំណុចសំខាន់នៃ${s}?`,
  s => `តើខ្ញុំគួរចាប់ផ្តើម${s}ពីណា?`,
  s => `ជួយពន្យល់អំពី${s}ផង`,
  s => `តើអាចផ្តល់ឧទាហរណ៍អំពី${s}បានទេ?`,
  s => `តើមានអ្វីដែលគួរប្រុងប្រយ័ត្នពេល${s}?`,
  s => `តើខ្ញុំគួររៀបចំ${s}ដូចម្តេច?`,
  s => `ខ្ញុំមានសំណួរអំពី${s}`,
  s => `តើមានគន្លឹះសម្រាប់អ្នកចាប់ផ្តើម${s}ទេ?`,
  s => `តើអាចណែនាំខ្ញុំអំពី${s}បានទេ?`
];

const responses = [
  s => `បាន។ ខ្ញុំអាចពន្យល់អំពី${s}ជាជំហានៗ និងងាយយល់។`,
  s => `សម្រាប់${s} គួររៀបចំជាមុន និងកំណត់ជំហានឲ្យច្បាស់។`,
  s => `បាន។ ការរៀបចំល្អអាចធ្វើឲ្យ${s}មានប្រសិទ្ធភាពជាងមុន។`,
  s => `វិធីសាមញ្ញគឺបែងចែកការងារជាផ្នែកតូចៗ ហើយធ្វើតាមលំដាប់។`,
  s => `ចំណុចសំខាន់គឺត្រូវពិនិត្យព័ត៌មាន និងកាលកំណត់ឲ្យបានច្បាស់។`,
  s => `គួររៀបចំអាទិភាព មុននឹងចាប់ផ្តើមការងារសំខាន់ៗ។`,
  s => `អាចចាប់ផ្តើមពីជំហានតូចៗ ហើយតាមដានលទ្ធផលជាប្រចាំ។`,
  s => `បាន។ ខ្ញុំនឹងពន្យល់តាមរបៀបសាមញ្ញ និងអនុវត្តបានងាយ។`,
  s => `ឧទាហរណ៍ជាក់ស្តែងអាចជួយឲ្យយល់ពី${s}បានកាន់តែងាយ។`,
  s => `គួរត្រួតពិនិត្យកំហុស និងព័ត៌មានសំខាន់ៗមុនពេលបញ្ជូនឯកសារ។`,
  s => `ការរៀបចំជាមុនអាចជួយកាត់បន្ថយការភ្លេច និងការយឺតយ៉ាវ។`,
  s => `បាន។ ប្រាប់ខ្ញុំបន្ថែម ប្រសិនបើអ្នកចង់បានព័ត៌មានជាក់លាក់អំពី${s}។`,
  s => `អ្នកចាប់ផ្តើមអាចរៀនពីមូលដ្ឋាន ហើយបន្តតាមលំដាប់។`,
  s => `បាន។ ខ្ញុំអាចជួយរៀបចំ${s}ជាបញ្ជី ឬជំហានៗ។`
];

const text = fs.readFileSync(path, "utf8");

const existing = new Set();

for (const m of text.matchAll(/^\s*\["((?:\\.|[^"\\])*)"/gm)) {
  existing.add(normalize(m[1]));
}

const candidates = [];

for (let i = 0; i < subjects.length; i++) {
  for (let j = 0; j < templates.length; j++) {
    const q = templates[j](subjects[i]);
    const r = responses[(i + j) % responses.length](subjects[i]);
    candidates.push([q, r]);
  }
}

const seen = new Set();
const selected = [];

for (const [q, r] of candidates) {
  const key = normalize(q);

  if (!key || existing.has(key) || seen.has(key)) continue;

  seen.add(key);
  selected.push([q, r]);
}

console.log(`📦 Existing entries: ${existing.size}`);
console.log(`🧩 Generated candidates: ${candidates.length}`);
console.log(`➕ Unique new entries: ${selected.length}`);

if (selected.length < 500) {
  throw new Error(`❌ Not enough unique entries: ${selected.length}`);
}

const finalEntries = selected.slice(0, 500);

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backup = `${path}.bak-add500-batch16-${stamp}`;

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
