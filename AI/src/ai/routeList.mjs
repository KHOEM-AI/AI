export function listRoutes(app) {
  const stack = app._router?.stack ?? app.router?.stack ?? [];
  const out = [];
  for (const layer of stack) {
    if (!layer.route) continue;
    const paths = [].concat(layer.route.path);
    for (const p of paths) {
      if (typeof p !== "string" || !p.startsWith("/api")) continue;
      for (const m of Object.keys(layer.route.methods)) {
        out.push({ method: m.toUpperCase(), path: p });
      }
    }
  }
  const seen = new Set();
  return out
    .filter((r) => !seen.has(r.method + r.path) && seen.add(r.method + r.path))
    .sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

export function registerRouteListApi(app) {
  app.get("/api/routes/all", (req, res) => res.json({ ok: true, routes: listRoutes(app) }));
}
