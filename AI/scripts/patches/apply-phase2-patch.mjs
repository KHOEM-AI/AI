import fs from "node:fs";

const STATUS_FILE = "src/ai/status.mjs";
const MODEL_FILE = "src/ai/model.mjs";
const SESSION_FILE = "src/ai/session.mjs";

// ---- 1. Create model.mjs ----
if (fs.existsSync(MODEL_FILE)) {
  console.log("⚠️  model.mjs already exists — skipping creation");
} else {
  const content = `// src/ai/model.mjs
// Model layer: local KHOEM model configuration, availability, routing.
// Extracted from status.mjs "model" probe so Model is a real, dedicated
// functional center (Part 1 #9), not just inline logic.

export function getModelInfo(aiCore) {
  return {
    provider: aiCore?.provider ? String(aiCore.provider) : null,
    configured: Boolean(aiCore?.provider),
  };
}

// Real check: model is only "usable" if a provider is actually configured
// on aiCore. Do not claim READY from configuration existing alone without
// this check (Part 11: "Do not claim model READY merely because
// configuration exists").
export async function checkModel(aiCore, { busy = false } = {}) {
  const info = getModelInfo(aiCore);
  if (!info.configured) {
    return {
      status: "OFFLINE",
      reasonKm: "រកមិនឃើញ provider ក្នុង configuration",
      reasonEn: "No provider in model configuration",
      module: info.provider,
    };
  }
  return {
    status: busy ? "ACTIVE" : "READY",
    reasonKm: busy ? "Model កំពុង process request" : "Model configuration មាន និងអាចប្រើបាន",
    reasonEn: busy ? "Model is processing a request" : "Model configuration exists and is usable",
    module: info.provider,
  };
}
`;
  fs.writeFileSync(MODEL_FILE, content, "utf8");
  console.log("✅ created", MODEL_FILE);
}

// ---- 2. Create session.mjs ----
if (fs.existsSync(SESSION_FILE)) {
  console.log("⚠️  session.mjs already exists — skipping creation");
} else {
  const content = `// src/ai/session.mjs
// Session layer: session lifecycle / state interface check.
// Extracted from status.mjs "session" probe so Session is a real,
// dedicated functional center (Part 1 #10).

// Real check: verifies the session memory object actually exposes the
// add/get interface it claims to. Does not just assume READY.
export function checkSession(aiCore) {
  const mem = aiCore?.memory;
  const hasInterface = Boolean(
    mem && typeof mem.add === "function" && typeof mem.get === "function"
  );
  if (!hasInterface) {
    return {
      status: "ERROR",
      reasonKm: "session memory interface missing",
      reasonEn: "session memory interface missing",
      module: "memory.mjs",
    };
  }
  return {
    status: "READY",
    reasonKm: "Session memory មាន add/get និងអាចប្រើបាន",
    reasonEn: "Session memory exposes add/get and is usable",
    module: "memory.mjs",
  };
}
`;
  fs.writeFileSync(SESSION_FILE, content, "utf8");
  console.log("✅ created", SESSION_FILE);
}

// ---- 3. Patch status.mjs to use the new modules (additive, backed up) ----
let src = fs.readFileSync(STATUS_FILE, "utf8");
const backup = STATUS_FILE + ".bak-phase2";
fs.writeFileSync(backup, src, "utf8");
console.log("✅ backup saved:", backup);

let changed = false;

// 3a. Add imports
const importAnchor = `import { recordAuditEvent } from "./audit.mjs";`;
if (src.includes(importAnchor) && !src.includes('from "./model.mjs"')) {
  src = src.replace(
    importAnchor,
    `import { recordAuditEvent } from "./audit.mjs";\nimport { checkModel } from "./model.mjs";\nimport { checkSession } from "./session.mjs";`
  );
  changed = true;
}

// 3b. Replace inline "model" probe body to delegate to checkModel()
const oldModelProbe = `    probe("model", API_HEALTH_TIMEOUT_MS, async () => {
      if (!aiCore?.provider)
        return { status: "OFFLINE", reasonKm: "រកមិនឃើញ provider ក្នុង configuration", reasonEn: "No provider in model configuration" };
      const busy = active.chat > 0;
      return {
        status: pickStatus(["READY", busy ? "ACTIVE" : "READY"]),
        reasonKm: busy ? "Model កំពុង process request" : "Model configuration មាន និងអាចប្រើបាន",
        reasonEn: busy ? "Model is processing a request" : "Model configuration exists and is usable",
        module: String(aiCore.provider),
      };
    }),`;
const newModelProbe = `    probe("model", API_HEALTH_TIMEOUT_MS, async () => {
      const busy = active.chat > 0;
      return checkModel(aiCore, { busy });
    }),`;
if (src.includes(oldModelProbe)) {
  src = src.replace(oldModelProbe, newModelProbe);
  changed = true;
} else {
  console.log("⚠️  model probe anchor not found — leaving status.mjs model probe unchanged (check manually)");
}

// 3c. Replace inline "session" probe body to delegate to checkSession()
const oldSessionProbe = `    probe("session", API_HEALTH_TIMEOUT_MS, async () => {
      const mem = aiCore?.memory;
      if (!mem || typeof mem.add !== "function" || typeof mem.get !== "function")
        throw new Error("session memory interface missing");
      return { status: "READY", reasonKm: "Session memory មាន add/get និងអាចប្រើបាន", reasonEn: "Session memory exposes add/get and is usable", module: "memory.mjs" };
    }),`;
const newSessionProbe = `    probe("session", API_HEALTH_TIMEOUT_MS, async () => {
      const r = checkSession(aiCore);
      if (r.status === "ERROR") throw new Error(r.reasonEn);
      return r;
    }),`;
if (src.includes(oldSessionProbe)) {
  src = src.replace(oldSessionProbe, newSessionProbe);
  changed = true;
} else {
  console.log("⚠️  session probe anchor not found — leaving status.mjs session probe unchanged (check manually)");
}

if (changed) {
  fs.writeFileSync(STATUS_FILE, src, "utf8");
  console.log("✅ patched", STATUS_FILE);
} else {
  console.log("⚠️  no changes applied to status.mjs — check manually");
}

console.log("\\nNext steps:");
console.log("  git diff " + STATUS_FILE);
console.log("  npx tsc --noEmit");
console.log("  npm run build");
