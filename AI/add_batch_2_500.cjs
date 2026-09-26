const fs = require("fs");

const path = "src/ai/khmer.mjs";
const text = fs.readFileSync(path, "utf8");

function normalize(s) {
  return s
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function escapeJs(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n");
}

// ------------------------------------------------------------
// Subjects
// ------------------------------------------------------------

const subjects = [
  ["ការងារ", "ការងាររបស់បង"],
  ["ការសិក្សា", "ការសិក្សារបស់បង"],
  ["ការរៀន", "ការរៀនរបស់បង"],
  ["ការងារផ្ទះ", "ការងារផ្ទះ"],
  ["ការសរសេរ", "ការសរសេរ"],
  ["ការអាន", "ការអាន"],
  ["ការហាត់ប្រាណ", "ការហាត់ប្រាណ"],
  ["ការគេង", "ការគេង"],
  ["ការសម្រាក", "ការសម្រាក"],
  ["ការធ្វើម្ហូប", "ការធ្វើម្ហូប"],
  ["ការសម្អាត", "ការសម្អាត"],
  ["ការរៀបចំ", "ការរៀបចំ"],
  ["ការធ្វើដំណើរ", "ការធ្វើដំណើរ"],
  ["ការទិញទំនិញ", "ការទិញទំនិញ"],
  ["ការសន្សំប្រាក់", "ការសន្សំប្រាក់"],
  ["ការគ្រប់គ្រងពេលវេលា", "ការគ្រប់គ្រងពេលវេលា"],
  ["ការប្រើទូរស័ព្ទ", "ការប្រើទូរស័ព្ទ"],
  ["អ៊ីនធឺណិត", "អ៊ីនធឺណិត"],
  ["កុំព្យូទ័រ", "កុំព្យូទ័រ"],
  ["ការសរសេរកូដ", "ការសរសេរកូដ"],
  ["JavaScript", "JavaScript"],
  ["TypeScript", "TypeScript"],
  ["Python", "Python"],
  ["Git", "Git"],
  ["GitHub", "GitHub"],
  ["API", "API"],
  ["website", "website"],
  ["កម្មវិធី", "កម្មវិធី"],
  ["ទូរស័ព្ទ", "ទូរស័ព្ទ"],
  ["WiFi", "WiFi"],
  ["Bluetooth", "Bluetooth"],
  ["កាមេរ៉ា", "កាមេរ៉ា"],
  ["ថ្ម", "ថ្ម"],
  ["storage", "storage"],
  ["ឯកសារ", "ឯកសារ"],
  ["រូបភាព", "រូបភាព"],
  ["វីដេអូ", "វីដេអូ"],
  ["តន្ត្រី", "តន្ត្រី"],
  ["អាហារ", "អាហារ"],
  ["ទឹក", "ទឹក"],
  ["កាហ្វេ", "កាហ្វេ"],
  ["តែ", "តែ"],
  ["គ្រួសារ", "គ្រួសារ"],
  ["មិត្តភក្តិ", "មិត្តភក្តិ"],
  ["ផ្ទះ", "ផ្ទះ"],
  ["បន្ទប់", "បន្ទប់"],
  ["ផែនការ", "ផែនការ"],
  ["គោលដៅ", "គោលដៅ"]
];

// ------------------------------------------------------------
// Question templates
// 10 × 50 = 500
// ------------------------------------------------------------

const templates = [
  {
    q: s => `តើ ${s[0]} ត្រូវចាប់ផ្តើមយ៉ាងម៉េច`,
    r: s => `សម្រាប់${s[1]} សាកចាប់ផ្តើមពីជំហានតូចមួយដែលច្បាស់ ហើយបន្តតាមលំដាប់។`
  },
  {
    q: s => `តើគួររៀបចំ ${s[0]} យ៉ាងម៉េច`,
    r: s => `អាចរៀបចំ${s[1]} ដោយកំណត់អាទិភាព ហើយបែងចែកការងារជាផ្នែកតូចៗ។`
  },
  {
    q: s => `ចង់ធ្វើ ${s[0]} ឱ្យបានល្អ`,
    r: s => `សម្រាប់${s[1]} គួរអនុវត្តជាប្រចាំ និងពិនិត្យលទ្ធផលបន្ទាប់ពីធ្វើរួច។`
  },
  {
    q: s => `មានបញ្ហាជាមួយ ${s[0]}`,
    r: s => `បើមានបញ្ហាជាមួយ${s[1]} សាកពិនិត្យមូលហេតុជាមុន ហើយដោះស្រាយម្តងមួយជំហាន។`
  },
  {
    q: s => `មិនដឹងធ្វើ ${s[0]} យ៉ាងម៉េច`,
    r: s => `មិនអីទេ។ ចាប់ផ្តើមពីមូលដ្ឋាននៃ${s[1]} ហើយបំបែកបញ្ហាជាជំហានតូចៗ។`
  },
  {
    q: s => `ចង់រៀនអំពី ${s[0]}`,
    r: s => `អាចចាប់ផ្តើមពីមូលដ្ឋាននៃ${s[1]} រួចអនុវត្តជាក់ស្តែងបន្តិចម្តងៗ។`
  },
  {
    q: s => `តើ ${s[0]} សំខាន់ទេ`,
    r: s => `សារៈសំខាន់របស់${s[1]} អាស្រ័យលើគោលដៅ និងស្ថានភាពរបស់បង។`
  },
  {
    q: s => `ចង់កែលម្អ ${s[0]}`,
    r: s => `សាកកំណត់ចំណុចដែលចង់កែលម្អក្នុង${s[1]} ហើយធ្វើការលើវាជាបន្តបន្ទាប់។`
  },
  {
    q: s => `តើអាចជួយជាមួយ ${s[0]} បានទេ`,
    r: s => `បាន។ ប្រាប់ខ្ញុំពីបញ្ហាដែលបងកំពុងជួបជាមួយ${s[1]} ហើយខ្ញុំនឹងជួយបំបែកវាជាជំហានៗ។`
  },
  {
    q: s => `តើគួរប្រុងប្រយ័ត្នអ្វីជាមួយ ${s[0]}`,
    r: s => `ជាមួយ${s[1]} គួរពិនិត្យព័ត៌មានឱ្យច្បាស់ មុនធ្វើសកម្មភាពសំខាន់ៗ។`
  },
  {
    q: s => `ចង់យល់បន្ថែមអំពី ${s[0]}`,
    r: s => `បាន។ អាចចាប់ផ្តើមពីចំណុចសំខាន់ៗនៃ${s[1]} ហើយសួរបន្ថែមតាមចំណុចដែលមិនទាន់យល់។`
  }
];

// ------------------------------------------------------------
// Generate candidates
// ------------------------------------------------------------

const generated = [];

for (const template of templates) {
  for (const subject of subjects) {
    generated.push([
      template.q(subject),
      template.r(subject)
    ]);
  }
}

// Existing keys
const existing = new Set();

for (const line of text.split("\n")) {
  const m = line.match(/^\s*\["([^"]*)",/);
  if (m) existing.add(normalize(m[1]));
}

// Deduplicate
const unique = [];
const batchSeen = new Set();

for (const [key, response] of generated) {
  const k = normalize(key);

  if (existing.has(k)) continue;
  if (batchSeen.has(k)) continue;

  batchSeen.add(k);
  unique.push([key, response]);

  if (unique.length >= 500) break;
}

console.log(`📦 Existing entries: ${existing.size}`);
console.log(`🧩 Generated candidates: ${generated.length}`);
console.log(`➕ Unique new entries: ${unique.length}`);

if (unique.length < 500) {
  console.error("❌ Could not generate 500 unique entries.");
  process.exit(1);
}

// Backup
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `${path}.bak-add500-${stamp}`;
fs.copyFileSync(path, backup);

// Find final ];
const pos = text.lastIndexOf("];");

if (pos === -1) {
  console.error("❌ Could not find final ];");
  process.exit(1);
}

const block =
  "\n\n  // ============================================================\n" +
  "  // Expansion Batch 2 — 500 entries\n" +
  "  // ============================================================\n" +
  unique
    .map(([key, response]) =>
      `  ["${escapeJs(key)}", "${escapeJs(response)}"],`
    )
    .join("\n") +
  "\n";

const result = text.slice(0, pos) + block + text.slice(pos);

fs.writeFileSync(path, result, "utf8");

console.log(`💾 Backup: ${backup}`);
console.log(`✅ Added: ${unique.length}`);
console.log(`📁 Updated file: ${path}`);
