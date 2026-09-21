import express from "express";
import { registerApi } from "./src/ai/api.mjs";
import cors from "cors";
import "dotenv/config";
import { AICore } from "./src/ai/core.mjs";
import { collectStatus, trackActivity } from "./src/ai/status.mjs";
import { createTask, transition, getTask, getEvents, emit, setExecution, setCognitive } from "./src/ai/tasks.mjs";

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
