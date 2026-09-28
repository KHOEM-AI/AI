import express from "express";
import { registerApi } from "./src/ai/api.mjs";
import { summarizeEngines } from "./src/ai/enginesSummary.mjs";
import cors from "cors";
import "dotenv/config";
import { AICore } from "./src/ai/core.mjs";
import { collectStatus, trackActivity } from "./src/ai/status.mjs";
import { createTask, transition, getTask, getEvents, emit, setExecution, setCognitive } from "./src/ai/tasks.mjs";
import { getAudit } from "./src/ai/permission.mjs";
import { listApprovals } from "./src/ai/approvals.mjs";

const app = express();
app.use(cors());
app.use(express.json());
app.use(trackActivity);

const PORT = process.env.PORT || 8787;

const MODEL = "khoem-local";
const aiCore = new AICore({
  provider: "khoem",
  model: MODEL,
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ai-project",
    port: PORT,
    provider: aiCore.provider,
    toolsProtected: Boolean(process.env.KHOEM_API_KEY),
  });
});

app.get("/api", (req, res) => {
  res.json({
    name: "ai-project API",
    version: "1.0.0",
    status: "online",
    endpoints: {
      health: "GET /api/health",
      chat: "POST /api/chat",
      models: "GET /api/models",
      tools: "GET /api/scan /api/check /api/learned /api/funcs?file= /api/read?file= | POST /api/learn /api/forget (ត្រូវការ header x-api-key)",
      approvals: "GET /api/approvals | GET /api/approvals/:id | POST /api/approvals/:id/approve|reject|execute (ត្រូវការ header x-api-key)",
    },
  });
});

app.get("/api/models", (req, res) => {
  res.json({
    models: [
      {
        id: MODEL,
        provider: "khoem",
        type: "chat",
      },
    ],
  });
});

// Internal browser bridge for Patch Dashboard.
// The secret stays server-side; it is never exposed to the frontend.
app.use("/api/patch", (req, res, next) => {
  const key = process.env.KHOEM_API_KEY;
  if (key && !req.get("x-api-key")) {
    req.headers["x-api-key"] = key;
  }
  next();
});

// Internal browser bridge for Control Center approval actions.
// The secret stays server-side; it is never exposed to the frontend.
app.use("/api/approvals", (req, res, next) => {
  const key = process.env.KHOEM_API_KEY;
  if (key && !req.get("x-api-key")) {
    req.headers["x-api-key"] = key;
  }
  next();
});

// Internal browser bridge for the new dashboard panels.
// The secret stays server-side. Only read-only GETs on listed prefixes and a
// few low-risk POSTs get the key. kill/resume/apply/execute are NOT listed.
const BRIDGE_GET = [
  "/api/tasks", "/api/circuit", "/api/model", "/api/verify", "/api/audit",
  "/api/metrics", "/api/goals", "/api/ideas", "/api/plans", "/api/experiments",
  "/api/budget", "/api/rollback", "/api/tools", "/api/system/status",
  "/api/code", "/api/learned",
  "/api/scan", "/api/check", "/api/find", "/api/funcs", "/api/read",
];
const BRIDGE_POST = [
  "/api/goals", "/api/ideas", "/api/plans", "/api/experiments",
  "/api/budget/create", "/api/rollback/snapshot", "/api/selfeval",
  "/api/verify", "/api/learn", "/api/forget", "/api/code/scan",
  "/api/sandbox/test",
];
const matches = (list, p) => list.some((x) => p === x || p.startsWith(x + "/"));
app.use("/api", (req, res, next) => {
  const key = process.env.KHOEM_API_KEY;
  const p = req.originalUrl.split("?")[0];
  const ok =
    (req.method === "GET" && matches(BRIDGE_GET, p)) ||
    (req.method === "POST" && matches(BRIDGE_POST, p));
  if (key && ok && !req.get("x-api-key")) req.headers["x-api-key"] = key;
  next();
});

registerApi(app);

app.get("/api/status", async (req, res) => {
  try {
    res.json(await collectStatus(aiCore));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const { messages, honorific } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: "សូមផ្ញើសារយ៉ាងហោចណាស់មួយ",
    });
  }

  let task = null;
  try {
    task = createTask({ kind: "chat", messageCount: messages.length });
    emit(task.taskId, "INPUT_RECEIVED", { messageCount: messages.length });
    transition(task.taskId, "QUEUED", "chat request accepted");
    transition(task.taskId, "RUNNING", "aiCore.chat started");
    const t0 = Date.now();
    const tid = task.taskId;
    const step = (fn, to, reason) => {
      try { fn(tid, to, reason); }
      catch (e) { emit(tid, "STATE_TRANSITION_REJECTED", { to, reason: String(e.message).slice(0, 120) }); }
    };
    step(setExecution, "PROCESSING", "chat received");
    step(setCognitive, "UNDERSTANDING", "chat received");
    const onStage = (kind, reason) => {
      step(setExecution, kind, reason);
      if (kind === "RETRIEVING") step(setCognitive, "RETRIEVING", reason);
    };
    const result = await aiCore.chat(messages, { honorific, onStage });
    step(setExecution, "RESPONDING", "reply ready");
    step(setCognitive, "ANSWERING", "reply ready");
    step(setExecution, "IDLE", "reply sent");
    step(setCognitive, "IDLE", "reply sent");
    transition(task.taskId, "COMPLETED", "reply generated");
    emit(task.taskId, "RESPONSE_COMPLETED", {}, Date.now() - t0);
    res.json(result);
  } catch (err) {
    if (task) { try { transition(task.taskId, "FAILED", "aiCore.chat failed"); } catch {} }
    console.error("AI Core error:", err);

    res.status(err.status === 401 || err.status === 402 ? 502 : 500).json({
      error: err.message || "មានបញ្ហាបច្ចេកទេសក្នុង AI Core",
      provider: err.provider || aiCore.provider,
      status: err.status || 500,
    });
  }
});

app.get("/api/control", (req, res) => {
  // Read-only, unauthenticated observability feed for the frontend Control Center.
  // Contains no secrets: task events carry only counts/reasons, audit entries carry
  // only action/permission/risk/decision metadata, approvals carry no credentials.
  res.json({ events: getEvents().slice(-20), audit: getAudit(20), approvals: listApprovals(), engines: summarizeEngines() });
});

// ចំណាំ: api.mjs ក៏មាន /api/tasks ដែរ ហើយចុះឈ្មោះមុន server.mjs នេះ
// ដូច្នេះ Express នឹងប្រើ route ក្នុង api.mjs ជានិច្ច។ Route ខាងក្រោមនេះ
// ត្រូវបានទុកចោល (មិនលុប) ព្រោះមិនប៉ះពាល់ដល់ការដំណើរការអ្វីទាំងអស់។
app.get("/api/tasks", (req, res) => {
  const key = process.env.KHOEM_API_KEY;
  if (!key) return res.status(503).json({ error: "API key not configured" });
  if (req.get("x-api-key") !== key) return res.status(401).json({ error: "Unauthorized" });
  const id = req.query.id ? String(req.query.id) : null;
  if (id) return res.json({ task: getTask(id), events: getEvents(id) });
  res.json({ events: getEvents().slice(-50) });
});

app.listen(PORT, () => {
  console.log(`server.mjs listening on port ${PORT}`);
});
