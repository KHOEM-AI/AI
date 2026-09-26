const fs = require("fs");

const path = "src/ai/khmer.mjs";
const CHUNK_SIZE = 500;

// Usage:
// node audit_chunk_10k.cjs 1
// node audit_chunk_10k.cjs 2
// ...
// node audit_chunk_10k.cjs 20

const chunkNo = Number(process.argv[2] || 1);

if (!Number.isInteger(chunkNo) || chunkNo < 1 || chunkNo > 20) {
  console.error("Usage: node audit_chunk_10k.cjs 1..20");
  process.exit(1);
}

const text = fs.readFileSync(path, "utf8");

function normalize(s) {
  return String(s)
    .normalize("NFC")
    .toLowerCase()
    .replace(/[|]+/g, " ")
    .replace(/[។?!៖,:;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s) {
  return normalize(s)
    .split(/\s+/)
    .filter(Boolean);
}

const entries = [];

const re =
  /^\s*\["((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\s*\],?/gm;

for (const m of text.matchAll(re)) {
  entries.push({
    q: m[1],
    r: m[2]
  });
}

const start = (chunkNo - 1) * CHUNK_SIZE;
const end = Math.min(start + CHUNK_SIZE, entries.length);
const chunk = entries.slice(start, end);

console.log("========================================");
console.log("🔍 CHUNK DATASET AUDIT");
console.log("========================================");
console.log(`📦 Total entries: ${entries.length}`);
console.log(`📑 Chunk: ${chunkNo}/20`);
console.log(`📍 Entries: ${start + 1}–${end}`);
console.log("----------------------------------------");

// --------------------------------------------------
// 1. Exact / normalized duplicates INSIDE this chunk
// --------------------------------------------------

const seen = new Map();
const exactDupes = [];

chunk.forEach((e, i) => {
  const key = normalize(e.q);

  if (seen.has(key)) {
    exactDupes.push({
      a: seen.get(key),
      b: start + i + 1,
      q: e.q
    });
  } else {
    seen.set(key, start + i + 1);
  }
});

// --------------------------------------------------
// 2. Near duplicates
// --------------------------------------------------

function similarity(a, b) {
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));

  if (!A.size || !B.size) return 0;

  let common = 0;

  for (const x of A) {
    if (B.has(x)) common++;
  }

  return common / Math.max(A.size, B.size);
}

const nearDupes = [];

for (let i = 0; i < chunk.length; i++) {
  for (let j = i + 1; j < chunk.length; j++) {
    const a = chunk[i];
    const b = chunk[j];

    const na = normalize(a.q);
    const nb = normalize(b.q);

    if (na === nb) continue;

    const sim = similarity(a.q, b.q);

    // High similarity only.
    if (sim >= 0.85) {
      nearDupes.push({
        a: start + i + 1,
        b: start + j + 1,
        score: sim,
        q1: a.q,
        q2: b.q,
        r1: a.r,
        r2: b.r
      });
    }
  }
}

// --------------------------------------------------
// 3. Same question shape / template
// --------------------------------------------------

const templates = new Map();

for (let i = 0; i < chunk.length; i++) {
  const q = normalize(chunk[i].q);

  const shape = q
    .replace(/\d+/g, "#")
    .replace(/[a-z]+/g, "WORD")
    .replace(/\s+/g, " ");

  if (!templates.has(shape)) {
    templates.set(shape, []);
  }

  templates.get(shape).push({
    line: start + i + 1,
    q: chunk[i].q
  });
}

const repeatedTemplates = [...templates.entries()]
  .filter(([, list]) => list.length >= 3);

// --------------------------------------------------
// 4. Cross-language / mixed-language candidates
// --------------------------------------------------

function isPureKhmerCheck(q) {
  const hasKhmer = /[\u1780-\u17FF]/.test(q);
  const hasOther = /[A-Za-z\u0E00-\u0E7F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(q);
  return hasKhmer && !hasOther;
}

const mixed = [];
for (let i = 0; i < chunk.length; i++) {
  const q = chunk[i].q;
  if (!isPureKhmerCheck(q)) {
    mixed.push({ line: start + i + 1, q });
  }
}

// --------------------------------------------------
// OUTPUT
// --------------------------------------------------

console.log(`⚠️ Exact duplicates in chunk: ${exactDupes.length}`);
console.log(`⚠️ Near duplicates (>=85%): ${nearDupes.length}`);
console.log(`⚠️ Repeated question shapes (>=3): ${repeatedTemplates.length}`);
console.log(`🌐 Mixed-language candidates: ${mixed.length}`);

console.log("");
console.log("========== EXACT DUPLICATES ==========");

for (const x of exactDupes) {
  console.log(`Lines ${x.a} ↔ ${x.b}`);
  console.log(`Q: ${x.q}`);
  console.log("");
}

console.log("========== NEAR DUPLICATES ==========");

for (const x of nearDupes.slice(0, 100)) {
  console.log(
    `Lines ${x.a} ↔ ${x.b} | similarity ${(x.score * 100).toFixed(1)}%`
  );
  console.log(`Q1: ${x.q1}`);
  console.log(`Q2: ${x.q2}`);
  console.log(`R1: ${x.r1}`);
  console.log(`R2: ${x.r2}`);
  console.log("");
}

console.log("========== REPEATED QUESTION SHAPES ==========");

for (const [shape, list] of repeatedTemplates.slice(0, 50)) {
  console.log(`Shape: ${shape}`);

  for (const x of list.slice(0, 10)) {
    console.log(`  Line ${x.line}: ${x.q}`);
  }

  console.log("");
}

console.log("========== MIXED LANGUAGE ==========");

for (const x of mixed.slice(0, 100)) {
  console.log(`Line ${x.line}: ${x.q}`);
}

console.log("");
console.log("========================================");
console.log("✅ AUDIT ONLY — DATASET NOT MODIFIED");
console.log("========================================");
