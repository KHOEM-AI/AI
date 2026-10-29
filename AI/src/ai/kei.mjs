import express from "express";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const HOME = homedir();
const KEI_ROOT = process.env.KEI_ROOT || join(HOME, "KEI");

// Any HTTP reply (even 404) = up; no reply/timeout = down.
async function ping(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(1500) });
    return true;
  } catch {
    return false;
  }
}

const TARGETS = {
  "KI API": "http://127.0.0.1:5001/",
  "AI UI": "http://127.0.0.1:8787/api/health",
  "IQ-AI": "http://127.0.0.1:8799/",
  "KSV": "http://127.0.0.1:4000/",
  "KHOEM_AI": "http://127.0.0.1:8790/health",
  "EI-T": "http://127.0.0.1:3100/health",
};

// No server/port: "ready" = the files are present (not a running process).
const READY = {
  "khoem-now": () => existsSync(join(HOME, "khoem-now", "package.json")),
  "KEI": () =>
    existsSync(join(KEI_ROOT, "security", "file-integrity", "integrity.mjs")) &&
    existsSync(join(KEI_ROOT, "security", ".baseline.json")),
};

export const keiRouter = express.Router();

keiRouter.get("/status", async (_req, res) => {
  const entries = await Promise.all(
    Object.entries(TARGETS).map(async ([k, u]) => [k, await ping(u)])
  );
  const subs = Object.fromEntries(entries);
  for (const [k, fn] of Object.entries(READY)) subs[k] = !!fn();
  const running = entries.filter(([, v]) => v).length;
  res.json({
    services: { running, total: entries.length },
    network: running > 0 ? "Online" : "Offline",
    ai: subs["AI UI"] ? "Running" : "Stopped",
    subs,
    ready: Object.keys(READY),
    alerts: [],
  });
});

// EI-T bridge: only functions verified against the real API, short string args only.
const EIT_FNS = new Set(["numberToWords", "convert", "solveQuadratic"]);
keiRouter.post("/eit", async (req, res) => {
  const { fn, args } = req.body || {};
  if (
    typeof fn !== "string" || !EIT_FNS.has(fn) ||
    !Array.isArray(args) || args.length > 6 ||
    args.some((a) => typeof a !== "string" || a.length > 40)
  ) {
    return res.status(400).json({ error: "INVALID_REQUEST" });
  }
  try {
    const r = await fetch("http://127.0.0.1:3100/v1/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fn, args }),
      signal: AbortSignal.timeout(5000),
    });
    res.status(r.status).json(await r.json());
  } catch {
    res.status(503).json({ error: "EI_T_OFFLINE" });
  }
});
