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
  "ការគេង",
  "ការភ្ញាក់ពីដំណេក",
  "ការសម្រាក",
  "ការងងុយគេង",
  "ការគេងមិនលក់",
  "ពេលព្រឹក",
  "ពេលថ្ងៃ",
  "ពេលល្ងាច",
  "ពេលយប់",
  "ទម្លាប់ប្រចាំថ្ងៃ",

  "ការហាត់ប្រាណ",
  "ការដើរ",
  "ការរត់",
  "ការជិះកង់",
  "ការលាតសន្ធឹង",
  "ការឡើងជណ្តើរ",
  "ការសម្រាកក្រោយហាត់ប្រាណ",
  "ការផឹកទឹក",
  "អាហារពេលព្រឹក",
  "អាហារពេលល្ងាច",

  "អារម្មណ៍",
  "ភាពសប្បាយ",
  "ភាពសោកសៅ",
  "ភាពធុញទ្រាន់",
  "ភាពតានតឹង",
  "ការព្រួយបារម្ភ",
  "ការខឹង",
  "ការភ័យខ្លាច",
  "ការខកចិត្ត",
  "ការលើកទឹកចិត្ត",

  "ការផ្តោតអារម្មណ៍",
  "ការចងចាំ",
  "ការរៀន",
  "ការអាន",
  "ការសរសេរ",
  "ការគិត",
  "ការរៀបចំគំនិត",
  "ការធ្វើផែនការ",
  "ការកំណត់គោលដៅ",
  "ការគ្រប់គ្រងពេលវេលា",

  "ចំណង់ចំណូលចិត្ត",
  "តន្ត្រី",
  "ភាពយន្ត",
  "សៀវភៅ",
  "ហ្គេម",
  "ការថតរូប",
  "ការគូររូប",
  "ការធ្វើម្ហូប",
  "ការធ្វើដំណើរ",
  "ការដើរលេង",

  "ទំនាក់ទំនង",
  "ការនិយាយ",
  "ការស្តាប់",
  "ការសួរសុខទុក្ខ",
  "ការជជែក",
  "ការជួយគ្នា",
  "ការគោរព",
  "ការអត់ធ្មត់",
  "ការសហការ",
  "ការដោះស្រាយបញ្ហា"
];

const templates = [
  s => `តើធ្វើដូចម្តេចដើម្បីធ្វើឲ្យ${s}បានល្អ?`,
  s => `ខ្ញុំចង់កែលម្អ${s} តើគួរចាប់ផ្តើមពីណា?`,
  s => `តើមានវិធីងាយៗសម្រាប់${s}ទេ?`,
  s => `តើអ្វីខ្លះដែលគួរប្រុងប្រយ័ត្នពេល${s}?`,
  s => `ខ្ញុំមានបញ្ហាទាក់ទងនឹង${s} តើគួរធ្វើដូចម្តេច?`,
  s => `តើអាចផ្តល់ដំបូន្មានអំពី${s}បានទេ?`,
  s => `តើមានទម្លាប់ណាដែលជួយដល់${s}ទេ?`,
  s => `តើខ្ញុំគួររៀបចំពេលវេលាសម្រាប់${s}យ៉ាងដូចម្តេច?`,
  s => `ខ្ញុំចង់រៀនបន្ថែមអំពី${s}`,
  s => `តើមានចំណុចសំខាន់អ្វីខ្លះអំពី${s}?`,
  s => `ជួយណែនាំខ្ញុំអំពី${s}ផង`,
  s => `តើអ្នកអាចពន្យល់អំពី${s}ឲ្យខ្ញុំងាយយល់បានទេ?`
];

const responses = [
  s => `បាន។ សម្រាប់${s} គួរចាប់ផ្តើមពីជំហានតូចៗ និងធ្វើឲ្យបានជាប្រចាំ។`,
  s => `បាន។ អ្នកអាចរៀបចំទម្លាប់សាមញ្ញមួយ ហើយកែប្រែបន្តិចម្តងៗ។`,
  s => `ច្បាស់ហើយ។ ខ្ញុំអាចជួយរៀបចំវិធីអនុវត្ត${s}ឲ្យងាយស្រួល។`,
  s => `សម្រាប់${s} គួរពិចារណាពីស្ថានភាព និងតម្រូវការរបស់អ្នកជាមុន។`,
  s => `បាន។ យើងអាចបំបែក${s}ជាជំហានតូចៗ ដើម្បីងាយអនុវត្ត។`,
  s => `ខ្ញុំអាចជួយពន្យល់ និងផ្តល់គំនិតទូទៅអំពី${s}បាន។`,
  s => `ការធ្វើជាប្រចាំ និងការរក្សាតុល្យភាព អាចជួយឲ្យ${s}កាន់តែងាយស្រួល។`,
  s => `សាកកំណត់ពេលវេលាជាក់លាក់សម្រាប់${s} ហើយតាមដានការរីកចម្រើនរបស់អ្នក។`,
  s => `បាន។ ប្រសិនបើអ្នកប្រាប់ខ្ញុំពីគោលដៅរបស់អ្នក ខ្ញុំអាចជួយរៀបចំផែនការបាន។`,
  s => `ចំណុចសំខាន់គឺធ្វើឲ្យវិធីសាស្ត្រសមស្របនឹងជីវិតប្រចាំថ្ងៃរបស់អ្នក។`,
  s => `បាន។ ខ្ញុំនឹងជួយពន្យល់${s}តាមរបៀបសាមញ្ញ និងអនុវត្តបាន។`,
  s => `អាចបាន។ ប្រាប់ខ្ញុំបន្ថែមអំពីស្ថានភាពរបស់អ្នក ដើម្បីឲ្យខ្ញុំជួយបានត្រឹមត្រូវជាងនេះ។`
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

const backup = `${path}.bak-add500-batch8-${stamp}`;

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
