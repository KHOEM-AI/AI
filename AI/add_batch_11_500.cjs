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
  "ការអប់រំ",
  "សាលារៀន",
  "គ្រូបង្រៀន",
  "សិស្ស",
  "មេរៀន",
  "កិច្ចការផ្ទះ",
  "ការប្រឡង",
  "ពិន្ទុ",
  "ថ្នាក់រៀន",
  "សៀវភៅសិក្សា",

  "មហាវិទ្យាល័យ",
  "សាកលវិទ្យាល័យ",
  "មុខវិជ្ជា",
  "ការស្រាវជ្រាវ",
  "គម្រោងសិក្សា",
  "បទបង្ហាញ",
  "ការសរសេររបាយការណ៍",
  "ការអានសៀវភៅ",
  "បណ្ណាល័យ",
  "ការរៀនតាមអ៊ីនធឺណិត",

  "ភាសាខ្មែរ",
  "ភាសាអង់គ្លេស",
  "ភាសាថៃ",
  "ភាសាវៀតណាម",
  "ភាសាចិន",
  "ភាសាជប៉ុន",
  "ភាសាកូរ៉េ",
  "វេយ្យាករណ៍",
  "វាក្យសព្ទ",
  "ការបញ្ចេញសំឡេង",

  "ការបកប្រែ",
  "ការអាន",
  "ការស្តាប់ភាសា",
  "ការនិយាយភាសា",
  "ការសរសេរភាសា",
  "ពាក្យមានន័យដូច",
  "ពាក្យផ្ទុយ",
  "ប្រយោគ",
  "កំហុសវេយ្យាករណ៍",
  "ការរៀនពាក្យថ្មី",

  "គណិតវិទ្យា",
  "ការគណនា",
  "ភាគរយ",
  "ប្រភាគ",
  "សមីការ",
  "ធរណីមាត្រ",
  "ស្ថិតិ",
  "តារាងទិន្នន័យ",
  "ក្រាប",
  "ការដោះស្រាយលំហាត់"
];

const templates = [
  s => `តើ${s}គឺជាអ្វី?`,
  s => `តើខ្ញុំអាចរៀន${s}ឲ្យបានល្អយ៉ាងដូចម្តេច?`,
  s => `ខ្ញុំមិនយល់${s}ទេ តើអាចពន្យល់បានទេ?`,
  s => `តើមានវិធីងាយៗសម្រាប់${s}ទេ?`,
  s => `តើអ្វីជាចំណុចសំខាន់របស់${s}?`,
  s => `តើខ្ញុំគួរចាប់ផ្តើមរៀន${s}ពីណា?`,
  s => `អាចផ្តល់ឧទាហរណ៍អំពី${s}បានទេ?`,
  s => `តើមានកំហុសអ្វីខ្លះដែលគួរជៀសវាងពេលរៀន${s}?`,
  s => `ជួយខ្ញុំរៀបចំការរៀន${s}ផង`,
  s => `តើមានគន្លឹះអ្វីខ្លះសម្រាប់${s}?`,
  s => `តើខ្ញុំអាចអនុវត្ត${s}ដោយខ្លួនឯងបានទេ?`,
  s => `តើអាចពន្យល់${s}ជាជំហានៗបានទេ?`,
  s => `ខ្ញុំចង់កែលម្អជំនាញ${s} តើគួរធ្វើដូចម្តេច?`,
  s => `តើមានឧទាហរណ៍សាមញ្ញសម្រាប់${s}ទេ?`
];

const responses = [
  s => `បាន។ ខ្ញុំនឹងពន្យល់${s}តាមរបៀបសាមញ្ញ និងជាជំហានៗ។`,
  s => `សាកចាប់ផ្តើមពីមូលដ្ឋាន ហើយអនុវត្តជាបន្តបន្ទាប់ជាមួយ${s}។`,
  s => `បាន។ ប្រាប់ខ្ញុំថាតើផ្នែកណារបស់${s}ដែលអ្នកមិនយល់។`,
  s => `ការអនុវត្តជាប្រចាំអាចជួយឲ្យអ្នកយល់${s}កាន់តែច្បាស់។`,
  s => `ចំណុចសំខាន់គឺយល់ពីគោលការណ៍មូលដ្ឋានរបស់${s}ជាមុន។`,
  s => `គួររៀនពីងាយទៅពិបាក ហើយកុំប្រញាប់រំលងមូលដ្ឋាន${s}។`,
  s => `បាន។ ឧទាហរណ៍ជាក់ស្តែងអាចធ្វើឲ្យ${s}ងាយយល់ជាងមុន។`,
  s => `គួរអានសំណួរឲ្យច្បាស់ និងពិនិត្យចម្លើយម្តងទៀតពេលធ្វើ${s}។`,
  s => `បាន។ ខ្ញុំអាចជួយរៀបចំផែនការសិក្សាសម្រាប់${s}ឲ្យសមនឹងពេលវេលារបស់អ្នក។`,
  s => `សម្រាប់${s} ការធ្វើលំហាត់ និងការពិនិត្យកំហុសជាប្រចាំមានប្រយោជន៍។`,
  s => `បាន។ អ្នកអាចអនុវត្ត${s}ដោយចាប់ផ្តើមពីលំហាត់ងាយៗ។`,
  s => `ច្បាស់ហើយ។ យើងអាចបំបែក${s}ជាផ្នែកតូចៗដើម្បីងាយរៀន។`,
  s => `កំណត់គោលដៅតូចៗ និងអនុវត្តរៀងរាល់ថ្ងៃអាចជួយកែលម្អ${s}។`,
  s => `បាន។ ខ្ញុំនឹងផ្តល់ឧទាហរណ៍ដែលងាយយល់ និងអាចអនុវត្តបាន។`
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

const backup = `${path}.bak-add500-batch11-${stamp}`;

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
