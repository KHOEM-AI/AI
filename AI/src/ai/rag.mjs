// rag.mjs — Hybrid RAG: keyword (tf-idf) + optional vector search
// រត់ដោយឯងឯង: node src/ai/rag.mjs ingest <file>
//               node src/ai/rag.mjs ask "សំណួរ"
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const STORE = path.join(ROOT, "data", "rag", "docs.jsonl");
const EMBED_MODEL = process.env.RAG_EMBED_MODEL || path.join(process.env.HOME || "", "models", "bge-m3-Q8_0.gguf");
const EMBED_BIN = process.env.RAG_EMBED_BIN || "llama-embedding";

// ---------- tokenization ----------
const tokenize = (s) =>
  (s.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);

// ---------- ingest ----------
function chunk(text, size = 500, overlap = 50) {
  const out = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    const c = text.slice(i, i + size).trim();
    if (c) out.push(c);
  }
  return out;
}

function parseDocFile(p) {
  const raw = fs.readFileSync(p, "utf8");
  if (p.endsWith(".jsonl")) {
    return raw.split("\n").filter(Boolean)
      .map((l) => { const d = JSON.parse(l); return d.text ?? JSON.stringify(d); });
  }
  if (p.endsWith(".json")) {
    const j = JSON.parse(raw);
    const arr = Array.isArray(j) ? j : [j];
    return arr.map((d) => d.text ?? d.content ?? JSON.stringify(d));
  }
  return chunk(raw);
}

export function loadDocs() {
  if (!fs.existsSync(STORE)) return [];
  return fs.readFileSync(STORE, "utf8").split("\n").filter(Boolean).map(JSON.parse);
}

export function ingestFile(p) {
  const texts = parseDocFile(p);
  const docs = texts.flatMap((text, i) => {
    const pieces = text.length > 600 ? chunk(text) : [text];
    return pieces.map((t, j) => ({ id: `${p}#${i}.${j}`, file: p, text: t }));
  });
  const existing = new Set(loadDocs().map((d) => d.id));
  const fresh = docs.filter((d) => !existing.has(d.id));
  if (fresh.length) fs.appendFileSync(STORE, fresh.map((d) => JSON.stringify(d)).join("\n") + "\n");
  return { added: fresh.length, skipped: docs.length - fresh.length };
}

// ---------- embeddings (optional) ----------
function hasEmbedder() {
  return fs.existsSync(EMBED_MODEL);
}
function embed(text) {
  const out = execFileSync(EMBED_BIN, ["-m", EMBED_MODEL, "--pooling", "last", "-p", text], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const nums = [...out.matchAll(/-?\d+\.\d+(?:[eE][-+]?\d+)?/g)].map((m) => parseFloat(m[0]));
  return nums.length > 100 ? nums : null;
}
export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

// ---------- keyword score (tf-idf style) ----------

function normalizeSearchText(s) {
  return String(s ?? "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function searchFeatures(s) {
  const text = normalizeSearchText(s);
  const chars = Array.from(text);
  const features = new Set();

  // Character n-grams help match Khmer text without word spaces.
  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i <= chars.length - n; i++) {
      features.add(chars.slice(i, i + n).join(""));
    }
  }

  // Keep whole text too, so short queries remain searchable.
  if (text.length > 0) features.add(text);
  return features;
}

function keywordScore(query, docText) {
  const q = searchFeatures(query);
  const d = searchFeatures(docText);
  if (!q.size || !d.size) return 0;

  let matched = 0;
  for (const feature of q) {
    if (d.has(feature)) matched++;
  }

  return matched / q.size;
}

function buildDf(docs) {
  const df = new Map();
  for (const d of docs) for (const t of new Set(tokenize(d.text))) df.set(t, (df.get(t) || 0) + 1);
  return df;
}

// ---------- hybrid search ----------

export async function hybridSearch(query, { topK = 3, minScore = 0.15 } = {}) {
  const docs = loadDocs();
  if (!docs.length) return [];

  const qText = normalizeSearchText(query);
  if (!qText) return [];

  let qv = null;
  if (hasEmbedder()) {
    try {
      qv = embed(query);
    } catch {
      qv = null;
    }
  }

  const scored = docs.map((d) => {
    const kw = keywordScore(query, d.text);
    let vs = 0;

    if (qv && d.vec) {
      vs = Math.max(0, Math.min(1, (cosine(qv, d.vec) + 1) / 2));
    }

    const score = qv && d.vec
      ? 0.4 * kw + 0.6 * vs
      : kw;

    return {
      id: d.id,
      file: d.file,
      text: d.text,
      score: Number(score.toFixed(4))
    };
  });

  return scored
    .filter((d) => d.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function vectorizeAll() {
  if (!hasEmbedder()) return { error: "រកមិនឃើញ embedding model: " + EMBED_MODEL };
  const docs = loadDocs();
  for (const d of docs) {
    if (d.vec) continue;
    d.vec = embed(d.text) || null;
  }
  fs.writeFileSync(STORE, docs.map((d) => JSON.stringify(d)).join("\n") + "\n");
  return { vectorized: docs.filter((d) => d.vec).length, total: docs.length };
}

// ---------- answer with sources ----------
export function buildContext(hits) {
  return hits.map((h) => `[${h.id}] ${h.text}`).join("\n---\n");
}
export async function ragAnswer(query, generateFn, opts = {}) {
  const hits = await hybridSearch(query, opts);
  if (!hits.length) {
    return { found: false, sources: [], prompt: null,
      answer: "ខ្ញុំមិនឃើញព័ត៌មាននេះក្នុងចំណេះដឹងរបស់ខ្ញុំទេ។ អ្នកអាចបន្ថែមវាឱ្យខ្ញុំសិន។" };
  }
  const prompt = `ព័ត៌មាន៖\n${buildContext(hits)}\n\nសំណួរ៖ ${query}\nឆ្លើយដោយពឹងតែព័ត៌មានខាងលើ ហើយលេខ [id] ដែលប្រើ។`;
  const answer = await generateFn(prompt);
  return { found: true, sources: hits.map(({ id, file, score }) => ({ id, file, score })), prompt, answer };
}

// ---------- CLI ----------
if (process.argv[1] && process.argv[1].endsWith("rag.mjs")) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === "ingest") {
    for (const f of rest) console.log(f, ingestFile(f));
  } else if (cmd === "search") {
    console.log(JSON.stringify(await hybridSearch(rest.join(" ")), null, 2));
  } else if (cmd === "ask") {
    console.log(JSON.stringify(await ragAnswer(rest.join(" "), async (p) => `[LLM] ${p}`), null, 2));
  } else if (cmd === "vectorize") {
    console.log(vectorizeAll());
  } else {
    console.log("ប្រើ: ingest <file...> | search <q> | ask <q> | vectorize");
  }
}
