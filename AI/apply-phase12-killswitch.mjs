import fs from "node:fs";

console.log("=== PHASE 12: Kill Switch (emergency stop) ===");

// ---- killswitch.mjs already created manually — verify it exists ----
if (!fs.existsSync("src/ai/killswitch.mjs")) {
  console.error("ABORT: src/ai/killswitch.mjs not found — create it first");
  process.exit(1);
}
console.log("OK: src/ai/killswitch.mjs already exists");

// ---- permission.mjs: register system.kill / system.resume ----
const permPath = "src/ai/permission.mjs";
let perm = fs.readFileSync(permPath, "utf8");
if (perm.includes('"system.kill"')) {
  console.log("SKIP: permission.mjs already has system.kill");
} else {
  const anchor =
    '  // Phase 14 (spec 4.13): mock only to test the pipeline — no real effect\n' +
    '  "approval.test.high-risk": { permission: "system.modify", risk: RISK.HIGH },\n' +
    "};";
  if (!perm.includes(anchor)) {
    console.error("ABORT: could not find REGISTRY closing anchor in permission.mjs");
    process.exit(1);
  }
  const addition =
    anchor.replace(
      "};",
      '  // Phase 12: emergency stop / resume. MEDIUM = auto-ALLOW so kill is instant.\n' +
      '  // TODO: raise "system.resume" to RISK.HIGH once execute-after-approval\n' +
      '  // pipeline exists for real (non-mock) actions.\n' +
      '  "system.kill": { permission: "system.modify", risk: RISK.MEDIUM },\n' +
      '  "system.resume": { permission: "system.modify", risk: RISK.MEDIUM },\n' +
      "};"
    );
  perm = perm.replace(anchor, addition);
  fs.writeFileSync(permPath, perm);
  console.log("OK: permission.mjs — registered system.kill / system.resume");
}

// ---- api.mjs: import + policy() guard + routes ----
let api = fs.readFileSync("src/ai/api.mjs", "utf8");
if (api.includes("/api/system/kill")) {
  console.log("SKIP: api.mjs already wired for kill switch");
} else {
  // 1. import
  const oldImport = 'import { emit, getAllTasks, getTask, getEvents } from "./tasks.mjs";';
  if (!api.includes(oldImport)) {
    console.error("ABORT: could not find tasks.mjs import in api.mjs");
    process.exit(1);
  }
  const newImport =
    oldImport +
    '\nimport { isKilled, activateKillSwitch, deactivateKillSwitch, getKillSwitchStatus } from "./killswitch.mjs";';
  api = api.replace(oldImport, newImport);

  // 2. policy() guard — block actions while killed (except kill/resume themselves)
  const policyAnchor =
    "function policy(action) {\n" +
    "  return (req, res, next) => {\n" +
    "    const actor = actorOf(req);\n" +
    "    const rec = policyCheck(action, actor);";
  if (!api.includes(policyAnchor)) {
    console.error("ABORT: could not find policy() function body in api.mjs");
    process.exit(1);
  }
  const policyAddition =
    "function policy(action) {\n" +
    "  return (req, res, next) => {\n" +
    "    const actor = actorOf(req);\n" +
    '    if (isKilled() && action !== "system.kill" && action !== "system.resume") {\n' +
    '      return res.status(503).json({ error: "ប្រព័ន្ធត្រូវបានផ្អាក (kill switch active)", action });\n' +
    "    }\n" +
    "    const rec = policyCheck(action, actor);";
  api = api.replace(policyAnchor, policyAddition);

  // 3. routes
  const anchor2 = 'app.get("/api/audit", guard, (req, res) => {';
  if (!api.includes(anchor2)) {
    console.error("ABORT: could not find /api/audit anchor in api.mjs");
    process.exit(1);
  }
  const routeAddition = [
    "  // ---- Phase 12: Kill Switch (emergency stop) ----",
    '  app.get("/api/system/status", guard, (req, res) => {',
    "    res.json(getKillSwitchStatus());",
    "  });",
    "",
    '  app.post("/api/system/kill", guard, policy("system.kill"), wrap((req) => {',
    '    const reason = String(req.body?.reason || "manual");',
    "    return activateKillSwitch(reason);",
    "  }));",
    "",
    '  app.post("/api/system/resume", guard, policy("system.resume"), wrap(() => {',
    "    return deactivateKillSwitch();",
    "  }));",
    "",
  ].join("\n");
  api = api.replace(anchor2, routeAddition + anchor2);

  fs.writeFileSync("src/ai/api.mjs", api);
  console.log("OK: api.mjs — added /api/system/status, /api/system/kill, /api/system/resume + policy() guard");
}

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
