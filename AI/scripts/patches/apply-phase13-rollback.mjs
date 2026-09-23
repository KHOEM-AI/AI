import fs from "node:fs";

console.log("=== PHASE 13: Rollback Strategy (snapshot + plan, read-only) ===");

if (!fs.existsSync("src/ai/rollback.mjs")) {
  console.error("ABORT: src/ai/rollback.mjs not found — create it first");
  process.exit(1);
}
console.log("OK: src/ai/rollback.mjs already exists");

// ---- permission.mjs: register rollback.snapshot / rollback.plan ----
const permPath = "src/ai/permission.mjs";
let perm = fs.readFileSync(permPath, "utf8");
if (perm.includes('"rollback.snapshot"')) {
  console.log("SKIP: permission.mjs already has rollback.snapshot");
} else {
  const anchor =
    '  "system.resume": { permission: "system.modify", risk: RISK.MEDIUM },\n' +
    "};";
  if (!perm.includes(anchor)) {
    console.error("ABORT: could not find REGISTRY closing anchor (after system.resume) in permission.mjs");
    process.exit(1);
  }
  const addition =
    anchor.replace(
      "};",
      '  // Phase 13: rollback snapshots/plans are read-only — no destructive\n' +
      '  // execution happens through the API, so LOW risk / auto-ALLOW is safe.\n' +
      '  "rollback.snapshot": { permission: "system.read", risk: RISK.LOW },\n' +
      '  "rollback.plan": { permission: "system.read", risk: RISK.LOW },\n' +
      "};"
    );
  perm = perm.replace(anchor, addition);
  fs.writeFileSync(permPath, perm);
  console.log("OK: permission.mjs — registered rollback.snapshot / rollback.plan");
}

// ---- api.mjs: import + routes ----
let api = fs.readFileSync("src/ai/api.mjs", "utf8");
if (api.includes("/api/rollback")) {
  console.log("SKIP: api.mjs already wired for rollback");
} else {
  const oldImport =
    'import { isKilled, activateKillSwitch, deactivateKillSwitch, getKillSwitchStatus } from "./killswitch.mjs";';
  if (!api.includes(oldImport)) {
    console.error("ABORT: could not find killswitch.mjs import in api.mjs");
    process.exit(1);
  }
  const newImport =
    oldImport +
    '\nimport { createSnapshot, listSnapshots, getSnapshot, buildRollbackPlan } from "./rollback.mjs";';
  api = api.replace(oldImport, newImport);

  const anchor2 = 'app.get("/api/audit", guard, (req, res) => {';
  if (!api.includes(anchor2)) {
    console.error("ABORT: could not find /api/audit anchor in api.mjs");
    process.exit(1);
  }
  const routeAddition = [
    "  // ---- Phase 13: Rollback Strategy (snapshot + plan, read-only) ----",
    '  app.post("/api/rollback/snapshot", guard, policy("rollback.snapshot"), wrap((req) => {',
    '    const reason = String(req.body?.reason || "manual");',
    "    return createSnapshot(reason);",
    "  }));",
    "",
    '  app.get("/api/rollback/snapshots", guard, policy("rollback.plan"), wrap(() => {',
    "    return { snapshots: listSnapshots() };",
    "  }));",
    "",
    '  app.get("/api/rollback/snapshots/:id", guard, policy("rollback.plan"), wrap((req) => {',
    "    const snap = getSnapshot(req.params.id);",
    '    if (!snap) throw bad("រកមិនឃើញ snapshot", 404);',
    "    return snap;",
    "  }));",
    "",
    '  app.get("/api/rollback/plan/:id", guard, policy("rollback.plan"), wrap((req) => {',
    "    const plan = buildRollbackPlan(req.params.id);",
    '    if (!plan) throw bad("រកមិនឃើញ snapshot", 404);',
    "    return plan;",
    "  }));",
    "",
  ].join("\n");
  api = api.replace(anchor2, routeAddition + anchor2);

  fs.writeFileSync("src/ai/api.mjs", api);
  console.log("OK: api.mjs — added /api/rollback/snapshot, /api/rollback/snapshots, /api/rollback/snapshots/:id, /api/rollback/plan/:id");
}

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
