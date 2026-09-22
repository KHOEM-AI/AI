import fs from "node:fs";

console.log("=== PHASE 3.1: Code Data Center — exclude secrets + fix binary detection ===");

const cdcPath = "src/ai/codeDataCenter.mjs";
let content = fs.readFileSync(cdcPath, "utf8");

if (content.includes("IGNORE_FILE_PATTERNS")) {
  console.log("⏭️  already patched — skipping");
  process.exit(0);
}

// 1. Add file-level ignore patterns (mirrors .gitignore) + binary extension list
const oldConst = `const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", ".next",
  ".vite", "coverage", ".cache", ".turbo",
]);`;

const newConst = `const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", ".next",
  ".vite", "coverage", ".cache", ".turbo",
]);

// Secrets and generated/backup files — never indexed, mirrors .gitignore.
// Spec Part 4 (Security): "Never expose secrets in... Code Data Center"
const IGNORE_FILE_PATTERNS = [
  /^\\.env(\\..*)?$/,        // .env, .env.local, etc. (.env.example is fine to keep out too)
  /\\.pem$/, /\\.key$/,
  /\\.bak(-.*)?$/,          // .bak, .bak-phase4, etc.
  /\\.log$/,
  /^package-lock\\.json$/,
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
]);`;

if (!content.includes(oldConst)) {
  console.error("❌ could not find IGNORE_DIRS block — aborting (no changes written)");
  process.exit(1);
}
content = content.replace(oldConst, newConst);

// 2. Skip ignored files during walk()
const oldWalk = `    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);`;
const newWalk = `    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && !isIgnoredFile(entry.name)) out.push(full);`;

if (!content.includes(oldWalk)) {
  console.error("❌ could not find walk() body — aborting (no changes written)");
  process.exit(1);
}
content = content.replace(oldWalk, newWalk);

// 3. Skip content read (lineCount/hash) for binary extensions
const oldIndexOne = `  let lineCount = null;
  let hash = null;
  try {
    const content = fs.readFileSync(absPath, "utf8");
    lineCount = content.split("\\n").length;
    hash = hashFile(content);
  } catch {
    // binary/unreadable — keep metadata, skip content-derived fields
  }`;

const newIndexOne = `  let lineCount = null;
  let hash = null;
  if (!BINARY_EXTENSIONS.has(ext)) {
    try {
      const content = fs.readFileSync(absPath, "utf8");
      lineCount = content.split("\\n").length;
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
  }`;

if (!content.includes(oldIndexOne)) {
  console.error("❌ could not find indexOne() content-read block — aborting (no changes written)");
  process.exit(1);
}
content = content.replace(oldIndexOne, newIndexOne);

fs.writeFileSync(cdcPath, content);
console.log("✅ [src/ai/codeDataCenter.mjs] added IGNORE_FILE_PATTERNS (secrets/backups excluded)");
console.log("✅ [src/ai/codeDataCenter.mjs] added BINARY_EXTENSIONS (correct hash, no fake lineCount)");

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
