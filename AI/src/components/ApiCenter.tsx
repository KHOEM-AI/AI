import { useEffect, useMemo, useState } from "react";
import { useT, pickText, useLanguageCode } from "../i18n";
import { api } from "../api/client";

type R = { method: string; path: string };
const groupOf = (p: string) => p.split("/")[2] || "api";
const errText = (e: any) =>
  `❌ ${e?.status ?? ""} ${typeof e?.message === "string" ? e.message : JSON.stringify(e?.message)}`;

export default function ApiCenter({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguageCode();
  const [routes, setRoutes] = useState<R[]>([]);
  const [group, setGroup] = useState("");
  const [sel, setSel] = useState<R | null>(null);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [body, setBody] = useState("{}");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string[]>([]);

  useEffect(() => {
    api<{ routes: R[] }>("/api/routes/all")
      .then((r) => setRoutes(r.routes))
      .catch((e) => setResult(errText(e)));
  }, []);

  const groups = useMemo(() => [...new Set(routes.map((r) => groupOf(r.path)))], [routes]);
  const shown = routes.filter((r) => !group || groupOf(r.path) === group);
  const params = sel ? sel.path.match(/:[A-Za-z_]+/g) ?? [] : [];

  const buildUrl = (r: R) => {
    let u = r.path;
    for (const p of r.path.match(/:[A-Za-z_]+/g) ?? []) u = u.replace(p, encodeURIComponent(vals[p] ?? ""));
    return query.trim() ? `${u}?${query.trim().replace(/^\?/, "")}` : u;
  };

  async function run() {
    if (!sel) return;
    if (sel.method !== "GET" && !window.confirm(`${sel.method} ${buildUrl(sel)}\n${pickText(lang, "បញ្ជាក់ការហៅនេះ?", "Confirm this call?")}`)) return;
    setBusy(true);
    try {
      const opts: RequestInit = { method: sel.method };
      if (sel.method !== "GET") opts.body = body;
      setResult(JSON.stringify(await api(buildUrl(sel), opts), null, 2));
    } catch (e) { setResult(errText(e)); }
    finally { setBusy(false); }
  }

  async function checkAll() {
    setBusy(true); setReport([]);
    const list = routes.filter((r) => r.method === "GET" && !r.path.includes(":"));
    const out: string[] = [];
    for (const r of list) {
      try { await api(r.path); out.push(`✅ ${r.path}`); }
      catch (e: any) { out.push(`❌ ${r.path} (${e?.status ?? "?"})`); }
      setReport([...out]);
    }
    setBusy(false);
  }

  return (
    <div className="status-overlay" role="dialog" aria-label="API Center">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">API Center</div>
            <div className="status-panel__page-title">
              {pickText(lang, `route ទាំងអស់ពី backend (${routes.length})`, `All backend routes (${routes.length})`)}
            </div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        <div className="status-panel__meta" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={group} onChange={(e) => { setGroup(e.target.value); setSel(null); }}>
            <option value="">{pickText(lang, "ក្រុមទាំងអស់", "All groups")}</option>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <button disabled={busy} onClick={checkAll}>{pickText(lang, "ពិនិត្យ GET ទាំងអស់", "Check all GET")}</button>
        </div>

        {report.length > 0 && (
          <div className="status-card__extra" style={{ whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }}>
            {report.join("\n")}
          </div>
        )}

        <div className="status-card__extra" style={{ maxHeight: 220, overflow: "auto" }}>
          {shown.map((r) => (
            <div key={r.method + r.path} style={{ cursor: "pointer", fontWeight: sel === r ? 700 : 400 }}
              onClick={() => { setSel(r); setVals({}); setQuery(""); setBody("{}"); setResult(""); }}>
              {r.method} {r.path}
            </div>
          ))}
        </div>

        {sel && (
          <div className="status-panel__meta" style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            <strong>{sel.method} {sel.path}</strong>
            {params.map((p) => (
              <input key={p} placeholder={p.slice(1)} value={vals[p] ?? ""} onChange={(e) => setVals({ ...vals, [p]: e.target.value })} />
            ))}
            <input placeholder="query (q=សួស្តី&limit=10)" value={query} onChange={(e) => setQuery(e.target.value)} />
            {sel.method !== "GET" && (
              <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
            )}
            <button disabled={busy} onClick={run}>{pickText(lang, "ហៅ", "Run")}</button>
          </div>
        )}
        {result && <div className="status-card__extra" style={{ whiteSpace: "pre-wrap", maxHeight: 260, overflow: "auto" }}>{result}</div>}
      </div>
    </div>
  );
}
