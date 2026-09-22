import fs from "node:fs";
import path from "node:path";

console.log("=== PHASE 6: Dependency Graph ===");

const cdcPath = "src/ai/codeDataCenter.mjs";
let content = fs.readFileSync(cdcPath, "utf8");

if (content.includes("buildDependencyGraph")) {
  console.log("SKIP: already patched");
  process.exit(0);
}

// 1. Add dependencyGraph state + builder functions right after lastScan declaration
const oldState = "let fileIndex = [];\nlet lastScan = null;";
const graphLines = [
  "let fileIndex = [];",
  "let lastScan = null;",
  "let dependencyGraph = null;",
  "",
  "function resolveImportPath(fromRelPath, importPath) {",
  "  if (!importPath.startsWith(\".\")) return null; // skip bare/package imports (node_modules)",
  "  const fromDir = path.dirname(fromRelPath);",
  "  const base = path.normalize(path.join(fromDir, importPath));",
  "  const exts = [...CODE_EXTENSIONS];",
  "  const candidates = [",
  "    base,",
  "    ...exts.map((e) => base + e),",
  "    ...exts.map((e) => path.join(base, \"index\" + e)),",
  "  ];",
  "  for (const c of candidates) {",
  "    if (fileIndex.some((f) => f.path === c)) return c;",
  "  }",
  "  return null;",
  "}",
  "",
  "function buildDependencyGraph() {",
  "  const deps = {};",
  "  const dependents = {};",
  "  for (const f of fileIndex) {",
  "    if (!f.symbols || !f.symbols.imports) continue;",
  "    const resolved = [];",
  "    for (const imp of f.symbols.imports) {",
  "      const r = resolveImportPath(f.path, imp);",
  "      if (r) resolved.push(r);",
  "    }",
  "    deps[f.path] = resolved;",
  "    for (const r of resolved) {",
  "      if (!dependents[r]) dependents[r] = [];",
  "      dependents[r].push(f.path);",
  "    }",
  "  }",
  "  dependencyGraph = { deps, dependents, builtAt: new Date().toISOString() };",
  "}",
  "",
  "function detectCircular() {",
  "  if (!dependencyGraph) return [];",
  "  const deps = dependencyGraph.deps;",
  "  const color = {};",
  "  const stack = [];",
  "  const cycles = [];",
  "  function visit(node) {",
  "    color[node] = 1;",
  "    stack.push(node);",
  "    for (const dep of deps[node] || []) {",
  "      if (color[dep] === 1) {",
  "        const idx = stack.indexOf(dep);",
  "        cycles.push(stack.slice(idx).concat(dep));",
  "      } else if (!color[dep]) {",
  "        visit(dep);",
  "      }",
  "    }",
  "    stack.pop();",
  "    color[node] = 2;",
  "  }",
  "  for (const node of Object.keys(deps)) {",
  "    if (!color[node]) visit(node);",
  "  }",
  "  return cycles;",
  "}",
].join("\n");

if (!content.includes(oldState)) {
  console.error("ABORT: could not find fileIndex/lastScan declaration");
  process.exit(1);
}
content = content.replace(oldState, graphLines);

// 2. Trigger graph build inside scanRepo()
const oldScan = "fileIndex = files.map(indexOne);\n  lastScan = new Date().toISOString();";
const newScan = "fileIndex = files.map(indexOne);\n  dependencyGraph = null;\n  buildDependencyGraph();\n  lastScan = new Date().toISOString();";
if (!content.includes(oldScan)) {
  console.error("ABORT: could not find scanRepo() body");
  process.exit(1);
}
content = content.replace(oldScan, newScan);

// 3. Add public getters after getSymbolIndex()
const anchor = "export function getSymbolIndex() {\n  return fileIndex.filter((f) => f.symbols).map((f) => ({ path: f.path, ...f.symbols }));\n}";
const getters = [
  "",
  "export function getDependencyGraph() {",
  "  if (!dependencyGraph) buildDependencyGraph();",
  "  return dependencyGraph;",
  "}",
  "",
  "export function getDependencies(relPath) {",
  "  if (!dependencyGraph) buildDependencyGraph();",
  "  return dependencyGraph.deps[relPath] || [];",
  "}",
  "",
  "export function getDependents(relPath) {",
  "  if (!dependencyGraph) buildDependencyGraph();",
  "  return dependencyGraph.dependents[relPath] || [];",
  "}",
  "",
  "export function getCircularDependencies() {",
  "  if (!dependencyGraph) buildDependencyGraph();",
  "  return detectCircular();",
  "}",
].join("\n");
if (!content.includes(anchor)) {
  console.error("ABORT: could not find getSymbolIndex() export");
  process.exit(1);
}
content = content.replace(anchor, anchor + "\n" + getters);

fs.writeFileSync(cdcPath, content);
console.log("OK: codeDataCenter.mjs — added buildDependencyGraph/getDependencies/getDependents/getCircularDependencies");

// ---- api.mjs: add endpoints before /api/audit ----
let api = fs.readFileSync("src/ai/api.mjs", "utf8");
if (api.includes("/api/code/dependencies")) {
  console.log("SKIP: api.mjs already wired");
} else {
  const anchor2 = 'app.get("/api/audit", guard, (req, res) => {';
  if (!api.includes(anchor2)) {
    console.error("ABORT: could not find /api/audit anchor in api.mjs");
    process.exit(1);
  }
  const addition = [
    "app.get(\"/api/code/dependencies\", guard, wrap(async (req) => {",
    "    if (!req.query.file) throw bad(\"ត្រូវការ ?file=src/...\");",
    "    const cdc = await import(\"./codeDataCenter.mjs\");",
    "    if (!cdc.isReady()) cdc.scanRepo();",
    "    return { file: req.query.file, dependencies: cdc.getDependencies(req.query.file) };",
    "  }));",
    "",
    "  app.get(\"/api/code/dependents\", guard, wrap(async (req) => {",
    "    if (!req.query.file) throw bad(\"ត្រូវការ ?file=src/...\");",
    "    const cdc = await import(\"./codeDataCenter.mjs\");",
    "    if (!cdc.isReady()) cdc.scanRepo();",
    "    return { file: req.query.file, dependents: cdc.getDependents(req.query.file) };",
    "  }));",
    "",
    "  app.get(\"/api/code/circular\", guard, wrap(async () => {",
    "    const cdc = await import(\"./codeDataCenter.mjs\");",
    "    if (!cdc.isReady()) cdc.scanRepo();",
    "    return { cycles: cdc.getCircularDependencies() };",
    "  }));",
    "",
    "  ",
  ].join("\n");
  api = api.replace(anchor2, addition + anchor2);
  fs.writeFileSync("src/ai/api.mjs", api);
  console.log("OK: api.mjs — added /api/code/dependencies, /api/code/dependents, /api/code/circular");
}

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
