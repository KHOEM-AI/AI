const fs = require("fs");

const file = "src/ai/khmer.mjs";
const content = fs.readFileSync(file, "utf8");
const lines = content.split(/\r?\n/);

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `${file}.bak-batch2-${stamp}`;
fs.copyFileSync(file, backup);

const mergeMap = {
  "តម្លៃប៉ុន្មាន":
    "បាន។ សូមប្រាប់ខ្ញុំថា បងចង់ដឹងតម្លៃផលិតផល ឬសេវាកម្មអ្វី ដើម្បីខ្ញុំជួយពិនិត្យ។",

  "ខ្ញុំកំពុងធ្វើការ":
    "ល្អណាស់។ 💪 បន្តការងាររបស់បង ហើយបើត្រូវការជំនួយក្នុងការរៀបចំ ឬពន្យល់អ្វីមួយ ខ្ញុំនៅទីនេះ។",

  "ខ្ញុំកំពុងសម្រាក":
    "ល្អណាស់។ 🙂 សម្រាកឱ្យបានគ្រប់គ្រាន់ ដើម្បីមានកម្លាំងបន្ត។",

  "អ៊ីនធឺណិតយឺត":
    "បើអ៊ីនធឺណិតយឺត សាកបិទបើក Wi-Fi ឬ Mobile Data ម្តងទៀត ហើយពិនិត្យសញ្ញា។ បើនៅតែយឺត អាចពិនិត្យ Router ឬទាក់ទងអ្នកផ្តល់សេវា។",

  "ចង់រៀនកូដ":
    "ល្អណាស់! 💻 អាចចាប់ផ្តើមពី HTML, CSS និង JavaScript ឬជ្រើសភាសាដែលសមនឹងគោលដៅរបស់បង។",

  "ថ្ងៃនេះរវល់ណាស់":
    "បើថ្ងៃនេះរវល់ណាស់ សាករៀបចំអាទិភាពសំខាន់ៗ ហើយកុំភ្លេចសម្រាកបន្តិចផង។ 🙂",

  "ចង់សរសេរ cv":
    "បាន។ ខ្ញុំអាចជួយរៀបចំ CV ឱ្យមានរបៀបរៀបរយ និងសមនឹងការងារដែលបងចង់ដាក់ពាក្យ។",

  "ចង់សន្សំលុយ":
    "បាន។ អាចចាប់ផ្តើមដោយកំណត់ថវិកា កត់ត្រាចំណាយ និងដាក់ចំនួនតូចមួយសម្រាប់សន្សំជាប្រចាំ។",

  "ចំណាយច្រើនពេក":
    "បើចំណាយច្រើនពេក សាកកត់ត្រាចំណាយទាំងអស់ រួចបែងចែកជាចំណាយចាំបាច់ និងចំណាយដែលអាចកាត់បន្ថយបាន។",

  "ខ្ញុំគេងមិនលក់":
    "បើគេងមិនលក់ សាកបន្ថយការប្រើទូរស័ព្ទមុនចូលគេង រក្សាបន្ទប់ឱ្យស្ងាត់ និងងងឹត ហើយព្យាយាមមានម៉ោងគេងទៀងទាត់។",

  "ខ្ញុំភ្លេច":
    "មិនអីទេ។ 🙂 សាកកត់ត្រា ឬដាក់ Reminder ដើម្បីជួយរំលឹក ហើយបើបងប្រាប់ខ្ញុំពីអ្វីដែលភ្លេច ខ្ញុំនឹងជួយរៀបចំវា។",

  "មិនអីទេ":
    "បាន។ 🙂 មិនអីទេ។ យើងអាចបន្តតាមអ្វីដែលងាយស្រួលសម្រាប់បង។",

  "មួយភ្លែត":
    "បាន។ 🙂 ចំណាយពេលរបស់បងបាន ខ្ញុំនឹងរង់ចាំ។",

  "តិចទៀត":
    "បាន។ 🙂 មិនបាច់ប្រញាប់ទេ យើងអាចបន្តម្តងមួយជំហាន។",

  "អ៊ីចឹងហើយ":
    "យល់ហើយ។ 🙂 យើងអាចបន្តពីចំណុចនេះបាន។"
};

const output = [];
const seen = new Set();
let changed = 0;
let removed = 0;

for (const line of lines) {
  const m = line.match(/^(\s*)\["([^"]+)"\s*,\s*"([^"]*)"(.*)$/);

  if (!m) {
    output.push(line);
    continue;
  }

  const indent = m[1];
  const key = m[2].trim();
  const normalized = key.toLowerCase();

  if (!Object.prototype.hasOwnProperty.call(mergeMap, key)) {
    output.push(line);
    continue;
  }

  if (seen.has(normalized)) {
    removed++;
    continue;
  }

  const response = mergeMap[key];

  output.push(
    `${indent}["${key}", "${response}"${m[4]}`
  );

  seen.add(normalized);
  changed++;
}

fs.writeFileSync(file, output.join("\n"));

console.log(`📦 Backup: ${backup}`);
console.log(`✏️ Updated entries: ${changed}`);
console.log(`🗑️ Removed duplicate lines: ${removed}`);
console.log(`📦 Backup kept: ${backup}`);
