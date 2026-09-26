const fs = require("fs");

const file = "src/ai/khmer.mjs";
const content = fs.readFileSync(file, "utf8");

const data = new Map();

for (const [index, line] of content.split(/\r?\n/).entries()) {
  const lineNo = index + 1;

  const m = line.match(/^\s*\["([^"]+)"\s*,\s*"([^"]*)"/);
  if (!m) continue;

  const aliases = m[1]
    .split("|")
    .map(x => x.trim())
    .filter(Boolean);

  const response = m[2].trim();

  for (const alias of aliases) {
    const key = alias.toLowerCase();

    if (!data.has(key)) data.set(key, []);
    data.get(key).push({
      line: lineNo,
      response
    });
  }
}

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/[។!?,៖:;()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a, b) {
  a = normalize(a);
  b = normalize(b);

  if (a === b) return 1;

  const A = new Set(a.split(" "));
  const B = new Set(b.split(" "));

  const intersection = [...A].filter(x => B.has(x)).length;
  const union = new Set([...A, ...B]).size;

  return union ? intersection / union : 0;
}

const merge = [];
const review = [];
const keep = [];

for (const [key, items] of data) {
  const lines = [...new Set(items.map(x => x.line))];

  if (lines.length < 2) continue;

  const responses = [];
  const seen = new Set();

  for (const item of items) {
    if (!seen.has(item.line)) {
      seen.add(item.line);
      responses.push(item);
    }
  }

  let maxSimilarity = 0;

  for (let i = 0; i < responses.length; i++) {
    for (let j = i + 1; j < responses.length; j++) {
      maxSimilarity = Math.max(
        maxSimilarity,
        similarity(
          responses[i].response,
          responses[j].response
        )
      );
    }
  }

  const result = {
    key,
    items: responses,
    similarity: maxSimilarity
  };

  if (maxSimilarity >= 0.55) {
    merge.push(result);
  } else if (maxSimilarity >= 0.30) {
    review.push(result);
  } else {
    keep.push(result);
  }
}

function print(title, list) {
  console.log("\n" + "=".repeat(90));
  console.log(title);
  console.log("=".repeat(90));

  for (const item of list) {
    console.log(`\nKEY: ${item.key}`);
    console.log(`Similarity: ${item.similarity.toFixed(2)}`);

    for (const x of item.items) {
      console.log(`  L${x.line}: ${x.response}`);
    }
  }
}

print("🟢 MERGE CANDIDATES", merge);
print("🟡 REVIEW", review);
print("🔵 KEEP / DIFFERENT INTENT", keep);

console.log("\n" + "=".repeat(90));
console.log("SUMMARY");
console.log("=".repeat(90));
console.log(`MERGE:  ${merge.length}`);
console.log(`REVIEW: ${review.length}`);
console.log(`KEEP:   ${keep.length}`);
