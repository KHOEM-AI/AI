import fs from "node:fs";

console.log("=== PHASE 22: Testing + Verification Pipeline (spec Part 4.6) ===");

if (!fs.existsSync("src/ai/verification.mjs")) {
  console.error("ABORT: src/ai/verification.mjs not found — create it first");
  process.exit(1);
}
console.log("OK: src/ai/verification.mjs already exists");

const permPath = "src/ai/permission.mjs";
let perm = fs.readFileSync(permPath, "utf8");
if (perm.includes('"code.verify"')) {
  console.log("SKIP: permission.mjs already has code.verify");
} else {
  const anchor =
    '  "code.applyPatch": { permission: "code.write", risk: RISK.HIGH },\n' +
    "};";
  if (!perm.includes(anchor)) {
    console.error("ABORT: could not find REGISTRY closing anchor (after code.applyPatch) in permission.mjs");
    process.exit(1);
  }
  const addition = anchor.replace(
    "};",
    '  // Phase 22 verification (tsc/build/tests):\n' +
    '  // - cannot modify source files\n' +
    '  // - may generate temporary/runtime test artifacts (e.g. audit-log.test.jsonl)\n' +
    '  // - cannot perform production actions\n' +
    '  // - cannot bypass permission/policy checks\n' +
    '  "code.verify": { permission: "tool.execute", risk: RISK.LOW },\n' +
    "};"
  );
  perm = perm.replace(anchor, addition);
  fs.writeFileSync(permPath, perm);
  console.log("OK: permission.mjs — registered code.verify");
}

let api = fs.readFileSync("src/ai/api.mjs", "utf8");
if (api.includes("/api/verify")) {
  console.log("SKIP: api.mjs already wired for verification");
} else {
  const oldImport = 'import { proposePatch, getProposal, listProposals, applyPatch } from "./patch.mjs";';
  if (!api.includes(oldImport)) {
    console.error("ABORT: could not find patch.mjs import in api.mjs");
    process.exit(1);
  }
  const newImport = oldImport + '\nimport { runVerification, getLastVerification, listVerifications } from "./verification.mjs";';
  api = api.replace(oldImport, newImport);

  const anchor2 = 'app.get("/api/audit", guard, (req, res) => {';
  if (!api.includes(anchor2)) {
    console.error("ABORT: could not find /api/audit anchor in api.mjs");
    process.exit(1);
  }
  const routeAddition = [
    "  // ---- Phase 22: Testing + Verification Pipeline (evidence-based) ----",
    '  app.post("/api/verify", guard, policy("code.verify"), wrap((req) => {',
    '    return runVerification(String(req.body?.reason || "manual"));',
    "  }));",
    "",
    '  app.get("/api/verify/last", guard, (req, res) => {',
    "    res.json({ verification: getLastVerification() });",
    "  });",
    "",
    '  app.get("/api/verify/history", guard, (req, res) => {',
    "    res.json({ history: listVerifications() });",
    "  });",
    "",
  ].join("\n");
  api = api.replace(anchor2, routeAddition + anchor2);

  fs.writeFileSync("src/ai/api.mjs", api);
  console.log("OK: api.mjs — added POST /api/verify, GET /api/verify/last, GET /api/verify/history");
}

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
