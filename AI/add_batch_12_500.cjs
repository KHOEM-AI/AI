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
  "ការធ្វើដំណើរទៅកម្ពុជា",
  "ការធ្វើដំណើរទៅថៃ",
  "ការធ្វើដំណើរទៅវៀតណាម",
  "ការធ្វើដំណើរទៅឡាវ",
  "ការធ្វើដំណើរទៅចិន",
  "ការធ្វើដំណើរទៅជប៉ុន",
  "ការធ្វើដំណើរទៅកូរ៉េ",
  "ការធ្វើដំណើរទៅសិង្ហបុរី",
  "ការធ្វើដំណើរទៅម៉ាឡេស៊ី",
  "ការធ្វើដំណើរទៅឥណ្ឌូនេស៊ី",

  "ការកក់សណ្ឋាគារ",
  "ការកក់សំបុត្រយន្តហោះ",
  "ការកក់សំបុត្ររថយន្ត",
  "លិខិតឆ្លងដែន",
  "ទិដ្ឋាការ",
  "ឥវ៉ាន់ធ្វើដំណើរ",
  "ផែនទី",
  "ទិសដៅ",
  "ទីកន្លែងទេសចរណ៍",
  "ការណែនាំអ្នកទេសចរ",

  "ភោជនីយដ្ឋាន",
  "ហាងកាហ្វេ",
  "ម្ហូបខ្មែរ",
  "ម្ហូបថៃ",
  "ម្ហូបវៀតណាម",
  "ម្ហូបចិន",
  "ម្ហូបជប៉ុន",
  "ម្ហូបកូរ៉េ",
  "អាហារពេលព្រឹក",
  "អាហារសម្រន់",

  "បន្លែ",
  "ផ្លែឈើ",
  "សាច់",
  "ត្រី",
  "ស៊ុត",
  "អង្ករ",
  "មី",
  "នំប៉័ង",
  "ទឹក",
  "កាហ្វេ",

  "ការចម្អិនម្ហូប",
  "ការចៀន",
  "ការស្ងោរ",
  "ការអាំង",
  "ការចំហុយ",
  "ការកាត់បន្លែ",
  "ការរក្សាទុកអាហារ",
  "ការអានរូបមន្ត",
  "គ្រឿងទេស",
  "រសជាតិ"
];

const templates = [
  s => `តើ${s}គឺជាអ្វី?`,
  s => `តើខ្ញុំគួរដឹងអ្វីខ្លះអំពី${s}?`,
  s => `ខ្ញុំចង់រៀនអំពី${s}`,
  s => `តើមានគន្លឹះអ្វីខ្លះសម្រាប់${s}?`,
  s => `តើអាចណែនាំខ្ញុំអំពី${s}បានទេ?`,
  s => `តើមានអ្វីដែលគួរប្រុងប្រយ័ត្នពេល${s}?`,
  s => `តើខ្ញុំអាចរៀបចំ${s}យ៉ាងដូចម្តេច?`,
  s => `ខ្ញុំមានសំណួរអំពី${s}`,
  s => `តើអាចពន្យល់${s}ឲ្យងាយយល់បានទេ?`,
  s => `តើមានវិធីងាយៗសម្រាប់${s}ទេ?`,
  s => `តើអ្វីជាចំណុចសំខាន់របស់${s}?`,
  s => `ជួយខ្ញុំជាមួយ${s}ផង`,
  s => `តើមានឧទាហរណ៍អំពី${s}ទេ?`,
  s => `តើខ្ញុំគួរចាប់ផ្តើម${s}ពីណា?`
];

const responses = [
  s => `បាន។ ខ្ញុំអាចជួយពន្យល់អំពី${s} និងផ្តល់ព័ត៌មានទូទៅដែលពាក់ព័ន្ធ។`,
  s => `សម្រាប់${s} គួររៀបចំផែនការជាមុន និងពិនិត្យព័ត៌មានសំខាន់ៗ។`,
  s => `បាន។ ខ្ញុំអាចជួយរៀបរាប់ចំណុចសំខាន់ៗអំពី${s}។`,
  s => `គន្លឹះសំខាន់គឺរៀបចំជំហាន និងពិនិត្យព័ត៌មានមុនអនុវត្ត${s}។`,
  s => `ច្បាស់ហើយ។ ខ្ញុំនឹងពន្យល់${s}តាមរបៀបសាមញ្ញ។`,
  s => `គួរតែពិនិត្យលក្ខខណ្ឌ និងព័ត៌មានបច្ចុប្បន្នមុនធ្វើ${s}។`,
  s => `បាន។ ការរៀបចំជាមុនអាចធ្វើឲ្យ${s}ងាយស្រួលជាងមុន។`,
  s => `បាន។ ប្រាប់ខ្ញុំបន្ថែមអំពីអ្វីដែលអ្នកចង់ដឹងពី${s}។`,
  s => `ខ្ញុំអាចបំបែក${s}ជាចំណុចតូចៗ ដើម្បីងាយយល់។`,
  s => `បាន។ ចាប់ផ្តើមពីវិធីសាមញ្ញ ហើយអនុវត្តម្តងមួយជំហាន។`,
  s => `ចំណុចសំខាន់ៗអាស្រ័យលើស្ថានភាព និងគោលបំណងរបស់អ្នក។`,
  s => `បាន។ ខ្ញុំនឹងជួយតាមព័ត៌មានដែលអ្នកផ្តល់អំពី${s}។`,
  s => `ឧទាហរណ៍ជាក់ស្តែងអាចជួយឲ្យយល់${s}បានកាន់តែងាយ។`,
  s => `សាកចាប់ផ្តើមពីមូលដ្ឋានរបស់${s} ហើយបន្តទៅចំណុចលម្អិត។`
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

const backup = `${path}.bak-add500-batch12-${stamp}`;

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
