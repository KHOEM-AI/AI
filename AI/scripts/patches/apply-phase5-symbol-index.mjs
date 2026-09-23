import fs from "node:fs";

console.log("=== PHASE 5: Symbol Index (functions/classes/exports/imports) ===");

const cdcPath = "src/ai/codeDataCenter.mjs";
let content = fs.readFileSync(cdcPath, "utf8");

if (content.includes("extractSymbols")) {
  console.log("SKIP: already patched");
  process.exit(0);
}

const extractorLines = [
  "",
  "const CODE_EXTENSIONS = new Set([\".mjs\", \".js\", \".ts\", \".tsx\", \".jsx\"]);",
  "",
  "const RE_FUNCTION = /(?:export\\s+)?(?:async\\s+)?function\\s+([A-Za-z_$][\\w$]*)/g;",
  "const RE_CLASS = /(?:export\\s+)?class\\s+([A-Za-z_$][\\w$]*)/g;",
  "const RE_CONST_FN = /export\\s+const\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*(?:async\\s*)?\\(/g;",
  "const RE_NAMED_EXPORT = /export\\s+\\{([^}]+)\\}/g;",
  "const RE_DEFAULT_EXPORT = /export\\s+default\\s+([A-Za-z_$][\\w$]*)/g;",
  "const RE_IMPORT = /import\\s+(?:[\\w$*{},\\s]+)\\s+from\\s+[\"']([^\"']+)[\"']/g;",
  "const RE_INTERFACE = /(?:export\\s+)?interface\\s+([A-Za-z_$][\\w$]*)/g;",
  "const RE_TYPE = /(?:export\\s+)?type\\s+([A-Za-z_$][\\w$]*)\\s*=/g;",
  "",
  "function matchAll(re, text) {",
  "  const out = [];",
  "  let m;",
  "  re.lastIndex = 0;",
  "  while ((m = re.exec(text)) !== null) out.push(m[1]);",
  "  return out;",
  "}",
  "",
  "export function extractSymbols(absPath, source) {",
  "  const functions = matchAll(RE_FUNCTION, source).concat(matchAll(RE_CONST_FN, source));",
  "  const classes = matchAll(RE_CLASS, source);",
  "  const interfaces = matchAll(RE_INTERFACE, source);",
  "  const types = matchAll(RE_TYPE, source);",
  "  const defaultExport = matchAll(RE_DEFAULT_EXPORT, source)[0] || null;",
  "  const namedExportGroups = matchAll(RE_NAMED_EXPORT, source);",
  "  const namedExports = namedExportGroups",
  "    .flatMap((g) => g.split(\",\"))",
  "    .map((s) => s.trim().split(/\\s+as\\s+/)[0].trim())",
  "    .filter(Boolean);",
  "  const imports = matchAll(RE_IMPORT, source);",
  "  const exportedFns = functions.filter((f) => source.includes(\"export function \" + f) || source.includes(\"export const \" + f));",
  "  const exportedClasses = classes.filter((c) => source.includes(\"export class \" + c));",
  "  const allExports = namedExports.concat(exportedFns, exportedClasses);",
  "  if (defaultExport) allExports.push(\"default:\" + defaultExport);",
  "  return {",
  "    functions: [...new Set(functions)],",
  "    classes: [...new Set(classes)],",
  "    interfaces: [...new Set(interfaces)],",
  "    types: [...new Set(types)],",
  "    exports: [...new Set(allExports)],",
  "    imports: [...new Set(imports)],",
  "  };",
  "}",
  "",
].join("\n");

const anchorConst = "let fileIndex = [];";
if (!content.includes(anchorConst)) {
  console.error("ABORT: could not find 'let fileIndex = [];' anchor");
  process.exit(1);
}
content = content.replace(anchorConst, extractorLines + anchorConst);

// declare 'symbols' variable alongside lineCount/hash
const oldDecl = "  let lineCount = null;\n  let hash = null;";
const newDecl = "  let lineCount = null;\n  let hash = null;\n  let symbols = null;";
if (!content.includes(oldDecl)) {
  console.error("ABORT: could not find lineCount/hash declaration");
  process.exit(1);
}
content = content.replace(oldDecl, newDecl);

