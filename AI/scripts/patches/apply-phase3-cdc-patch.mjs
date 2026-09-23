import fs from "node:fs";

console.log("=== PHASE 3: Code Data Center — foundation ===");

const CDC_CONTENT = `// src/ai/codeDataCenter.mjs
// Phase 3: Code Data Center — foundation (Master Spec Part 2 + Part 3)
// READ/ANALYZE only. Source files remain the source of truth; this module
// stores structured metadata ABOUT the code, not a copy of the code.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();

const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", ".next",
  ".vite", "coverage", ".cache", ".turbo",
]);

const LANG_BY_EXT = {
  ".mjs": "javascript", ".js": "javascript", ".ts": "typescript",
  ".tsx": "typescript", ".jsx": "javascript", ".json": "json",
  ".md": "markdown", ".css": "css", ".html": "html",
};

let fileIndex = [];
let lastScan = null;

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
}

function hashFile(content) {
  return crypto.createHash("sha1").update(content).digest("hex").slice(0, 12);
}

function indexOne(absPath) {
  const rel = path.relative(ROOT, absPath);
  const stat = fs.statSync(absPath);
  const ext = path.extname(absPath);
  let lineCount = null;
  let hash = null;
  try {
    const content = fs.readFileSync(absPath, "utf8");
    lineCount = content.split("\\n").length;
    hash = hashFile(content);
  } catch {
    // binary/unreadable — keep metadata, skip content-derived fields
  }
  return {
    path: rel,
    filename: path.basename(absPath),
    extension: ext,
    sizeBytes: stat.size,
    lineCount,
    hash,
    lastModified: stat.mtime.toISOString(),
    language: LANG_BY_EXT[ext] || "unknown",
    module: rel.split(path.sep)[0] || rel,
    status: "indexed",
  };
}

export function scanRepo(root = ROOT) {
  const files = [];
  walk(root, files);
  fileIndex = files.map(indexOne);
  lastScan = new Date().toISOString();
  return { fileCount: fileIndex.length, scannedAt: lastScan };
}

export function getFileIndex() {
  return { scannedAt: lastScan, files: fileIndex };
}

export function isReady() {
  return fileIndex.length > 0;
}

export function findFile(relPath) {
  return fileIndex.find((f) => f.path === relPath) || null;
}
`;

const cdcPath = "src/ai/codeDataCenter.mjs";
if (fs.existsSync(cdcPath)) {
  console.log(`⏭️  ${cdcPath} already exists — skipping creation`);
} else {
  fs.writeFileSync(cdcPath, CDC_CONTENT);
  console.log(`✅ created ${cdcPath}`);
}

// ---- Patch status.mjs ----
let status = fs.readFileSync("src/ai/status.mjs", "utf8");
if (status.includes("codeDataCenter.mjs")) {
  console.log("⏭️  status.mjs already wired — skipping");
} else {
  const probeBlock = 'probe("session", API_HEALTH_TIMEOUT_MS, async () => checkSessionHealth(aiCore)),\n  ]);';
  const probeBlockNew =
    'probe("session", API_HEALTH_TIMEOUT_MS, async () => checkSessionHealth(aiCore)),\n\n' +
    '    probe("codeDataCenter", API_HEALTH_TIMEOUT_MS, async () => {\n' +
    '      const m = await loadModule("./codeDataCenter.mjs");\n' +
    '      if (!m.isReady()) m.scanRepo();\n' +
    '      const { files } = m.getFileIndex();\n' +
    '      if (!Array.isArray(files) || files.length === 0) throw new Error("file index is empty after scan");\n' +
    '      return {\n' +
    '        status: "READY",\n' +
    '        reasonKm: `Index មានឯកសារ ${files.length} ក្នុងប្រព័ន្ធ`,\n' +
    '        reasonEn: `File index has ${files.length} files`,\n' +
    '        module: "codeDataCenter.mjs",\n' +
    '      };\n' +
    '    }),\n' +
    '  ]);';
  if (!status.includes(probeBlock)) {
    console.error("❌ could not find insertion point in status.mjs — aborting (no changes written)");
    process.exit(1);
  }
  status = status.replace(probeBlock, probeBlockNew);
  fs.writeFileSync("src/ai/status.mjs", status);
  console.log("✅ [src/ai/status.mjs] registered codeDataCenter health probe");
}

// ---- Patch api.mjs ----
let api = fs.readFileSync("src/ai/api.mjs", "utf8");
if (api.includes("/api/code/index")) {
  console.log("⏭️  api.mjs already wired — skipping");
} else {
  const anchor = 'app.get("/api/audit", guard, (req, res) => {';
  const anchorNew =
    '// ---- Phase 3: Code Data Center (read/analyze only, spec Part 3) ----\n' +
    '  app.get("/api/code/index", guard, wrap(async () => {\n' +
    '    const cdc = await import("./codeDataCenter.mjs");\n' +
    '    if (!cdc.isReady()) cdc.scanRepo();\n' +
    '    return cdc.getFileIndex();\n' +
    '  }));\n\n' +
    '  app.post("/api/code/scan", guard, wrap(async () => {\n' +
    '    const cdc = await import("./codeDataCenter.mjs");\n' +
    '    return cdc.scanRepo();\n' +
    '  }));\n\n' +
    '  app.get("/api/audit", guard, (req, res) => {';
  if (!api.includes(anchor)) {
    console.error("❌ could not find insertion point in api.mjs — aborting (no changes written)");
    process.exit(1);
  }
  api = api.replace(anchor, anchorNew);
  fs.writeFileSync("src/ai/api.mjs", api);
  console.log("✅ [src/ai/api.mjs] added /api/code/index and /api/code/scan");
}

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
