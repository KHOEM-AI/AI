import { useEffect, useState } from "react";
import { pickText, useLanguageCode } from "../i18n";

// Read-only view of the KI registry (KI API :5001, GET /api/registry/<name>).
// "verified" means KI holds a verified date for the entry. Nothing is probed live here.

export type RegApi = { id: string; name?: string; type?: string; base_url?: string; verified?: string; enabled?: boolean };
export type RegSvc = { groups?: string[]; public?: string[]; protected?: string[] };
export type RegApp = { id: string; name?: string; api_id?: string; url?: string; enabled?: boolean };

const KI_BASE = typeof window !== "undefined" ? `http://${window.location.hostname}:5001` : "http://127.0.0.1:5001";

async function getKi<T>(name: string, ms = 4000): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(`${KI_BASE}/api/registry/${name}`, { signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function pathCount(s?: RegSvc): number {
  return s ? (s.groups?.length ?? 0) + (s.public?.length ?? 0) + (s.protected?.length ?? 0) : 0;
}

export function apiLine(a: RegApi, svc?: RegSvc): string {
  const parts = [`${a.verified ? "✅" : "🟡"} ${a.name ?? a.id}`];
  if (a.type) parts.push(a.type);
  if (a.base_url) parts.push(a.base_url);
  parts.push(a.verified ? `verified ${a.verified}` : "not verified");
  const n = pathCount(svc);
  if (n > 0) parts.push(`${n} paths`);
  if (a.enabled === false) parts.push("disabled");
  return parts.join(" · ");
}

type Data = { apis: RegApi[]; svcs: Record<string, RegSvc>; apps: RegApp[] };

export default function KiRegistry() {
  const lang = useLanguageCode();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([
      getKi<{ apis?: RegApi[] }>("apis"),
      getKi<{ services?: Record<string, RegSvc> }>("endpoints"),
      getKi<{ apps?: RegApp[] }>("ai-apps"),
    ])
      .then(([a, e, p]) => {
        if (alive) setData({ apis: a.apis ?? [], svcs: e.services ?? {}, apps: p.apps ?? [] });
      })
      .catch((x: unknown) => {
        if (alive) setErr(x instanceof Error ? (x.name === "AbortError" ? "timeout" : x.message) : String(x));
      });
    return () => {
      alive = false;
    };
  }, []);

  const head = data
    ? `KI registry (${data.apis.length})`
    : err
      ? `KI registry · ${pickText(lang, "មិនអាចភ្ជាប់ KI :5001", "KI :5001 not reachable")}`
      : "KI registry …";

  return (
    <details className="status-card__extra" style={{ marginTop: 8 }}>
      <summary style={{ cursor: "pointer" }}>🗂️ {head}</summary>
      {err && <div style={{ whiteSpace: "pre-wrap" }}>❌ {err}</div>}
      {data && (
        <div style={{ whiteSpace: "pre-wrap", maxHeight: "40vh", overflow: "auto" }}>
          <div style={{ opacity: 0.7 }}>
            {pickText(
              lang,
              "✅ = KI មានកាលបរិច្ឆេទផ្ទៀងផ្ទាត់ · 🟡 = មិនទាន់ផ្ទៀងផ្ទាត់ (មិនមែនពិនិត្យរស់ពេលនេះទេ)",
              "✅ = KI has a verified date · 🟡 = not verified (not a live check)",
            )}
          </div>
          {data.apis.map((a) => (
            <div key={a.id}>{apiLine(a, data.svcs[a.id])}</div>
          ))}
          {data.apps.length > 0 && <div style={{ marginTop: 6 }}>{pickText(lang, "កម្មវិធី", "Apps")}:</div>}
          {data.apps.map((p) => (
            <div key={p.id}>
              {p.name ?? p.id} →{" "}
              <a href={p.url} target="_blank" rel="noreferrer">
                {p.url}
              </a>{" "}
              (api: {p.api_id})
            </div>
          ))}
        </div>
      )}
    </details>
  );
}
