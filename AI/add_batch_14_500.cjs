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
  "ការថែរក្សាសុខភាព",
  "ការថែរក្សាអនាម័យ",
  "ការលាងដៃ",
  "ការដុសធ្មេញ",
  "ការងូតទឹក",
  "ការសម្អាតខ្លួន",
  "ការសម្អាតបន្ទប់",
  "ការសម្អាតផ្ទះ",
  "ការផឹកទឹកគ្រប់គ្រាន់",
  "ការគេងឲ្យគ្រប់",

  "អាហារដែលមានសុខភាពល្អ",
  "បន្លែស្រស់",
  "ផ្លែឈើស្រស់",
  "អាហារមានជាតិស្ករ",
  "អាហារមានជាតិប្រៃ",
  "អាហារមានខ្លាញ់",
  "ការញ៉ាំអាហារពេលព្រឹក",
  "ការរៀបចំអាហារ",
  "ការរក្សាអាហារ",
  "សុវត្ថិភាពអាហារ",

  "ការហាត់ប្រាណ",
  "ការដើរ",
  "ការរត់",
  "ការលាតសន្ធឹងសាច់ដុំ",
  "ការសម្រាក",
  "ការគ្រប់គ្រងភាពតានតឹង",
  "ការរក្សាអារម្មណ៍ល្អ",
  "ការរស់នៅមានសុខភាពល្អ",
  "ការរក្សាទម្ងន់",
  "ទម្លាប់ប្រចាំថ្ងៃ",

  "សុវត្ថិភាពនៅផ្ទះ",
  "សុវត្ថិភាពនៅផ្លូវ",
  "សុវត្ថិភាពពេលធ្វើដំណើរ",
  "ការប្រើភ្លើងអគ្គិសនីដោយសុវត្ថិភាព",
  "ការប្រើឧបករណ៍ផ្ទះបាយ",
  "ការរក្សារបស់មានគ្រោះថ្នាក់",
  "ការការពារកុមារ",
  "ការប្រុងប្រយ័ត្នពេលភ្លៀង",
  "ការប្រុងប្រយ័ត្នពេលមានខ្យល់ខ្លាំង",
  "ការរៀបចំសម្រាប់គ្រាអាសន្ន",

  "ការកាត់បន្ថយសំរាម",
  "ការបែងចែកសំរាម",
  "ការកែច្នៃសំរាម",
  "ការប្រើរបស់ឡើងវិញ",
  "ការសន្សំទឹក",
  "ការសន្សំអគ្គិសនី",
  "ការដាំដើមឈើ",
  "ការថែរក្សាបរិស្ថាន",
  "ការកាត់បន្ថយប្លាស្ទិក",
  "ការរក្សាទីក្រុងឲ្យស្អាត"
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
  s => `សម្រាប់${s} គួរចាប់ផ្តើមពីទម្លាប់សាមញ្ញ ហើយអនុវត្តជាប្រចាំ។`,
  s => `បាន។ ការយល់ដឹងអំពី${s}អាចជួយឲ្យរៀបចំជីវិតប្រចាំថ្ងៃបានល្អជាងមុន។`,
  s => `វិធីសាមញ្ញគឺកំណត់ផែនការ ហើយអនុវត្តម្តងមួយជំហាន។`,
  s => `ចំណុចសំខាន់គឺធ្វើឲ្យបានទៀងទាត់ និងពិនិត្យលទ្ធផលជាប្រចាំ។`,
  s => `គួរចាប់ផ្តើមពីចំណុចសំខាន់ៗ មុននឹងបន្តទៅព័ត៌មានលម្អិត។`,
  s => `អាចចាប់ផ្តើមពីជំហានតូចៗ ហើយបង្កើនបន្តិចម្តងៗ។`,
  s => `បាន។ ខ្ញុំនឹងពន្យល់តាមរបៀបសាមញ្ញ និងអនុវត្តបានងាយ។`,
  s => `ឧទាហរណ៍ជាក់ស្តែងអាចជួយឲ្យយល់ពី${s}បានកាន់តែងាយ។`,
  s => `គួរប្រុងប្រយ័ត្នចំពោះស្ថានភាពជាក់ស្តែង និងពិនិត្យសុវត្ថិភាពជាមុន។`,
  s => `ការរៀបចំល្អអាចធ្វើឲ្យ${s}ងាយស្រួល និងមានប្រសិទ្ធភាពជាងមុន។`,
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

const backup = `${path}.bak-add500-batch14-${stamp}`;

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
