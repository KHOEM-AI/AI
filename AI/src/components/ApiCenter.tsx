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
    const res: string[] = new Array(list.length).fill("");
    let ok = 0, warn = 0, bad = 0, done = 0, next = 0;
    const push = () => setReport([`${done}/${list.length} · ✅ ${ok} ⚠️ ${warn} ❌ ${bad}`, ...res.filter(Boolean)]);
    const worker = async () => {
      while (next < list.length) {
        const i = next++;
        const r = list[i];
        const ms = r.path.startsWith("/api/code/") ? 60000 : 8000;
        try {
          await Promise.race([
            api(r.path),
            new Promise((_, rej) => setTimeout(() => rej({ status: "timeout" }), ms)),
          ]);
          ok++; res[i] = `✅ ${r.path}`;
        } catch (e) {
          const st = (e as any)?.status;
          if (st === 400 || st === 401 || st === 403) { warn++; res[i] = `⚠️ ${r.path} (${st})`; }
          else { bad++; res[i] = `❌ ${r.path} (${st ?? "?"})`; }
        }
        done++; push();
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    setBusy(false);
  }

  async function probeWarn() {
    setBusy(true); setReport([]);
    const q = encodeURIComponent("សួស្តី");
    const f = encodeURIComponent("src/App.tsx");
    let backup = "";
    try {
      const b: any = await api("/api/learned/backups");
      const r = b?.result ?? b;
      const arr = Array.isArray(r) ? r : r?.items ?? r?.backups ?? [];
      const first = arr[0];
      backup = typeof first === "string" ? first : first?.name ?? "";
    } catch { /* មិនបាច់ */ }
    const tests: [string, string][] = [
      ["/api/find", "?q=" + q], ["/api/tools/find", "?q=" + q],
      ["/api/funcs", "?file=" + f], ["/api/read", "?file=" + f],
      ["/api/code/dependencies", "?file=" + f], ["/api/code/dependents", "?file=" + f],
      ["/api/code/symbol", "?name=App"],
      ["/api/learned/get", "?q=" + q], ["/api/learned/exists", "?q=" + q],
      ["/api/learned/match", "?q=" + q], ["/api/learned/search", "?q=" + q],
      ["/api/learned/similar", "?q=" + q], ["/api/learned/suggest", "?q=" + q],
      ["/api/learned/starts", "?prefix=" + encodeURIComponent("សួស្")],
      ["/api/learned/backup-diff", "?name=" + encodeURIComponent(backup)],
    ];
    const out: string[] = [];
    let ok = 0, bad = 0;
    for (let i = 0; i < tests.length; i++) {
      const [p, qs] = tests[i];
      if (p.endsWith("backup-diff") && !backup) { out.push("⚠️ " + p + " (គ្មាន backup)"); continue; }
      try {
        await Promise.race([
          api(p + qs),
          new Promise((_, rej) => setTimeout(() => rej({ status: "timeout" }), p.startsWith("/api/code/") ? 60000 : 8000)),
        ]);
        ok++; out.push("✅ " + p + qs);
      } catch (e) {
        const st = (e as any)?.status;
        if (st === 404) { ok++; out.push("✅ " + p + " (404 គ្មានទិន្នន័យ)"); }
        else { bad++; out.push("❌ " + p + " (" + (st ?? "?") + ")"); }
      }
      setReport([(i + 1) + "/" + tests.length + " · ✅ " + ok + " ❌ " + bad, ...out]);
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
          <button disabled={busy} onClick={probeWarn}>{pickText(lang, "សាក ⚠️ ដោយ query គំរូ", "Probe ⚠️ with sample query")}</button>
        </div>

        {report.length > 0 && (
          <div className="status-card__extra" style={{ whiteSpace: "pre-wrap", maxHeight: "55vh", overflow: "auto" }}>
            {report.join("\n")}
          </div>
        )}

        <div className="status-card__extra" style={{ maxHeight: "40vh", overflow: "auto" }}>
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
        {result && <div className="status-card__extra" style={{ whiteSpace: "pre-wrap", maxHeight: "50vh", overflow: "auto" }}>{result}</div>}
      </div>
    </div>
  );
}
