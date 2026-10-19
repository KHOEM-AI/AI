import { useState } from "react";
import { pickText } from "../i18n";
import { api } from "../api/client";

export type Kind = "text" | "number" | "json" | "lines" | "bool" | "area" | "select";
export type F = { k: string; label?: string; kind?: Kind; ph?: string; options?: string[] };
export type Op = {
  m: "GET" | "POST" | "DELETE";
  path: string;
  desc: string;
  fields?: F[];
  pick?: Record<string, string>;
  danger?: boolean;
};

const un = (j: any) => (j && typeof j === "object" && "result" in j ? j.result : j);
const errMsg = (e: any) =>
  `❌ ${e?.status ?? ""} ${typeof e?.message === "string" ? e.message : JSON.stringify(e?.message)}`;

export default function OpCard({ op, lang }: { op: Op; lang: any }) {
  const params = (op.path.match(/:[A-Za-z_]+/g) ?? []).map((p) => p.slice(1));
  const [v, setV] = useState<Record<string, any>>({});
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [opts, setOpts] = useState<Record<string, string[]>>({});
  const set = (k: string, x: any) => setV((s) => ({ ...s, [k]: x }));

  async function loadPicks() {
    for (const [k, url] of Object.entries(op.pick ?? {})) {
      if (opts[k]) continue;
      try {
        const r = un(await api(url));
        const arr: any[] = Array.isArray(r) ? r : r?.items ?? [];
        const ids = arr
          .map((x) => (typeof x === "string" ? x : x?.id ?? x?.name))
          .filter(Boolean)
          .map(String);
        setOpts((s) => ({ ...s, [k]: ids }));
      } catch { /* មិនបាច់ */ }
    }
  }

  async function run() {
    if (op.danger && !window.confirm(pickText(lang, `បញ្ជាក់ ${op.m} ${op.path} ?`, `Confirm ${op.m} ${op.path}?`))) return;
    setBusy(true);
    try {
      let url = op.path;
      for (const p of params) {
        const val = String(v[p] ?? "").trim();
        if (!val) throw new Error(`ត្រូវការ ${p}`);
        url = url.replace(":" + p, encodeURIComponent(val));
      }
      const q: Record<string, string> = {};
      const b: Record<string, any> = {};
      for (const f of op.fields ?? []) {
        const x = v[f.k];
        if (f.kind === "bool") { if (x) (op.m === "GET" ? (q[f.k] = "true") : (b[f.k] = true)); continue; }
        if (x === undefined || x === "") continue;
        let val: any = x;
        if (f.kind === "number") val = Number(x);
        else if (f.kind === "json") {
          try { val = JSON.parse(x); } catch { throw new Error(`${f.label ?? f.k}: JSON មិនត្រឹមត្រូវ`); }
        } else if (f.kind === "lines") val = String(x).split("\n").map((s) => s.trim()).filter(Boolean);
        if (op.m === "GET") q[f.k] = String(val);
        else if (f.k === "*") Object.assign(b, val);
        else b[f.k] = val;
      }
      if (op.m === "GET") {
        const qs = new URLSearchParams(q).toString();
        setOut(JSON.stringify(un(await api(qs ? `${url}?${qs}` : url)), null, 2));
      } else if (op.m === "POST") {
        setOut(JSON.stringify(un(await api(url, { method: "POST", body: JSON.stringify(b) })), null, 2));
      } else {
        setOut(JSON.stringify(un(await api(url, { method: "DELETE" })), null, 2));
      }
    } catch (e: any) { setOut(errMsg(e)); }
    finally { setBusy(false); }
  }

  return (
    <details style={{ marginTop: 6 }} onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && loadPicks()}>
      <summary>{op.m} {op.path} — {op.desc}</summary>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
        {params.map((p) => {
          const id = `dl-${op.m}-${op.path}-${p}`;
          return (
            <div key={p}>
              <input list={id} placeholder={p} value={v[p] ?? ""} onChange={(e) => set(p, e.target.value)} style={{ width: "100%" }} />
              <datalist id={id}>{(opts[p] ?? []).map((o) => <option key={o} value={o} />)}</datalist>
            </div>
          );
        })}
        {(op.fields ?? []).map((f) =>
          f.kind === "select" ? (
            <select key={f.k} value={v[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} style={{ width: "100%" }}>
              <option value="">{f.label ?? f.k}</option>
              {(f.options ?? []).map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          ) : f.kind === "bool" ? (
            <label key={f.k}><input type="checkbox" checked={!!v[f.k]} onChange={(e) => set(f.k, e.target.checked)} /> {f.label ?? f.k}</label>
          ) : f.kind === "json" || f.kind === "lines" || f.kind === "area" ? (
            <textarea key={f.k} rows={5} placeholder={f.ph ?? f.label ?? f.k} value={v[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} />
          ) : (
            <input key={f.k} placeholder={f.ph ?? f.label ?? f.k} value={v[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} />
          ),
        )}
        <button disabled={busy} onClick={run}>{pickText(lang, "ហៅ", "Run")}</button>
        {out && <pre className="status-card__extra" style={{ whiteSpace: "pre-wrap", maxHeight: 260, overflow: "auto", margin: 0 }}>{out}</pre>}
      </div>
    </details>
  );
}
