import { useEffect, useState } from "react";
import { apiStrict } from "../lib/api";

type Collection = "languages" | "file-formats" | "templates";
interface Item {
  name?: string; language?: string; language_id?: string; file_format_id?: string;
  groups?: string[]; extensions?: string[]; mime_type?: string | null; verification_status?: string;
}
const BASE = "/cidc/api/cidc";
const COLLECTIONS: Collection[] = ["languages", "file-formats", "templates"];

export default function CidcCenter({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [col, setCol] = useState<Collection>("languages");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [count, setCount] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiStrict(`${BASE}/statistics`).then(setStats).catch((e: unknown) => setErr(String(e)));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      apiStrict(`${BASE}/search`, { method: "POST", body: JSON.stringify({ collection: col, query: q }) })
        .then((d) => { setItems(d.items ?? []); setCount(d.count ?? 0); setErr(null); })
        .catch((e: unknown) => setErr(String(e)));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [col, q]);

  return (
    <div className="status-overlay" role="dialog" aria-label="CIDC">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">CIDC</div>
            <div className="status-panel__page-title">Central Intelligence Data Core · ស្នូលទិន្នន័យ</div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {err && <div className="status-card__err">{err}</div>}
        {stats && (
          <div className="status-panel__meta">
            {Object.entries(stats).map(([k, v]) => <span key={k}>{k}: {v}</span>)}
          </div>
        )}
        <div className="status-panel__meta" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={col} onChange={(e) => setCol(e.target.value as Collection)}>
            {COLLECTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ស្វែងរក / search" />
          <span>{count}</span>
        </div>
        <div className="status-grid">
          {items.slice(0, 100).map((i, n) => (
            <div className="status-card" key={i.language_id ?? i.file_format_id ?? n}>
              <div className="status-card__head">
                <span className="status-card__name">{i.name ?? i.language}</span>
                <span className="status-badge">{i.verification_status}</span>
              </div>
              <div className="status-card__extra">
                {(i.groups ?? []).join(", ")}{(i.extensions ?? []).join(" ")}{i.mime_type ? ` · ${i.mime_type}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
