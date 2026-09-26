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
  "ការស្វែងរកការងារ",
  "ការដាក់ពាក្យការងារ",
  "សម្ភាសន៍ការងារ",
  "ប្រវត្តិរូបសង្ខេប",
  "លិខិតដាក់ពាក្យ",
  "ប្រាក់ខែ",
  "ម៉ោងធ្វើការ",
  "ថ្ងៃឈប់សម្រាក",
  "ការឡើងតំណែង",
  "ការផ្លាស់ប្តូរការងារ",

  "ការងារក្រុម",
  "ការទំនាក់ទំនងនៅកន្លែងធ្វើការ",
  "ការប្រជុំ",
  "ការរៀបចំការងារ",
  "ការកំណត់អាទិភាព",
  "ការគ្រប់គ្រងភារកិច្ច",
  "ការដោះស្រាយជម្លោះ",
  "ការសហការជាមួយមិត្តរួមការងារ",
  "ការទទួលមតិយោបល់",
  "ការផ្តល់មតិយោបល់",

  "អាជីវកម្មតូច",
  "ការចាប់ផ្តើមអាជីវកម្ម",
  "ការលក់",
  "អតិថិជន",
  "សេវាកម្មអតិថិជន",
  "ការផ្សព្វផ្សាយ",
  "ការផ្សាយពាណិជ្ជកម្ម",
  "ការកំណត់តម្លៃ",
  "ប្រាក់ចំណេញ",
  "ការចំណាយ",

  "ការសន្សំប្រាក់",
  "ការរៀបចំថវិកា",
  "ចំណូល",
  "ចំណាយប្រចាំថ្ងៃ",
  "ការទូទាត់",
  "វិក្កយបត្រ",
  "បង្កាន់ដៃ",
  "គណនីធនាគារ",
  "ការផ្ទេរប្រាក់",
  "ការប្តូរប្រាក់",

  "ការរៀនជំនាញថ្មី",
  "ជំនាញទំនាក់ទំនង",
  "ការនិយាយជាសាធារណៈ",
  "ការសរសេរ",
  "ការគិតវិភាគ",
  "ការដោះស្រាយបញ្ហា",
  "ការច្នៃប្រឌិត",
  "ការរៀនភាសា",
  "ការរៀនតាមអ៊ីនធឺណិត",
  "ការអភិវឌ្ឍខ្លួន"
];

const templates = [
  s => `តើខ្ញុំគួរចាប់ផ្តើមជាមួយ${s}យ៉ាងដូចម្តេច?`,
  s => `តើអ្វីជាចំណុចសំខាន់របស់${s}?`,
  s => `ខ្ញុំចង់រៀនអំពី${s} តើគួរធ្វើដូចម្តេច?`,
  s => `តើមានវិធីងាយៗដើម្បីកែលម្អ${s}ទេ?`,
  s => `តើមានកំហុសអ្វីខ្លះដែលគួរជៀសវាងពេល${s}?`,
  s => `អាចផ្តល់គន្លឹះអំពី${s}បានទេ?`,
  s => `តើខ្ញុំអាចអនុវត្ត${s}ក្នុងជីវិតប្រចាំថ្ងៃយ៉ាងដូចម្តេច?`,
  s => `ខ្ញុំមិនសូវយល់ពី${s}ទេ តើអាចពន្យល់បានទេ?`,
  s => `តើអ្វីអាចជួយឲ្យខ្ញុំប្រសើរឡើងក្នុង${s}?`,
  s => `ជួយណែនាំខ្ញុំអំពី${s}ផង`,
  s => `តើគួររៀបចំផែនការសម្រាប់${s}យ៉ាងដូចម្តេច?`,
  s => `តើមានឧទាហរណ៍សាមញ្ញអំពី${s}ទេ?`,
  s => `តើខ្ញុំគួរប្រុងប្រយ័ត្នអ្វីខ្លះទាក់ទងនឹង${s}?`,
  s => `តើអាចពន្យល់${s}ជាជំហានៗបានទេ?`
];

const responses = [
  s => `បាន។ សម្រាប់${s} គួរចាប់ផ្តើមពីគោលដៅច្បាស់លាស់ និងជំហានតូចៗ។`,
  s => `ចំណុចសំខាន់គឺរៀបចំផែនការ និងអនុវត្តជាប្រចាំ។`,
  s => `បាន។ ខ្ញុំអាចជួយបំបែក${s}ជាជំហានងាយៗ។`,
  s => `គួរពិនិត្យស្ថានភាពជាក់ស្តែងរបស់អ្នក មុនសម្រេចវិធីអនុវត្ត${s}។`,
  s => `បាន។ ការជៀសវាងកំហុសទូទៅ និងការតាមដានលទ្ធផលអាចជួយបាន។`,
  s => `សាកចាប់ផ្តើមពីវិធីសាមញ្ញមួយ ហើយកែសម្រួលតាមលទ្ធផល។`,
  s => `ខ្ញុំអាចជួយរៀបចំគំនិត និងផែនការដែលពាក់ព័ន្ធនឹង${s}។`,
  s => `បាន។ បើអ្នកប្រាប់ខ្ញុំពីគោលដៅ ខ្ញុំអាចជួយរៀបចំជំហានបន្ទាប់។`,
  s => `ការអនុវត្តជាបន្តបន្ទាប់នឹងជួយឲ្យអ្នកមានភាពច្បាស់លាស់ជាងមុនអំពី${s}។`,
  s => `បាន។ ខ្ញុំនឹងពន្យល់តាមរបៀបសាមញ្ញ និងងាយយល់។`,
  s => `សម្រាប់${s} គួរកំណត់អ្វីដែលសំខាន់ជាងគេជាមុន។`,
  s => `បាន។ ឧទាហរណ៍ជាក់ស្តែងអាចជួយឲ្យយល់${s}បានងាយជាងមុន។`,
  s => `គួរពិនិត្យព័ត៌មាន និងលក្ខខណ្ឌពាក់ព័ន្ធមុនធ្វើការសម្រេចចិត្តអំពី${s}។`,
  s => `ច្បាស់ហើយ។ យើងអាចរៀន${s}ម្តងមួយជំហាន។`
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

  if (!key || existing.has(key) || seen.has(key)) continue;

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

const backup = `${path}.bak-add500-batch9-${stamp}`;

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