// attach symbols when reading text content succeeds (inside the try block for non-binary files)
const oldTry =
  "    try {\n" +
  "      const content = fs.readFileSync(absPath, \"utf8\");\n" +
  "      lineCount = content.split(\"\\n\").length;\n" +
  "      hash = hashFile(content);\n" +
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
  "    } catch {\n" +
  "      // unreadable — keep metadata, skip content-derived fields\n" +
  "    }\n" +
  "  } else {";
if (!content.includes(oldTry)) {
  console.error("ABORT: could not find text-read try block");
  process.exit(1);
}
content = content.replace(oldTry, newTry);

// add 'symbols' to returned object
const oldReturn = "    module: rel.split(path.sep)[0] || rel,\n    status: \"indexed\",\n  };";
const newReturn = "    module: rel.split(path.sep)[0] || rel,\n    status: \"indexed\",\n    symbols,\n  };";
if (!content.includes(oldReturn)) {
  console.error("ABORT: could not find return object in indexOne()");
  process.exit(1);
}
content = content.replace(oldReturn, newReturn);

// add findSymbol() + getSymbolIndex() after findFile()
const findFileBlock = "export function findFile(relPath) {\n  return fileIndex.find((f) => f.path === relPath) || null;\n}";
const queryLines = [
  "",
  "export function findSymbol(name) {",
  "  const hits = [];",
  "  for (const f of fileIndex) {",
  "    if (!f.symbols) continue;",
  "    for (const kind of [\"functions\", \"classes\", \"interfaces\", \"types\", \"exports\"]) {",
  "      if (f.symbols[kind] && f.symbols[kind].includes(name)) hits.push({ path: f.path, kind, name });",
  "    }",
  "  }",
  "  return hits;",
  "}",
  "",
  "export function getSymbolIndex() {",
  "  return fileIndex.filter((f) => f.symbols).map((f) => ({ path: f.path, ...f.symbols }));",
  "}",
].join("\n");
if (!content.includes(findFileBlock)) {
  console.error("ABORT: could not find findFile() export");
  process.exit(1);
}
content = content.replace(findFileBlock, findFileBlock + "\n" + queryLines);

fs.writeFileSync(cdcPath, content);
console.log("OK: codeDataCenter.mjs — added extractSymbols(), findSymbol(), getSymbolIndex()");

// ---- api.mjs: add /api/code/symbols + /api/code/symbol ----
let api = fs.readFileSync("src/ai/api.mjs", "utf8");
if (api.includes("/api/code/symbols")) {
  console.log("SKIP: api.mjs already wired");
} else {
  const anchor =
    "app.post(\"/api/code/scan\", guard, wrap(async () => {\n" +
    "    const cdc = await import(\"./codeDataCenter.mjs\");\n" +
    "    return cdc.scanRepo();\n" +
    "  }));\n";
  if (!api.includes(anchor)) {
    console.error("ABORT: could not find /api/code/scan block in api.mjs");
    process.exit(1);
  }
  const addition = [
    "",
    "  app.get(\"/api/code/symbols\", guard, wrap(async () => {",
    "    const cdc = await import(\"./codeDataCenter.mjs\");",
    "    if (!cdc.isReady()) cdc.scanRepo();",
    "    return { files: cdc.getSymbolIndex() };",
    "  }));",
    "",
    "  app.get(\"/api/code/symbol\", guard, wrap(async (req) => {",
    "    if (!req.query.name) throw bad(\"ត្រូវការ ?name=ឈ្មោះ symbol\");",
    "    const cdc = await import(\"./codeDataCenter.mjs\");",
    "    if (!cdc.isReady()) cdc.scanRepo();",
    "    return { name: req.query.name, hits: cdc.findSymbol(req.query.name) };",
    "  }));",
    "",
  ].join("\n");
  api = api.replace(anchor, anchor + addition);
  fs.writeFileSync("src/ai/api.mjs", api);
  console.log("OK: api.mjs — added GET /api/code/symbols and GET /api/code/symbol?name=");
}

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
