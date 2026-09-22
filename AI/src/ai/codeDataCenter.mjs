// src/ai/codeDataCenter.mjs
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

// Secrets and generated/backup files — never indexed, mirrors .gitignore.
// Spec Part 4 (Security): "Never expose secrets in... Code Data Center"
const IGNORE_FILE_PATTERNS = [
  /^\.env(\..*)?$/,        // .env, .env.local, etc. (.env.example is fine to keep out too)
  /\.pem$/, /\.key$/,
  /\.bak(-.*)?$/,          // .bak, .bak-phase4, etc.
  /\.log$/,
  /^package-lock\.json$/,
];

function isIgnoredFile(filename) {
  return IGNORE_FILE_PATTERNS.some((re) => re.test(filename));
}

// Extensions whose content should never be read as UTF-8 text
// (prevents garbage lineCount / hash on binary files — spec Part 4 Correctness)
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
  ".woff", ".woff2", ".ttf", ".eot",
  ".zip", ".tar", ".gz",
  ".pdf",
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
    else if (entry.isFile() && !isIgnoredFile(entry.name)) out.push(full);
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
  if (!BINARY_EXTENSIONS.has(ext)) {
    try {
      const content = fs.readFileSync(absPath, "utf8");
      lineCount = content.split("\n").length;
      hash = hashFile(content);
    } catch {
      // unreadable — keep metadata, skip content-derived fields
    }
  } else {
    // binary file: hash raw bytes instead, no lineCount
    try {
      hash = hashFile(fs.readFileSync(absPath));
    } catch {
      // unreadable — keep metadata only
    }
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
