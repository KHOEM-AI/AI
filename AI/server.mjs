// server.mjs — ម៉ាស៊ីនបម្រើតូចសម្រាប់ Termux (Node.js 18+)
// តួនាទី៖ ទទួលសារពី App.tsx → ផ្ញើទៅ Claude API → ផ្ញើចម្លើយត្រឡប់ជា stream
// សោ API ត្រូវដាក់ក្នុង environment variable ប៉ុណ្ណោះ (មិនដាក់ក្នុងកូដ ឬ GitHub)
//
// ប្រើ៖
//   export ANTHROPIC_API_KEY="sk-ant-..."
//   node server.mjs

import http from "node:http";

const PORT = Number(process.env.PORT) || 8787;
const KEY = process.env.ANTHROPIC_API_KEY;
const API_URL = "https://api.anthropic.com/v1/messages";
const MODELS = {
  quick: "claude-haiku-4-5-20251001",
  default: "claude-sonnet-5",
  complex: "claude-opus-5",
};

if (!KEY) {
  console.error('គ្មាន ANTHROPIC_API_KEY ទេ។ សូមវាយ៖ export ANTHROPIC_API_KEY="sk-ant-..."');
  process.exit(1);
}

// អនុញ្ញាតតែ browser ពី localhost ប៉ុណ្ណោះ
const allowOrigin = (origin) =>
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || "") ? origin : null;

const server = http.createServer(async (req, res) => {
  const origin = allowOrigin(req.headers.origin);
  const cors = origin
    ? {
        "access-control-allow-origin": origin,
        "access-control-allow-headers": "content-type",
        "access-control-allow-methods": "POST, OPTIONS",
        vary: "Origin",
      }
    : {};

  if (req.method === "OPTIONS") {
    res.writeHead(204, cors).end();
    return;
  }
  if (req.method !== "POST" || req.url !== "/api/chat") {
    res.writeHead(404, cors).end();
    return;
  }
  if (!origin) {
    res.writeHead(403, cors).end();
    return;
  }

  // អានតួសំណើ (កំណត់ទំហំ)
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 300_000) {
      res.writeHead(413, cors).end();
      return;
    }
    chunks.push(chunk);
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    res.writeHead(400, cors).end();
    return;
  }

  const { system, messages, tier } = payload ?? {};
  const valid =
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.every(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length > 0,
    ) &&
    messages[0].role === "user" &&
    messages[messages.length - 1].role === "user";
  if (!valid) {
    res.writeHead(400, { ...cors, "content-type": "application/json" });
    res.end(JSON.stringify({ error: "messages មិនត្រឹមត្រូវ" }));
    return;
  }

  const ac = new AbortController();
  res.on("close", () => ac.abort()); // ពេលចុច Stop ក្នុងទំព័រ → បញ្ឈប់ការហៅ API

  try {
    const up = await fetch(API_URL, {
      method: "POST",
      signal: ac.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELS[tier] ?? MODELS.default,
        max_tokens: 4096,
        stream: true,
        system: typeof system === "string" ? system : undefined,
        messages,
      }),
    });

    if (!up.ok) {
      const text = await up.text();
      res.writeHead(up.status, { ...cors, "content-type": "application/json" });
      res.end(JSON.stringify({ error: text.slice(0, 500) }));
      return;
    }

    res.writeHead(200, {
      ...cors,
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache",
    });
    for await (const chunk of up.body) res.write(chunk);
    res.end();
  } catch (err) {
    if (ac.signal.aborted) return;
    if (!res.headersSent) {
      res.writeHead(502, { ...cors, "content-type": "application/json" });
      res.end(JSON.stringify({ error: String(err) }));
    } else {
      res.end();
    }
  }
});

// ស្តាប់តែក្នុងទូរស័ព្ទ (127.0.0.1) មិនបើកឱ្យឧបករណ៍ផ្សេងចូលបាន
server.listen(PORT, "127.0.0.1", () => {
  console.log(`AI server រត់ហើយ៖ http://127.0.0.1:${PORT}`);
});


