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
  "ការទំនាក់ទំនងជាមួយអ្នកដទៃ",
  "ការសួរសុខទុក្ខ",
  "ការណែនាំខ្លួន",
  "ការណែនាំមិត្តភក្តិ",
  "ការសុំជំនួយ",
  "ការផ្តល់ជំនួយ",
  "ការសុំទោស",
  "ការអរគុណ",
  "ការសរសើរ",
  "ការឆ្លើយតបដោយគោរព",

  "ការដោះស្រាយការយល់ច្រឡំ",
  "ការដោះស្រាយជម្លោះ",
  "ការសន្ទនាជាមួយមិត្តភក្តិ",
  "ការសន្ទនាជាមួយគ្រួសារ",
  "ការសន្ទនានៅកន្លែងធ្វើការ",
  "ការសន្ទនាជាមួយអតិថិជន",
  "ការសន្ទនាជាមួយអ្នកលក់",
  "ការសួរព័ត៌មាន",
  "ការផ្តល់ព័ត៌មាន",
  "ការបញ្ជាក់ព័ត៌មាន",

  "ការទៅធនាគារ",
  "ការទៅការិយាល័យ",
  "ការទៅប្រៃសណីយ៍",
  "ការទៅហាង",
  "ការទៅផ្សារ",
  "ការទៅមន្ទីរពេទ្យ",
  "ការទៅសាលារៀន",
  "ការទៅសាកលវិទ្យាល័យ",
  "ការទៅស្ថានីយ៍",
  "ការទៅព្រលានយន្តហោះ",

  "ការស្នើសុំសេវាកម្ម",
  "ការកក់សេវាកម្ម",
  "ការលុបការកក់",
  "ការផ្លាស់ប្តូរការកក់",
  "ការសួរតម្លៃសេវាកម្ម",
  "ការសួរម៉ោងបើក",
  "ការសួរទីតាំង",
  "ការសួររបៀបប្រើសេវា",
  "ការរាយការណ៍បញ្ហា",
  "ការស្នើសុំដំណោះស្រាយ",

  "ការទទួលកញ្ចប់",
  "ការផ្ញើកញ្ចប់",
  "ការផ្ញើសំបុត្រ",
  "ការតាមដានការដឹកជញ្ជូន",
  "ការបញ្ជាក់អាសយដ្ឋាន",
  "ការបញ្ជាក់លេខទូរស័ព្ទ",
  "ការបំពេញទម្រង់",
  "ការចុះឈ្មោះ",
  "ការណាត់ជួប",
  "ការបញ្ជាក់ការណាត់ជួប"
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
  s => `សម្រាប់${s} គួររៀបចំជាមុន និងនិយាយឲ្យច្បាស់។`,
  s => `បាន។ ការយល់ដឹងអំពី${s}អាចជួយឲ្យទំនាក់ទំនងបានល្អជាងមុន។`,
  s => `វិធីសាមញ្ញគឺរៀបចំអ្វីដែលត្រូវនិយាយ ហើយអនុវត្តម្តងមួយជំហាន។`,
  s => `ចំណុចសំខាន់គឺត្រូវស្តាប់ឲ្យបានល្អ និងឆ្លើយតបដោយគោរព។`,
  s => `គួរបញ្ជាក់ព័ត៌មានសំខាន់ៗមុននឹងបន្តទៅជំហានបន្ទាប់។`,
  s => `អាចចាប់ផ្តើមពីសំណួរងាយៗ ហើយបន្តទៅព័ត៌មានលម្អិត។`,
  s => `បាន។ ខ្ញុំនឹងពន្យល់តាមរបៀបសាមញ្ញ និងអនុវត្តបានងាយ។`,
  s => `ឧទាហរណ៍ជាក់ស្តែងអាចជួយឲ្យយល់ពី${s}បានកាន់តែងាយ។`,
  s => `គួរពិនិត្យព័ត៌មាន និងលក្ខខណ្ឌជាមុន ដើម្បីជៀសវាងការយល់ច្រឡំ។`,
  s => `ការរៀបចំល្អអាចធ្វើឲ្យ${s}រលូន និងមានប្រសិទ្ធភាពជាងមុន។`,
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

const backup = `${path}.bak-add500-batch15-${stamp}`;

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
