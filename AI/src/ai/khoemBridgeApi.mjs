import * as khoem from "./khoemApi.mjs";

async function send(res, fn) {
  try {
    res.json({ ok: true, data: await fn() });
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e?.message ?? e) });
  }
}

export function registerKhoemBridgeApi(app) {
  app.get("/api/khoem/health", (req, res) => send(res, () => khoem.khoemApiHealth()));
  app.get("/api/khoem/languages", (req, res) => send(res, () => khoem.getKhoemLanguages()));
  app.get("/api/khoem/locales", (req, res) => send(res, () => khoem.getKhoemLocales()));
  app.get("/api/khoem/coverage", (req, res) => send(res, () => khoem.getKhoemCoverage()));
  app.get("/api/khoem/knowledge", (req, res) =>
    send(res, () => khoem.searchKhoemKnowledge(req.query.q, { exact: req.query.exact === "1" })));
  app.get("/api/khoem/khmer", (req, res) =>
    send(res, () => khoem.searchKhoemKhmer(req.query.q)));
  app.post("/api/khoem/translate", (req, res) => {
    const { locale, key, params } = req.body ?? {};
    if (typeof locale !== "string" || typeof key !== "string" || !locale || !key) {
      return res.status(400).json({ ok: false, error: "locale និង key ត្រូវតែជា string" });
    }
    return send(res, () => khoem.khoemTranslate(locale, key, params));
  });
}
