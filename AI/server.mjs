import express from "express";
import { registerApi } from "./src/ai/api.mjs";
import cors from "cors";
import "dotenv/config";
import { AICore } from "./src/ai/core.mjs";

const app = express();
app.use(cors());
app.use(express.json());

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

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: "សូមផ្ញើសារយ៉ាងហោចណាស់មួយ",
    });
  }

  try {
    const result = await aiCore.chat(messages);
    res.json(result);
  } catch (err) {
    console.error("AI Core error:", err);

    res.status(err.status === 401 || err.status === 402 ? 502 : 500).json({
      error: err.message || "មានបញ្ហាបច្ចេកទេសក្នុង AI Core",
      provider: err.provider || aiCore.provider,
      status: err.status || 500,
    });
  }
});

app.listen(PORT, () => {
  console.log(`server.mjs listening on port ${PORT}`);
});
