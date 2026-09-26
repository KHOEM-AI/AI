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
  "បញ្ញាសិប្បនិម្មិត",
  "AI",
  "Chatbot",
  "ការរៀនជាមួយ AI",
  "ការសរសេរជាមួយ AI",
  "ការបកប្រែជាមួយ AI",
  "ការសង្ខេបអត្ថបទ",
  "ការបង្កើតរូបភាព",
  "ការបង្កើតមាតិកា",
  "ការស្វែងរកព័ត៌មាន",

  "អ៊ីនធឺណិត",
  "Browser",
  "Google",
  "Search",
  "Website",
  "Webpage",
  "Link",
  "Email",
  "Password",
  "Account",

  "ទូរស័ព្ទឆ្លាតវៃ",
  "កម្មវិធីទូរស័ព្ទ",
  "Android",
  "iPhone",
  "ការដំឡើងកម្មវិធី",
  "ការលុបកម្មវិធី",
  "ការអាប់ដេតកម្មវិធី",
  "ការកំណត់ទូរស័ព្ទ",
  "ការថតអេក្រង់",
  "ការចែករំលែកអេក្រង់",

  "Facebook",
  "Telegram",
  "YouTube",
  "TikTok",
  "Instagram",
  "Messenger",
  "ការផ្ញើសារ",
  "ការបង្ហោះ",
  "មតិយោបល់",
  "ការចែករំលែក",

  "សុវត្ថិភាពអ៊ីនធឺណិត",
  "ពាក្យសម្ងាត់",
  "ការផ្ទៀងផ្ទាត់ពីរជំហាន",
  "ការការពារគណនី",
  "ការឆបោកតាមអ៊ីនធឺណិត",
  "សារគួរឲ្យសង្ស័យ",
  "Link មិនស្គាល់",
  "Privacy",
  "ទិន្នន័យផ្ទាល់ខ្លួន",
  "ការបម្រុងទុកទិន្នន័យ"
];

const templates = [
  s => `តើ${s}គឺជាអ្វី?`,
  s => `តើខ្ញុំអាចប្រើ${s}យ៉ាងដូចម្តេច?`,
  s => `ខ្ញុំចង់រៀនអំពី${s} តើគួរចាប់ផ្តើមពីណា?`,
  s => `តើមានអត្ថប្រយោជន៍អ្វីខ្លះពី${s}?`,
  s => `តើមានអ្វីដែលខ្ញុំគួរប្រុងប្រយ័ត្នពេលប្រើ${s}?`,
  s => `តើអាចពន្យល់${s}ឲ្យខ្ញុំងាយយល់បានទេ?`,
  s => `ខ្ញុំមានបញ្ហាជាមួយ${s} តើគួរធ្វើដូចម្តេច?`,
  s => `តើមានវិធីងាយៗក្នុងការរៀន${s}ទេ?`,
  s => `តើខ្ញុំគួររៀបចំ${s}យ៉ាងដូចម្តេច?`,
  s => `ជួយណែនាំខ្ញុំអំពី${s}ផង`,
  s => `តើមានកំហុសទូទៅអ្វីខ្លះពាក់ព័ន្ធនឹង${s}?`,
  s => `តើមានគន្លឹះសំខាន់ៗអ្វីខ្លះសម្រាប់${s}?`,
  s => `តើខ្ញុំអាចប្រើ${s}ឲ្យមានប្រសិទ្ធភាពជាងមុនយ៉ាងដូចម្តេច?`,
  s => `តើអ្វីជាចំណុចសំខាន់ដែលគួរដឹងអំពី${s}?`
];

const responses = [
  s => `បាន។ ខ្ញុំអាចពន្យល់${s}ជាភាសាសាមញ្ញ និងជាជំហានៗ។`,
  s => `បាន។ វិធីប្រើ${s}អាស្រ័យលើគោលបំណង និងឧបករណ៍ដែលអ្នកកំពុងប្រើ។`,
  s => `សាកចាប់ផ្តើមពីមូលដ្ឋាន ហើយអនុវត្តម្តងមួយជំហានជាមួយ${s}។`,
  s => `បាន។ ${s}អាចមានប្រយោជន៍ ប្រសិនបើប្រើឲ្យសមស្របនឹងតម្រូវការ។`,
  s => `គួរប្រុងប្រយ័ត្នចំពោះព័ត៌មានមិនច្បាស់ និងប្រភពដែលមិនទុកចិត្តបាននៅពេលប្រើ${s}។`,
  s => `ខ្ញុំអាចជួយបំបែក${s}ជាចំណុចតូចៗ ដើម្បីងាយយល់។`,
  s => `បើមានបញ្ហា សូមប្រាប់ខ្ញុំពីអ្វីដែលកំពុងកើតឡើងជាក់ស្តែងជាមួយ${s}។`,
  s => `បាន។ ការរៀនតាមឧទាហរណ៍ និងការអនុវត្តជាប្រចាំអាចជួយបាន។`,
  s => `គួររៀបចំ${s}ឲ្យមានសុវត្ថិភាព និងងាយស្រួលប្រើ។`,
  s => `បាន។ ខ្ញុំនឹងជួយណែនាំតាមលំដាប់ពីងាយទៅពិបាក។`,
  s => `គួរពិនិត្យព័ត៌មានមុនចុច Link ឬផ្តល់ព័ត៌មានផ្ទាល់ខ្លួននៅពេលប្រើ${s}។`,
  s => `ចំណុចសំខាន់គឺសុវត្ថិភាព ភាពឯកជន និងការផ្ទៀងផ្ទាត់ប្រភព។`,
  s => `អ្នកអាចកែលម្អការប្រើ${s}ដោយកំណត់គោលដៅ និងប្រើមុខងារដែលចាំបាច់។`,
  s => `បាន។ ខ្ញុំអាចជួយរៀបរាប់ចំណុចសំខាន់ៗអំពី${s}តាមបរិបទដែលអ្នកត្រូវការ។`
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

const backup = `${path}.bak-add500-batch10-${stamp}`;

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
