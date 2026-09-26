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
  "ការគ្រប់គ្រងពេលវេលា",
  "ការរៀបចំកាលវិភាគ",
  "ការកំណត់អាទិភាព",
  "ការរៀបចំបញ្ជីការងារ",
  "ការធ្វើផែនការ",
  "ការកំណត់គោលដៅ",
  "ការបង្កើតទម្លាប់ល្អ",
  "ការរក្សាវិន័យ",
  "ការបង្កើនផលិតភាព",
  "ការជៀសវាងការពន្យារពេល",

  "ការរៀនដោយខ្លួនឯង",
  "ការចងចាំមេរៀន",
  "ការកត់ត្រា",
  "ការអានសៀវភៅ",
  "ការសរសេរ",
  "ការស្តាប់",
  "ការនិយាយ",
  "ការអនុវត្ត",
  "ការរៀនតាមវីដេអូ",
  "ការរៀនតាមអ៊ីនធឺណិត",

  "ការសរសេរអ៊ីមែល",
  "ការសរសេរសារ",
  "ការនិយាយជាសាធារណៈ",
  "ការសម្ភាសន៍",
  "ការធ្វើបទបង្ហាញ",
  "ការធ្វើការជាក្រុម",
  "ការដោះស្រាយបញ្ហា",
  "ការសម្រេចចិត្ត",
  "ការចរចា",
  "ការស្តាប់អ្នកដទៃ",

  "ការសម្អាតផ្ទះ",
  "ការរៀបចំបន្ទប់",
  "ការបោកខោអាវ",
  "ការលាងចាន",
  "ការរៀបចំផ្ទះបាយ",
  "ការថែរក្សាផ្ទះ",
  "ការថែរក្សាសួន",
  "ការរៀបចំតុធ្វើការ",
  "ការរក្សាផ្ទះឲ្យមានរបៀប",
  "ការរៀបចំរបស់របរ",

  "ការទិញទំនិញ",
  "ការប្រៀបធៀបតម្លៃ",
  "ការរក្សាវិក័យប័ត្រ",
  "ការធ្វើបញ្ជីទិញ",
  "ការគ្រប់គ្រងការចំណាយ",
  "ការសន្សំប្រាក់",
  "ការរៀបចំថវិកា",
  "ការទូទាត់តាមអ៊ីនធឺណិត",
  "ការប្រើកាតធនាគារ",
  "ការរក្សាទុកឯកសារ"
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
  s => `តើមានកំហុសអ្វីខ្លះដែលគួរជៀសវាងពេល${s}?`,
  s => `តើខ្ញុំគួររៀបចំ${s}ដូចម្តេច?`,
  s => `ខ្ញុំមានសំណួរអំពី${s}`,
  s => `តើមានគន្លឹះសម្រាប់អ្នកចាប់ផ្តើម${s}ទេ?`,
  s => `តើអាចណែនាំខ្ញុំអំពី${s}បានទេ?`
];

const responses = [
  s => `បាន។ ខ្ញុំអាចពន្យល់អំពី${s}ជាជំហានៗ។`,
  s => `សម្រាប់${s} គួរចាប់ផ្តើមពីមូលដ្ឋាន ហើយអនុវត្តបន្តិចម្តងៗ។`,
  s => `បាន។ ការរៀនពី${s}ដោយអនុវត្តជាក់ស្តែងអាចជួយឲ្យយល់បានល្អ។`,
  s => `វិធីសាមញ្ញគឺរៀបចំផែនការ ហើយអនុវត្តម្តងមួយជំហាន។`,
  s => `ចំណុចសំខាន់គឺត្រូវរៀបចំឲ្យមានរបៀប និងពិនិត្យលទ្ធផលជាប្រចាំ។`,
  s => `គួរចាប់ផ្តើមពីចំណុចសំខាន់ៗ មុននឹងបន្តទៅព័ត៌មានលម្អិត។`,
  s => `អាចចាប់ផ្តើមពីជំហានតូចៗ ហើយបង្កើនបន្តិចម្តងៗ។`,
  s => `បាន។ ខ្ញុំនឹងពន្យល់តាមរបៀបសាមញ្ញ និងងាយយល់។`,
  s => `ឧទាហរណ៍ជាក់ស្តែងអាចជួយឲ្យយល់ពី${s}បានកាន់តែងាយ។`,
  s => `គួរជៀសវាងការធ្វើដោយប្រញាប់ និងគួរតែពិនិត្យជំហានសំខាន់ៗជាមុន។`,
  s => `ការរៀបចំល្អអាចធ្វើឲ្យ${s}ងាយស្រួល និងមានប្រសិទ្ធភាពជាងមុន។`,
  s => `បាន។ ប្រាប់ខ្ញុំបន្ថែម ប្រសិនបើអ្នកចង់បានព័ត៌មានជាក់លាក់អំពី${s}។`,
  s => `អ្នកចាប់ផ្តើមអាចរៀនពីមូលដ្ឋាន ហើយបន្តទៅកម្រិតខ្ពស់តាមលំដាប់។`,
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

const backup = `${path}.bak-add500-batch13-${stamp}`;

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
