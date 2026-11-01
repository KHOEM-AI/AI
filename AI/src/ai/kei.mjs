import express from "express";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";

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

// ---- Protection coverage (read-only): roots.json + .baselines/*.json vs files on disk ----
const SEC = join(KEI_ROOT, "security");
const SKIP_DIRS = new Set(["node_modules", ".git", ".expo", "dist"]);
const CANDIDATES = [{ name: "CAI", path: "~/CAI" }, { name: "khoem-now", path: "~/khoem-now" }];
const expand = (p) => p.replace(/^~/, HOME);

function listFiles(root, cap = 20000) {
  const out = new Set();
  const stack = [root];
  while (stack.length && out.size < cap) {
    const d = stack.pop();
    let ents;
    try { ents = readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      const p = join(d, e.name);
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) stack.push(p); }
      else if (e.isFile()) out.add(relative(root, p));
    }
  }
  return { files: out, capped: out.size >= cap };
}

let protCache = { at: 0, data: null };
function buildProtection() {
  let roots = [];
  try { roots = JSON.parse(readFileSync(join(SEC, "file-integrity", "roots.json"), "utf8")); } catch { /* none */ }
  const names = new Set(roots.map((r) => r.name));
  const all = [
    ...roots,
    ...CANDIDATES.filter((c) => !names.has(c.name) && existsSync(expand(c.path))),
  ].filter((r) => r && /^[\w.-]+$/.test(String(r.name)) && typeof r.path === "string");
  const projects = all.map((r) => {
    const { files: disk, capped } = listFiles(expand(r.path));
    let base = null, created = null;
    try {
      const b = JSON.parse(readFileSync(join(SEC, ".baselines", r.name + ".json"), "utf8"));
      base = b.files || {}; created = b.created || null;
    } catch { /* no baseline */ }
    if (!base) return { name: r.name, protected: false, covered: 0, onDisk: disk.size, outside: disk.size, created: null, capped };
    let covered = 0;
    for (const f of disk) if (Object.hasOwn(base, f)) covered++;
    return { name: r.name, protected: true, covered, onDisk: disk.size, outside: disk.size - covered, created, capped };
  });
  const prot = projects.filter((p) => p.protected);
  return {
    projects,
    protectedProjects: prot.length,
    totalProjects: projects.length,
    filesCovered: projects.reduce((s, p) => s + p.covered, 0),
    filesOnDisk: projects.reduce((s, p) => s + p.onDisk, 0),
  };
}

keiRouter.get("/protection", (_req, res) => {
  try {
    if (!protCache.data || Date.now() - protCache.at > 20000) protCache = { at: Date.now(), data: buildProtection() };
    res.json(protCache.data);
  } catch {
    res.status(500).json({ error: "PROTECTION_FAILED" });
  }
});
