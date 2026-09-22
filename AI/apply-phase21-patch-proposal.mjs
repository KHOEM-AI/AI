import fs from "node:fs";

console.log("=== PHASE 21: Safe Code Patch Proposal (spec Part 3) ===");

if (!fs.existsSync("src/ai/patch.mjs")) {
  console.error("ABORT: src/ai/patch.mjs not found — create it first");
  process.exit(1);
}
console.log("OK: src/ai/patch.mjs already exists");

// ---- permission.mjs: register code.proposePatch / code.applyPatch ----
const permPath = "src/ai/permission.mjs";
let perm = fs.readFileSync(permPath, "utf8");
if (perm.includes('"code.applyPatch"')) {
  console.log("SKIP: permission.mjs already has code.applyPatch");
} else {
  const anchor =
    '  "code.sandboxTest": { permission: "tool.execute", risk: RISK.MEDIUM },\n' +
    "};";
  if (!perm.includes(anchor)) {
    console.error("ABORT: could not find REGISTRY closing anchor (after code.sandboxTest) in permission.mjs");
    process.exit(1);
  }
  const addition =
    anchor.replace(
      "};",
      '  // Phase 21: proposing a patch only runs it in sandbox (no production\n' +
      '  // write) so MEDIUM/auto-ALLOW is safe. Applying it is a real write to\n' +
      '  // src/ and always requires human approval regardless of sandbox result.\n' +
      '  "code.proposePatch": { permission: "tool.execute", risk: RISK.MEDIUM },\n' +
      '  "code.applyPatch": { permission: "code.write", risk: RISK.HIGH },\n' +
      "};"
    );
  perm = perm.replace(anchor, addition);
  fs.writeFileSync(permPath, perm);
  console.log("OK: permission.mjs — registered code.proposePatch / code.applyPatch");
}

// ---- api.mjs: import + routes ----
let api = fs.readFileSync("src/ai/api.mjs", "utf8");
if (api.includes("/api/patch/propose")) {
  console.log("SKIP: api.mjs already wired for patch proposal");
} else {
  const oldImport = 'import { runSandboxTest } from "./sandbox.mjs";';
  if (!api.includes(oldImport)) {
    console.error("ABORT: could not find sandbox.mjs import in api.mjs");
    process.exit(1);
  }
  const newImport =
    oldImport +
    '\nimport { proposePatch, getProposal, listProposals, applyPatch } from "./patch.mjs";';
  api = api.replace(oldImport, newImport);

  const anchor2 = 'app.get("/api/audit", guard, (req, res) => {';
  if (!api.includes(anchor2)) {
    console.error("ABORT: could not find /api/audit anchor in api.mjs");
    process.exit(1);
  }
  const routeAddition = [
    "  // ---- Phase 21: Safe Code Patch Proposal (propose -> approve -> apply) ----",
    '  app.post("/api/patch/propose", guard, policy("code.proposePatch"), wrap((req) => {',
    '    const { relPath, newContent, reason } = req.body || {};',
    '    if (!relPath || typeof newContent !== "string") {',
    '      throw bad("relPath and newContent (string) are required");',
    "    }",
    "    return proposePatch({ relPath, newContent, reason, actor: actorOf(req) });",
    "  }));",
    "",
    '  app.get("/api/patch/proposals", guard, (req, res) => {',
    "    res.json({ proposals: listProposals() });",
    "  });",
    "",
    '  app.get("/api/patch/proposals/:id", guard, (req, res) => {',
    "    const p = getProposal(req.params.id);",
    '    if (!p) return res.status(404).json({ error: "រកមិនឃើញ proposal" });',
    "    res.json({ proposal: p });",
    "  });",
    "",
    '  app.post("/api/patch/apply", guard, wrap((req) => {',
    '    const { proposalId, approvalId } = req.body || {};',
    '    if (!proposalId || !approvalId) throw bad("proposalId and approvalId are required");',
    "    const result = applyPatch(proposalId, approvalId, actorOf(req));",
    '    if (!result.ok) throw bad(result.error, 409);',
    "    return result;",
    "  }));",
    "",
  ].join("\n");
  api = api.replace(anchor2, routeAddition + anchor2);

  fs.writeFileSync("src/ai/api.mjs", api);
  console.log("OK: api.mjs — added POST /api/patch/propose, GET /api/patch/proposals[/:id], POST /api/patch/apply");
}

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
