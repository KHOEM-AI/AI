// CIDC client (read-only). Node: CIDC_TOKEN from env. Browser: cidcClient({ base: "/cidc" }) (UI proxy adds the token).
const env = (k) => globalThis.process?.env?.[k];

export function cidcClient({ base = env("CIDC_URL") || "http://127.0.0.1:8800", token = env("CIDC_TOKEN"), timeoutMs = 5000 } = {}) {
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  async function call(path, body) {
    const res = await fetch(`${base}/api/cidc${path}`, {
      method: body ? "POST" : "GET",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`CIDC ${path} -> ${res.status}`);
    return res.json();
  }

  return {
    health: () => call("/health"),
    search: (collection, filters = {}) => call("/search", { collection, ...filters }),
    retrieve: (collection, id) => call("/retrieve", { collection, id }),
    scaffold: (templateId, name) => call("/scaffold", { template_id: templateId, name }),
  };
}

// Node only: save scaffold files under outDir (refuses paths that escape it).
export async function saveFiles(files, outDir) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const root = path.resolve(outDir);
  for (const f of files) {
    const target = path.resolve(root, f.path);
    if (target !== root && !target.startsWith(root + path.sep)) throw new Error("unsafe path: " + f.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, f.content, { mode: f.executable ? 0o755 : 0o644 });
  }
  return files.length;
}
