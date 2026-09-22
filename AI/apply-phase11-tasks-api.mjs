import fs from "node:fs";

console.log("=== PHASE 11: Task Engine — list/detail API ===");

const tasksPath = "src/ai/tasks.mjs";
let tasksContent = fs.readFileSync(tasksPath, "utf8");

if (tasksContent.includes("getAllTasks")) {
  console.log("SKIP: tasks.mjs already has getAllTasks");
} else {
  const anchor = "export const getTask = (id) => tasks.get(id) ?? null;";
  if (!tasksContent.includes(anchor)) {
    console.error("ABORT: could not find getTask() export in tasks.mjs");
    process.exit(1);
  }
  const addition =
    anchor +
    "\nexport const getAllTasks = () => [...tasks.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));";
  tasksContent = tasksContent.replace(anchor, addition);
  fs.writeFileSync(tasksPath, tasksContent);
  console.log("OK: tasks.mjs — added getAllTasks() (newest-updated first)");
}

// ---- api.mjs: add /api/tasks and /api/tasks/:id ----
let api = fs.readFileSync("src/ai/api.mjs", "utf8");
if (api.includes("/api/tasks")) {
  console.log("SKIP: api.mjs already wired");
} else {
  const oldImport = 'import { emit } from "./tasks.mjs";';
  if (!api.includes(oldImport)) {
    console.error("ABORT: could not find tasks.mjs import in api.mjs");
    process.exit(1);
  }
  const newImport = 'import { emit, getAllTasks, getTask, getEvents } from "./tasks.mjs";';
  api = api.replace(oldImport, newImport);

  const anchor2 = 'app.get("/api/audit", guard, (req, res) => {';
  if (!api.includes(anchor2)) {
    console.error("ABORT: could not find /api/audit anchor in api.mjs");
    process.exit(1);
  }
  const addition = [
    "// ---- Phase 11: Task Engine observability (read-only) ----",
    "  app.get(\"/api/tasks\", guard, (req, res) => {",
    "    res.json({ tasks: getAllTasks() });",
    "  });",
    "",
    "  app.get(\"/api/tasks/:id\", guard, (req, res) => {",
    "    const task = getTask(req.params.id);",
    "    if (!task) return res.status(404).json({ error: \"រកមិនឃើញ task\" });",
    "    res.json({ task, events: getEvents(req.params.id) });",
    "  });",
    "",
    "  ",
  ].join("\n");
  api = api.replace(anchor2, addition + anchor2);
  fs.writeFileSync("src/ai/api.mjs", api);
  console.log("OK: api.mjs — added GET /api/tasks and GET /api/tasks/:id");
}

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
