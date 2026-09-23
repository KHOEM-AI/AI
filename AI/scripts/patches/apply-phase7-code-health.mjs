import fs from "node:fs";

console.log("=== PHASE 7: Code Health ===");

const cdcPath = "src/ai/codeDataCenter.mjs";
let content = fs.readFileSync(cdcPath, "utf8");

if (content.includes("getCodeHealth")) {
  console.log("SKIP: already patched");
  process.exit(0);
}

// 1. Add child_process import
const oldImports = "import fs from \"node:fs\";\nimport path from \"node:path\";\nimport crypto from \"node:crypto\";";
const newImports = "import fs from \"node:fs\";\nimport path from \"node:path\";\nimport crypto from \"node:crypto\";\nimport { execSync } from \"node:child_process\";";
if (!content.includes(oldImports)) {
  console.error("ABORT: could not find import block");
  process.exit(1);
}
content = content.replace(oldImports, newImports);

// 2. Declare todoCount/fixmeCount alongside symbols
const oldDecl = "  let lineCount = null;\n  let hash = null;\n  let symbols = null;";
const newDecl = "  let lineCount = null;\n  let hash = null;\n  let symbols = null;\n  let todoCount = null;\n  let fixmeCount = null;";
if (!content.includes(oldDecl)) {
  console.error("ABORT: could not find lineCount/hash/symbols declaration");
  process.exit(1);
}
content = content.replace(oldDecl, newDecl);

// 3. Count TODO/FIXME while reading text content
const oldTry =
  "    try {\n" +
  "      const content = fs.readFileSync(absPath, \"utf8\");\n" +
  "      lineCount = content.split(\"\\n\").length;\n" +
  "      hash = hashFile(content);\n" +
  "      if (CODE_EXTENSIONS.has(ext)) symbols = extractSymbols(absPath, content);\n" +
  "    } catch {\n" +
  "      // unreadable — keep metadata, skip content-derived fields\n" +
  "    }\n" +
  "  } else {";
const newTry =
  "    try {\n" +
  "      const content = fs.readFileSync(absPath, \"utf8\");\n" +
  "      lineCount = content.split(\"\\n\").length;\n" +
  "      hash = hashFile(content);\n" +
  "      if (CODE_EXTENSIONS.has(ext)) symbols = extractSymbols(absPath, content);\n" +
  "      todoCount = (content.match(/\\bTODO\\b/g) || []).length;\n" +
  "      fixmeCount = (content.match(/\\bFIXME\\b/g) || []).length;\n" +
  "    } catch {\n" +
  "      // unreadable — keep metadata, skip content-derived fields\n" +
  "    }\n" +
  "  } else {";
if (!content.includes(oldTry)) {
  console.error("ABORT: could not find text-read try block");
  process.exit(1);
}
content = content.replace(oldTry, newTry);

// 4. Add todoCount/fixmeCount to returned object
const oldReturn = "    module: rel.split(path.sep)[0] || rel,\n    status: \"indexed\",\n    symbols,\n  };";
const newReturn = "    module: rel.split(path.sep)[0] || rel,\n    status: \"indexed\",\n    symbols,\n    todoCount,\n    fixmeCount,\n  };";
if (!content.includes(oldReturn)) {
  console.error("ABORT: could not find indexOne() return object");
  process.exit(1);
}
content = content.replace(oldReturn, newReturn);

// 5. Add getCodeHealth() after getCircularDependencies()
const anchor = "export function getCircularDependencies() {\n  if (!dependencyGraph) buildDependencyGraph();\n  return detectCircular();\n}";
const healthFn = [
  "",
  "export function getCodeHealth() {",
  "  if (!fileIndex.length) scanRepo();",
  "  let tsOk = true;",
  "  let tsOutput = \"\";",
  "  try {",
  "    execSync(\"npx tsc --noEmit\", { cwd: ROOT, stdio: [\"ignore\", \"pipe\", \"pipe\"], timeout: 60000 });",
  "  } catch (e) {",
  "    tsOk = false;",
  "    tsOutput = String((e.stdout || \"\") + (e.stderr || \"\"));",
  "  }",
  "  const tsErrorCount = tsOutput ? (tsOutput.match(/error TS\\d+/g) || []).length : 0;",
  "",
  "  let todoCount = 0;",
  "  let fixmeCount = 0;",
  "  const oversizedFiles = [];",
  "  for (const f of fileIndex) {",
  "    if (typeof f.todoCount === \"number\") todoCount += f.todoCount;",
  "    if (typeof f.fixmeCount === \"number\") fixmeCount += f.fixmeCount;",
  "    if (typeof f.lineCount === \"number\" && f.lineCount > 500) {",
  "      oversizedFiles.push({ path: f.path, lineCount: f.lineCount });",
  "    }",
  "  }",
  "",
  "  return {",
  "    checkedAt: new Date().toISOString(),",
  "    build: { ok: tsOk, errorCount: tsErrorCount },",
  "    todoCount,",
  "    fixmeCount,",
  "    oversizedFiles,",
  "  };",
  "}",
].join("\n");
if (!content.includes(anchor)) {
  console.error("ABORT: could not find getCircularDependencies() export");
  process.exit(1);
}
content = content.replace(anchor, anchor + "\n" + healthFn);

fs.writeFileSync(cdcPath, content);
console.log("OK: codeDataCenter.mjs — added TODO/FIXME counting + getCodeHealth() (real tsc check)");

// ---- api.mjs: add /api/code/health ----
let api = fs.readFileSync("src/ai/api.mjs", "utf8");
if (api.includes("/api/code/health")) {
  console.log("SKIP: api.mjs already wired");
} else {
  const anchor2 = 'app.get("/api/audit", guard, (req, res) => {';
  if (!api.includes(anchor2)) {
    console.error("ABORT: could not find /api/audit anchor in api.mjs");
    process.exit(1);
  }
  const addition = [
    "app.get(\"/api/code/health\", guard, wrap(async () => {",
    "    const cdc = await import(\"./codeDataCenter.mjs\");",
    "    return cdc.getCodeHealth();",
    "  }));",
    "",
    "  ",
  ].join("\n");
  api = api.replace(anchor2, addition + anchor2);
  fs.writeFileSync("src/ai/api.mjs", api);
  console.log("OK: api.mjs — added GET /api/code/health");
}

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
