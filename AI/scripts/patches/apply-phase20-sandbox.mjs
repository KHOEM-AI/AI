import fs from "node:fs";

console.log("=== PHASE 20: Sandbox (spec Part 7) ===");

if (!fs.existsSync("src/ai/sandbox.mjs")) {
  console.error("ABORT: src/ai/sandbox.mjs not found — create it first");
  process.exit(1);
}
console.log("OK: src/ai/sandbox.mjs already exists");

// ---- permission.mjs: register code.sandboxTest ----
const permPath = "src/ai/permission.mjs";
let perm = fs.readFileSync(permPath, "utf8");
if (perm.includes('"code.sandboxTest"')) {
  console.log("SKIP: permission.mjs already has code.sandboxTest");
} else {
  const anchor =
    '  "rollback.plan": { permission: "system.read", risk: RISK.LOW },\n' +
    "};";
  if (!perm.includes(anchor)) {
    console.error("ABORT: could not find REGISTRY closing anchor (after rollback.plan) in permission.mjs");
    process.exit(1);
  }
  const addition =
    anchor.replace(
      "};",
      '  // Phase 20: sandbox tests run against a temp copy only — production\n' +
      '  // is never touched, so MEDIUM/auto-ALLOW is appropriate. Applying a\n' +
      '  // verified sandbox result to production (Phase 21) will be HIGH risk.\n' +
      '  "code.sandboxTest": { permission: "tool.execute", risk: RISK.MEDIUM },\n' +
      "};"
    );
  perm = perm.replace(anchor, addition);
  fs.writeFileSync(permPath, perm);
  console.log("OK: permission.mjs — registered code.sandboxTest");
}

// ---- api.mjs: import + route ----
let api = fs.readFileSync("src/ai/api.mjs", "utf8");
if (api.includes("/api/sandbox/test")) {
  console.log("SKIP: api.mjs already wired for sandbox");
} else {
  const oldImport =
    'import { createSnapshot, listSnapshots, getSnapshot, buildRollbackPlan } from "./rollback.mjs";';
  if (!api.includes(oldImport)) {
    console.error("ABORT: could not find rollback.mjs import in api.mjs");
    process.exit(1);
  }
  const newImport = oldImport + '\nimport { runSandboxTest } from "./sandbox.mjs";';
  api = api.replace(oldImport, newImport);

  const anchor2 = 'app.get("/api/audit", guard, (req, res) => {';
  if (!api.includes(anchor2)) {
    console.error("ABORT: could not find /api/audit anchor in api.mjs");
    process.exit(1);
  }
  const routeAddition = [
    "  // ---- Phase 20: Sandbox (proposed change tested in temp copy only) ----",
    '  app.post("/api/sandbox/test", guard, policy("code.sandboxTest"), wrap((req) => {',
    '    const { relPath, newContent, reason } = req.body || {};',
    '    if (!relPath || typeof newContent !== "string") {',
    '      throw bad("relPath and newContent (string) are required");',
    "    }",
    "    return runSandboxTest({ relPath, newContent, reason });",
    "  }));",
    "",
  ].join("\n");
  api = api.replace(anchor2, routeAddition + anchor2);

  fs.writeFileSync("src/ai/api.mjs", api);
  console.log("OK: api.mjs — added POST /api/sandbox/test");
}

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
