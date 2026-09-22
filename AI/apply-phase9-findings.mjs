import fs from "node:fs";

console.log("=== PHASE 9: Code Findings API ===");

const cdcPath = "src/ai/codeDataCenter.mjs";
let content = fs.readFileSync(cdcPath, "utf8");

if (content.includes("getFindings")) {
  console.log("SKIP: already patched");
  process.exit(0);
}

const anchor =
  "  return {\n" +
  "    checkedAt: new Date().toISOString(),\n" +
  "    build: { ok: tsOk, errorCount: tsErrorCount },\n" +
  "    todoCount,\n" +
  "    fixmeCount,\n" +
  "    oversizedFiles,\n" +
  "  };\n" +
  "}";

if (!content.includes(anchor)) {
  console.error("ABORT: could not find getCodeHealth() closing block");
  process.exit(1);
}

const findingsFn = [
  "",
  "function makeFindingId(category, detail) {",
  "  return category + \"-\" + crypto.createHash(\"sha1\").update(detail).digest(\"hex\").slice(0, 8);",
  "}",
  "",
  "// Phase 9: Code Findings API (spec Part 2.F + Part 3)",
  "// READ-ONLY analysis. suggestedFix is textual guidance for a human/AI to act on —",
  "// this function never modifies files. Actual patch proposal + sandbox + approval",
  "// come at later phases (20-22) per spec Part 18.",
  "export function getFindings() {",
  "  if (!fileIndex.length) scanRepo();",
  "  const findings = [];",
  "  const health = getCodeHealth();",
  "",
  "  if (!health.build.ok) {",
  "    findings.push({",
  "      id: makeFindingId(\"build\", \"typescript\"),",
  "      severity: \"CRITICAL\",",
  "      category: \"build\",",
  "      file: null,",
  "      line: null,",
  "      evidence: health.build.errorCount + \" TypeScript error(s) reported by tsc --noEmit\",",
  "      explanation: \"The project does not currently type-check cleanly.\",",
  "      suggestedFix: \"Run npx tsc --noEmit locally to see full errors and fix each reported type issue.\",",
  "      verificationStatus: \"VERIFIED\",",
  "    });",
  "  }",
  "",
  "  for (const f of health.oversizedFiles) {",
  "    findings.push({",
  "      id: makeFindingId(\"oversized\", f.path),",
  "      severity: f.lineCount > 1000 ? \"MEDIUM\" : \"LOW\",",
  "      category: \"maintainability\",",
  "      file: f.path,",
  "      line: null,",
  "      evidence: \"File has \" + f.lineCount + \" lines (threshold: 500)\",",
  "      explanation: \"Large files are harder to review, test, and maintain.\",",
  "      suggestedFix: \"Identify logically separable responsibilities in this file and extract them into smaller, focused modules.\",",
  "      verificationStatus: \"VERIFIED\",",
  "    });",
  "  }",
  "",
  "  const cycles = getCircularDependencies();",
  "  for (const cycle of cycles) {",
  "    findings.push({",
  "      id: makeFindingId(\"circular\", cycle.join(\">\")),",
  "      severity: \"HIGH\",",
  "      category: \"architecture\",",
  "      file: cycle[0],",
  "      line: null,",
  "      evidence: \"Circular dependency: \" + cycle.join(\" -> \"),",
  "      explanation: \"Circular imports can cause initialization-order bugs and make the dependency graph harder to reason about.\",",
  "      suggestedFix: \"Break the cycle by extracting shared code into a separate module that both sides import without importing each other.\",",
  "      verificationStatus: \"VERIFIED\",",
  "    });",
  "  }",
  "",
  "  if (health.todoCount > 0 || health.fixmeCount > 0) {",
  "    findings.push({",
  "      id: makeFindingId(\"markers\", \"todo-fixme\"),",
  "      severity: \"LOW\",",
  "      category: \"housekeeping\",",
  "      file: null,",
  "      line: null,",
  "      evidence: health.todoCount + \" TODO and \" + health.fixmeCount + \" FIXME marker(s) found across the codebase\",",
  "      explanation: \"Unresolved TODO/FIXME markers may indicate incomplete work or known issues.\",",
  "      suggestedFix: \"Review each marker and either resolve it or convert it into a tracked task.\",",
  "      verificationStatus: \"VERIFIED\",",
  "    });",
  "  }",
  "",
  "  return { generatedAt: new Date().toISOString(), findings };",
  "}",
].join("\n");

content = content.replace(anchor, anchor + "\n" + findingsFn);
fs.writeFileSync(cdcPath, content);
console.log("OK: codeDataCenter.mjs — added getFindings() (build/oversized/circular/todo-fixme, read-only)");

// ---- api.mjs: add /api/code/findings ----
let api = fs.readFileSync("src/ai/api.mjs", "utf8");
if (api.includes("/api/code/findings")) {
  console.log("SKIP: api.mjs already wired");
} else {
  const anchor2 = 'app.get("/api/audit", guard, (req, res) => {';
  if (!api.includes(anchor2)) {
    console.error("ABORT: could not find /api/audit anchor in api.mjs");
    process.exit(1);
  }
  const addition = [
    "app.get(\"/api/code/findings\", guard, wrap(async () => {",
    "    const cdc = await import(\"./codeDataCenter.mjs\");",
    "    return cdc.getFindings();",
    "  }));",
    "",
    "  ",
  ].join("\n");
  api = api.replace(anchor2, addition + anchor2);
  fs.writeFileSync("src/ai/api.mjs", api);
  console.log("OK: api.mjs — added GET /api/code/findings");
}

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
