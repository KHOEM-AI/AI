import fs from "node:fs";

console.log("=== PHASE 8: Version / Provenance ===");

const cdcPath = "src/ai/codeDataCenter.mjs";
let content = fs.readFileSync(cdcPath, "utf8");

if (content.includes("getGitInfo")) {
  console.log("SKIP: already patched");
  process.exit(0);
}

// 1. Add INDEX_VERSION + getGitInfo() right after ROOT declaration
const oldRoot = "const ROOT = process.cwd();";
const newRoot = [
  "const ROOT = process.cwd();",
  "",
  "// Phase 8: Version/Provenance (spec Part 2.E)",
  "const INDEX_VERSION = \"1.0.0\";",
  "",
  "function getGitInfo() {",
  "  try {",
  "    const commit = execSync(\"git rev-parse HEAD\", { cwd: ROOT }).toString().trim();",
  "    const branch = execSync(\"git rev-parse --abbrev-ref HEAD\", { cwd: ROOT }).toString().trim();",
  "    return { commit, branch };",
  "  } catch {",
  "    return { commit: null, branch: null };",
  "  }",
  "}",
].join("\n");
if (!content.includes(oldRoot)) {
  console.error("ABORT: could not find ROOT declaration");
  process.exit(1);
}
content = content.replace(oldRoot, newRoot);

// 2. Include git info + index version in scanRepo() return
const oldReturn = "return { fileCount: fileIndex.length, scannedAt: lastScan };";
const newReturnScan =
  "const git = getGitInfo();\n" +
  "  return {\n" +
  "    fileCount: fileIndex.length,\n" +
  "    scannedAt: lastScan,\n" +
  "    indexVersion: INDEX_VERSION,\n" +
  "    gitCommit: git.commit,\n" +
  "    gitBranch: git.branch,\n" +
  "  };";
if (!content.includes(oldReturn)) {
  console.error("ABORT: could not find scanRepo() return statement");
  process.exit(1);
}
content = content.replace(oldReturn, newReturnScan);

// 3. Include index version + git info in getFileIndex() too, for provenance on read
const oldGetIndex = "export function getFileIndex() {\n  return { scannedAt: lastScan, files: fileIndex };\n}";
const newGetIndex =
  "export function getFileIndex() {\n" +
  "  const git = getGitInfo();\n" +
  "  return {\n" +
  "    scannedAt: lastScan,\n" +
  "    indexVersion: INDEX_VERSION,\n" +
  "    gitCommit: git.commit,\n" +
  "    gitBranch: git.branch,\n" +
  "    files: fileIndex,\n" +
  "  };\n" +
  "}";
if (!content.includes(oldGetIndex)) {
  console.error("ABORT: could not find getFileIndex() function");
  process.exit(1);
}
content = content.replace(oldGetIndex, newGetIndex);

fs.writeFileSync(cdcPath, content);
console.log("OK: codeDataCenter.mjs — added getGitInfo(), INDEX_VERSION, wired into scanRepo()/getFileIndex()");

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
