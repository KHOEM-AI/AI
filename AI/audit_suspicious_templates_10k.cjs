const fs = require("fs");

const path = "src/ai/khmer.mjs";
const text = fs.readFileSync(path, "utf8");

function normalize(s) {
  return String(s)
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

// Patterns that are commonly produced by generic templates.
// We only REPORT them; nothing is modified.
const suspiciousPatterns = [
  {
    name: "រៀបចំ + generic object",
    re: /តើគួររៀបចំ\s+(.+?)\s+យ៉ាង(?:ម៉េច|ដូចម្តេច)/,
    responseRe: /អាចរៀបចំ(.+?)ដោយកំណត់អាទិភាព/
  },
  {
    name: "ធ្វើ + object + ឱ្យបានល្អ",
    re: /ចង់ធ្វើ\s+(.+?)\s+ឱ្យបានល្អ/,
    responseRe: /សម្រាប់(.+?)គួរអនុវត្តជាប្រចាំ/
  },
  {
    name: "មិនដឹងធ្វើ + object",
    re: /មិនដឹងធ្វើ\s+(.+?)\s+យ៉ាងម៉េច/,
    responseRe: /ចាប់ផ្តើមពីមូលដ្ឋាននៃ(.+?)ហើយបំបែក/
  },
  {
    name: "អាចជួយជាមួយ + object",
    re: /តើអាចជួយជាមួយ\s+(.+?)\s+បានទេ/,
    responseRe: /បញ្ហាដែលបងកំពុងជួបជាមួយ(.+?)ហើយ/
  },
  {
    name: "វិធីងាយសម្រាប់ + object",
    re: /តើមានវិធីងាយសម្រាប់\s+(.+?)\s+ទេ/,
    responseRe: /វិធីសាមញ្ញបំផុត/
  },
  {
    name: "រៀបចំ + object",
    re: /តើគួររៀបចំ\s+(.+?)\s+យ៉ាងដូចម្តេច/,
    responseRe: /សាករៀបចំ(.+?)តាមអាទិភាព/
  }
];

// Words/objects that are more suspicious when inserted into
// planning/organization templates.
const obviouslyOddObjects = new Set([
  "ថ្ម",
  "ទឹក",
  "តែ",
  "ស្លាបព្រា",
  "កែវ",
  "ចាន",
  "សម",
  "ដប",
  "អំបិល",
  "ស្ករ",
  "ខ្យល់",
  "ភ្លៀង",
  "ពន្លឺ",
  "ដី",
  "ខ្សាច់"
]);

const results = [];

const lines = text.split(/\r?\n/);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Only inspect normal string-response entries.
  const m = line.match(
    /^\s*\["((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\s*\],?/
  );

  if (!m) continue;

  const q = normalize(m[1]);
  const r = normalize(m[2]);

  for (const pattern of suspiciousPatterns) {
    const qm = q.match(pattern.re);

    if (!qm) continue;

    const object = normalize(qm[1]);

    let suspicious = false;
    let reason = pattern.name;

    // Strong signal: object is one of the clearly odd generated objects.
    if (obviouslyOddObjects.has(object)) {
      suspicious = true;
      reason += " + suspicious object";
    }

    // Check whether response appears to repeat the same template.
    if (pattern.responseRe && pattern.responseRe.test(r)) {
      suspicious = true;
      reason += " + matching generic response template";
    }

    if (suspicious) {
      results.push({
        line: i + 1,
        reason,
        q,
        r
      });
    }
  }
}

console.log("========================================");
console.log("🔍 SUSPICIOUS TEMPLATE PATTERN AUDIT");
console.log("========================================");
console.log(`📦 Suspicious entries found: ${results.length}`);
console.log("----------------------------------------");

for (const item of results) {
  console.log(`📍 Line ${item.line}`);
  console.log(`⚠️ ${item.reason}`);
  console.log(`Q: ${item.q}`);
  console.log(`R: ${item.r}`);
  console.log("");
}

console.log("========================================");
console.log("✅ AUDIT ONLY — DATASET NOT MODIFIED");
console.log("========================================");
