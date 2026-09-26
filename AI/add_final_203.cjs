const fs = require("fs");

const path = "src/ai/khmer.mjs";
const text = fs.readFileSync(path, "utf8");

function normalize(s) {
  return s.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
}

function escapeJs(s) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n");
}

// 21 subjects × 10 templates = 210 candidates.
// The script will select exactly 203 unique entries.
const subjects = [
  ["ការគ្រប់គ្រងជីវិត", "ការគ្រប់គ្រងជីវិត"],
  ["ការរៀបចំអនាគត", "ការរៀបចំអនាគត"],
  ["ការកំណត់គោលដៅ", "ការកំណត់គោលដៅ"],
  ["ការអភិវឌ្ឍខ្លួន", "ការអភិវឌ្ឍខ្លួន"],
  ["ការរៀនដោយខ្លួនឯង", "ការរៀនដោយខ្លួនឯង"],
  ["ការធ្វើការជាក្រុម", "ការធ្វើការជាក្រុម"],
  ["ភាពជាអ្នកដឹកនាំ", "ភាពជាអ្នកដឹកនាំ"],
  ["ការរៀបចំគម្រោង", "ការរៀបចំគម្រោង"],
  ["ការគ្រប់គ្រងហានិភ័យ", "ការគ្រប់គ្រងហានិភ័យ"],
  ["ការដោះស្រាយវិបត្តិ", "ការដោះស្រាយវិបត្តិ"],
  ["ការបង្កើតគំនិត", "ការបង្កើតគំនិត"],
  ["ការរៀនពីកំហុស", "ការរៀនពីកំហុស"],
  ["ការអនុវត្តជាប្រចាំ", "ការអនុវត្តជាប្រចាំ"],
  ["ការបង្កើនប្រសិទ្ធភាព", "ការបង្កើនប្រសិទ្ធភាព"],
  ["ការរៀបចំអាទិភាព", "ការរៀបចំអាទិភាព"],
  ["ការបំពេញភារកិច្ច", "ការបំពេញភារកិច្ច"],
  ["ការរៀបចំកាលវិភាគ", "ការរៀបចំកាលវិភាគ"],
  ["ការធ្វើសេចក្តីសម្រេច", "ការធ្វើសេចក្តីសម្រេច"],
  ["ការទទួលខុសត្រូវ", "ការទទួលខុសត្រូវ"],
  ["ការស្វែងរកព័ត៌មាន", "ការស្វែងរកព័ត៌មាន"],
  ["ការយល់ដឹង", "ការយល់ដឹង"]
];

const templates = [
  {
    q: s => `ចង់ដឹងបន្ថែមអំពី ${s[0]}`,
    r: s => `បាន។ ខ្ញុំអាចពន្យល់អំពី${s[1]} ជាចំណុចខ្លីៗ និងផ្តល់ឧទាហរណ៍ឱ្យងាយយល់។`
  },
  {
    q: s => `តើ ${s[0]} មានសារៈសំខាន់យ៉ាងម៉េច`,
    r: s => `${s[1]} មានសារៈសំខាន់ ព្រោះវាជួយឱ្យការរៀបចំ និងការអនុវត្តមានភាពច្បាស់លាស់ជាងមុន។`
  },
  {
    q: s => `តើគួររៀបចំ ${s[0]} យ៉ាងដូចម្តេច`,
    r: s => `អាចចាប់ផ្តើមដោយកំណត់អ្វីដែលត្រូវធ្វើ បែងចែកជាជំហាន ហើយពិនិត្យលទ្ធផលជាបន្តបន្ទាប់។`
  },
  {
    q: s => `ខ្ញុំចង់កែលម្អ ${s[0]}`,
    r: s => `អាចកែលម្អ${s[1]} ដោយកំណត់ចំណុចដែលត្រូវកែ ហើយអនុវត្តតិចៗជាប្រចាំ។`
  },
  {
    q: s => `តើមានវិធីងាយសម្រាប់ ${s[0]} ទេ`,
    r: s => `មាន។ គួរបំបែក${s[1]} ទៅជាកិច្ចការតូចៗ ហើយធ្វើតាមលំដាប់ពីងាយទៅពិបាក។`
  },
  {
    q: s => `ខ្ញុំមានបញ្ហាជាមួយ ${s[0]}`,
    r: s => `មិនអីទេ។ អាចពិនិត្យមើលបញ្ហាម្តងមួយចំណុច ហើយរកដំណោះស្រាយដែលអាចអនុវត្តបានជាមុន។`
  },
  {
    q: s => `មិនទាន់យល់អំពី ${s[0]}`,
    r: s => `មិនអីទេ។ ខ្ញុំអាចពន្យល់ម្តងទៀតដោយប្រើពាក្យសាមញ្ញ និងឧទាហរណ៍ជាក់ស្តែង។`
  },
  {
    q: s => `ចង់ចាប់ផ្តើម ${s[0]}`,
    r: s => `ល្អ។ ចាប់ផ្តើមពីមូលដ្ឋាន កំណត់ជំហានដំបូងឱ្យច្បាស់ ហើយបន្តបន្តិចម្តងៗ។`
  },
  {
    q: s => `តើអាចជួយខ្ញុំជាមួយ ${s[0]} បានទេ`,
    r: s => `បាន។ ប្រាប់ខ្ញុំពីចំណុចដែលអ្នកកំពុងជួបប្រទះ ហើយខ្ញុំនឹងជួយរៀបចំដំណោះស្រាយជាជំហានៗ។`
  },
  {
    q: s => `តើគួរចាប់ផ្តើមពីណាសម្រាប់ ${s[0]}`,
    r: s => `គួរចាប់ផ្តើមពីគោលដៅ និងព័ត៌មានមូលដ្ឋាន បន្ទាប់មករៀបចំជំហានអនុវត្ត។`
  }
];

const generated = [];

for (const s of subjects) {
  for (const t of templates) {
    generated.push([t.q(s), t.r(s)]);
  }
}

console.log(`📦 Existing entries: ${(text.match(/^\s*\["/gm) || []).length}`);
console.log(`🧩 Generated candidates: ${generated.length}`);

const existing = new Set();

for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^\s*\["([^"]*)"/);
  if (m) existing.add(normalize(m[1]));
}

const unique = [];
const seen = new Set(existing);

for (const [q, r] of generated) {
  const key = normalize(q);

  if (seen.has(key)) continue;

  seen.add(key);
  unique.push([q, r]);
}

console.log(`➕ Unique new entries: ${unique.length}`);

if (unique.length < 203) {
  console.error("❌ Could not generate 203 unique entries.");
  process.exit(1);
}

const selected = unique.slice(0, 203);

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `${path}.bak-final203-${stamp}`;

fs.copyFileSync(path, backup);
console.log(`💾 Backup: ${backup}`);

const block = selected
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

console.log(`✅ Added: ${selected.length}`);
console.log(`📁 Updated: ${path}`);
