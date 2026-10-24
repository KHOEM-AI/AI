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

  // ---- ពិនិត្យដោយស្មោះត្រង់ ----
  // ✅ ជាប់ពិត (2xx + ចម្លើយ JSON ត្រឹមត្រូវ) · 🟡 ត្រូវការទិន្នន័យសិន (404 ទន់ ឬបញ្ជីទទេ)
  // ⚠️ ត្រូវការ query/id · 🔒 key ឬ policy បដិសេធ · ❌ ខូចពិត (5xx, timeout, 404, ចម្លើយមាន error) · 🐢 យឺតជាង 1.5s
  const SLOW_MS = 1500;
  type Kind = "ok" | "data" | "need" | "deny" | "bad";
  type Probe = { kind: Kind; line: string; slow?: boolean };

  async function probe(path: string, limitMs: number, opts: { softNotFound?: boolean; text?: boolean } = {}): Promise<Probe> {
    const t0 = performance.now();
    const took = () => Math.round(performance.now() - t0);
    let timer: any;
    const timeout = new Promise<never>((_, rej) => { timer = setTimeout(() => rej({ status: "timeout" }), limitMs); });
    const call = api(path);
    call.catch(() => {});
    try {
      const body: any = await Promise.race([call, timeout]);
      const d = took();
      const slow = d > SLOW_MS;
      const tail = " · " + d + "ms" + (slow ? " 🐢" : "");
      if (body && typeof body === "object" && !Array.isArray(body) && typeof body.error === "string")
        return { kind: "bad", line: "❌ " + path + " (200 តែមាន error: " + body.error + ")" + tail, slow };
      if (body === null && !opts.text)
        return { kind: "data", line: "🟡 " + path + " (ចម្លើយមិនមែន JSON)" + tail, slow };
      return { kind: "ok", line: "✅ " + path + tail, slow };
    } catch (e) {
      const st = (e as any)?.status;
      const tail = " · " + took() + "ms";
      if (st === 404) return opts.softNotFound
        ? { kind: "data", line: "🟡 " + path + " (404 គ្មានទិន្នន័យសម្រាប់ id នេះ)" + tail }
        : { kind: "bad", line: "❌ " + path + " (404 រកមិនឃើញ)" + tail };
      if (st === 400) return { kind: "need", line: "⚠️ " + path + " (400 ត្រូវការ query)" + tail };
      if (st === 401 || st === 403) return { kind: "deny", line: "🔒 " + path + " (" + st + ")" + tail };
      return { kind: "bad", line: "❌ " + path + " (" + (st ?? "?") + ")" + tail };
    } finally { clearTimeout(timer); }
  }

  function render(done: number, total: number, arr: Probe[], t0: number): string[] {
    const got = arr.filter(Boolean);
    const n = (k: Kind) => got.filter((p) => p.kind === k).length;
    const slow = got.filter((p) => p.slow).length;
    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    const head = done + "/" + total + " · ✅ " + n("ok") + " 🟡 " + n("data") + " ⚠️ " + n("need") + " 🔒 " + n("deny") + " ❌ " + n("bad") + " · " + secs + "s" + (slow ? " · 🐢 " + slow : "");
    return [head, ...got.filter((p) => p.kind !== "ok").map((p) => p.line), ...got.filter((p) => p.kind === "ok").map((p) => p.line)];
  }

  async function checkAll() {
    setBusy(true); setReport([]);
    const all = routes.filter((r) => r.method === "GET" && !r.path.includes(":"));
    // route ធ្ងន់ /api/code/* ដាក់ខាងចុង រត់ម្ដងមួយៗ កុំឱ្យបាំង route លឿន
    const list = [...all.filter((r) => !r.path.startsWith("/api/code/")), ...all.filter((r) => r.path.startsWith("/api/code/"))];
    const heavyFrom = all.filter((r) => !r.path.startsWith("/api/code/")).length;
    const res: Probe[] = new Array(list.length);
    let done = 0;
    const t0 = performance.now();
    const light = list.slice(0, heavyFrom);
    const heavy = list.slice(heavyFrom);
    const runPool = async (items: R[], n: number) => {
      let k = 0;
      const w = async () => {
        while (k < items.length) {
          const r = items[k++];
          const i = list.indexOf(r);
          const p = r.path;
          res[i] = await probe(p, p.startsWith("/api/code/") ? 60000 : 8000, { text: p.endsWith(".txt") });
          done++;
          setReport(render(done, list.length, res, t0));
        }
      };
      await Promise.all(Array.from({ length: n }, w));
    };
    await runPool(light, 4);
    await runPool(heavy, 1);
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
    const out: Probe[] = [];
    const t0 = performance.now();
    for (let i = 0; i < tests.length; i++) {
      const [p, qs] = tests[i];
      if (p.endsWith("backup-diff") && !backup) {
        out.push({ kind: "data", line: "🟡 " + p + " (គ្មាន backup — ហៅ POST /api/learned/backup សិន)" });
      } else {
        const r = await probe(p + qs, p.startsWith("/api/code/") ? 60000 : 8000, { softNotFound: true });
        // មាន query គំរូហើយ ប៉ុន្តែនៅតែ 400 គឺជាកំហុសពិត មិនមែន «ត្រូវការ query» ទេ
        out.push(r.kind === "need" ? { kind: "bad", line: r.line.replace("⚠️", "❌").replace("ត្រូវការ query", "ទោះមាន query គំរូ") } : r);
      }
      setReport(render(i + 1, tests.length, out, t0));
    }
    setBusy(false);
  }

  async function probeIds() {
    setBusy(true); setReport([]);
    // [route មានបញ្ជី, template របស់ route :id]
    const T: [string, string][] = [
      ["/api/ideas", "/api/ideas/:id"],
      ["/api/plans", "/api/plans/:id"],
      ["/api/experiments", "/api/experiments/:id"],
      ["/api/tasks", "/api/tasks/:id"],
      ["/api/tasks", "/api/budget/:id"],
      ["/api/goals", "/api/goals/:id"],
      ["/api/goals", "/api/goals/:id/progress"],
      ["/api/approvals", "/api/approvals/:id"],
      ["/api/characters", "/api/characters/:id"],
      ["/api/characters", "/api/characters/:id/timeline"],
      ["/api/characters", "/api/characters/:id/prompt"],
      ["/api/characters", "/api/characters/:id/refs"],
      ["/api/storyboards", "/api/storyboards/:id"],
      ["/api/storyboards", "/api/storyboards/:id/continuity"],
      ["/api/library", "/api/library/:id"],
      ["/api/rollback/snapshots", "/api/rollback/snapshots/:id"],
      ["/api/rollback/snapshots", "/api/rollback/plan/:id"],
      ["/api/patch/proposals", "/api/patch/proposals/:id"],
      ["/api/circuit", "/api/circuit/:id"],
      ["/api/tools", "/api/tools/:id/risk"],
    ];
    // 404 ទន់: id មកពីបញ្ជី task ប៉ុន្តែ budget អាចមិនទាន់បង្កើត (មិនមែនខូច)
    const SOFT = new Set(["/api/budget/:id"]);
    const LISTS = ["items", "ideas", "plans", "experiments", "tasks", "goals", "approvals", "characters", "storyboards", "snapshots", "proposals", "breakers", "tools"];
    // បែងចែក: id រកឃើញ / បញ្ជីទទេពិត (0 ធាតុ) / ទម្រង់ចម្លើយមិនស្គាល់ (មិនមែនទទេក្លែង)
    const pick = (j: any): { id: string; why: string } => {
      const r = j?.result ?? j;
      let arr: any = Array.isArray(r) ? r : null;
      if (!arr && r && typeof r === "object") {
        for (const k of LISTS) {
          const v = r[k];
          if (Array.isArray(v)) { arr = v; break; }
          if (v && typeof v === "object" && Object.keys(v).length) { arr = Object.keys(v); break; }
        }
      }
      if (!arr) return { id: "", why: r && typeof r === "object" ? Object.keys(r).slice(0, 6).join(",") || "{}" : typeof r };
      const f = arr[0];
      if (f == null) return { id: "", why: "empty" };
      if (typeof f === "string") return { id: f, why: "ok" };
      const id = String(f.id ?? f.ideaId ?? f.planId ?? f.experimentId ?? f.name ?? f.taskId ?? "");
      return { id, why: id ? "ok" : Object.keys(f).slice(0, 6).join(",") };
    };
    const out: Probe[] = [];
    const t0 = performance.now();
    for (let i = 0; i < T.length; i++) {
      const [list, tpl] = T[i];
      try {
        const { id, why } = pick(await api(list));
        if (!id) {
          out.push(why === "empty"
            ? { kind: "data", line: "🟡 " + tpl + " (បញ្ជីទទេ 0 ធាតុ — បង្កើតទិន្នន័យសិន)" }
            : { kind: "need", line: "⚠️ " + tpl + " (រកមិនឃើញ id ក្នុងចម្លើយ keys: " + why + ")" });
        } else {
          out.push(await probe(tpl.replace(":id", encodeURIComponent(id)), 8000, { softNotFound: SOFT.has(tpl) }));
        }
      } catch (e) {
        out.push({ kind: "bad", line: "❌ " + list + " (" + ((e as any)?.status ?? "?") + ")" });
      }
      setReport(render(i + 1, T.length, out, t0));
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
          <button disabled={busy} onClick={probeIds}>{pickText(lang, "សាក route មាន :id", "Probe :id routes")}</button>
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
