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
  "ការរៀបចំជីវិតប្រចាំថ្ងៃ",
  "ការរៀបចំផែនការអនាគត",
  "ការកំណត់គោលដៅជីវិត",
  "ការអភិវឌ្ឍខ្លួន",
  "ការរៀនជំនាញថ្មី",
  "ការបង្កើនចំណេះដឹង",
  "ការអានព័ត៌មាន",
  "ការពិនិត្យប្រភពព័ត៌មាន",
  "ការគិតវិភាគ",
  "ការដោះស្រាយបញ្ហា",

  "ការរៀនភាសាបរទេស",
  "ការអនុវត្តវាក្យសព្ទ",
  "ការរៀនវេយ្យាករណ៍",
  "ការហាត់និយាយ",
  "ការហាត់ស្តាប់",
  "ការហាត់អាន",
  "ការហាត់សរសេរ",
  "ការបកប្រែភាសា",
  "ការរៀនពាក្យថ្មី",
  "ការកែលម្អការបញ្ចេញសំឡេង",

  "ការប្រើបច្ចេកវិទ្យាប្រចាំថ្ងៃ",
  "ការរៀបចំទូរស័ព្ទ",
  "ការគ្រប់គ្រងកម្មវិធី",
  "ការសម្អាតទំហំផ្ទុក",
  "ការបម្រុងទុកទិន្នន័យ",
  "ការធ្វើបច្ចុប្បន្នភាពកម្មវិធី",
  "ការគ្រប់គ្រងគណនី",
  "ការគ្រប់គ្រងការជូនដំណឹង",
  "ការរៀបចំការកំណត់",
  "ការដោះស្រាយបញ្ហាបច្ចេកទេស",

  "ការធ្វើដំណើរប្រចាំថ្ងៃ",
  "ការរកផ្លូវ",
  "ការសួរទិសដៅ",
  "ការរង់ចាំយានយន្ត",
  "ការធ្វើដំណើរតាមឡានក្រុង",
  "ការធ្វើដំណើរតាមតាក់ស៊ី",
  "ការធ្វើដំណើរតាមម៉ូតូ",
  "ការរៀបចំសម្ភារៈ",
  "ការពិនិត្យកាលវិភាគ",
  "ការមកដល់ទាន់ពេល",

  "ការថែរក្សាទំនាក់ទំនង",
  "ការរក្សាមិត្តភាព",
  "ការចំណាយពេលជាមួយគ្រួសារ",
  "ការរៀបចំជួបមិត្តភក្តិ",
  "ការអបអរសាទរ",
  "ការជូនពរ",
  "ការផ្ញើសារសួរសុខទុក្ខ",
  "ការស្តាប់មតិអ្នកដទៃ",
  "ការគោរពមតិខុសគ្នា",
  "ការរក្សាទំនាក់ទំនងល្អ"
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
  s => `តើអាចណែនាំខ្ញុំអំពី${s}បានទេ?`,
  s => `តើមានវិធីកែលម្អ${s}ទេ?`
];

const responses = [
  s => `បាន។ ខ្ញុំអាចពន្យល់អំពី${s}ជាជំហានៗ និងងាយយល់។`,
  s => `សម្រាប់${s} គួរចាប់ផ្តើមពីចំណុចសាមញ្ញ ហើយអនុវត្តជាប្រចាំ។`,
  s => `ការរៀបចំផែនការល្អអាចជួយឲ្យ${s}មានប្រសិទ្ធភាពជាងមុន។`,
  s => `វិធីសាមញ្ញគឺបែងចែក${s}ជាជំហានតូចៗ ហើយធ្វើតាមលំដាប់។`,
  s => `ចំណុចសំខាន់គឺត្រូវអនុវត្តជាប្រចាំ និងពិនិត្យលទ្ធផល។`,
  s => `គួរចាប់ផ្តើមពីមូលដ្ឋាន មុននឹងបន្តទៅព័ត៌មានលម្អិត។`,
  s => `អាចចាប់ផ្តើមពីជំហានតូចៗ ហើយបង្កើនបន្តិចម្តងៗ។`,
  s => `បាន។ ខ្ញុំនឹងពន្យល់តាមរបៀបសាមញ្ញ និងអនុវត្តបានងាយ។`,
  s => `ឧទាហរណ៍ជាក់ស្តែងអាចជួយឲ្យយល់ពី${s}បានកាន់តែងាយ។`,
  s => `គួរពិនិត្យព័ត៌មានសំខាន់ៗជាមុន និងជៀសវាងការសម្រេចចិត្តដោយប្រញាប់។`,
  s => `ការរៀបចំល្អអាចធ្វើឲ្យ${s}ងាយស្រួល និងមានប្រសិទ្ធភាពជាងមុន។`,
  s => `បាន។ ប្រាប់ខ្ញុំបន្ថែម ប្រសិនបើអ្នកចង់បានព័ត៌មានជាក់លាក់អំពី${s}។`,
  s => `អ្នកអាចចាប់ផ្តើមពីវិធីសាមញ្ញ ហើយបន្តទៅកម្រិតខ្ពស់តាមលំដាប់។`,
  s => `បាន។ ការអនុវត្តជាប្រចាំ និងការពិនិត្យកំហុសអាចជួយកែលម្អ${s}បាន។`
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

const backup = `${path}.bak-add500-batch17-${stamp}`;

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
