import { useCallback, useEffect, useState } from "react";

type Result = { ok: boolean; added: string[]; missing: string[]; changed: string[]; checkedAt: string };

function Group({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="status-card">
      <div className="status-card__extra">
        <strong>{title} ({items.length})</strong>
        <pre style={{ whiteSpace: "pre-wrap", margin: "6px 0 0", fontSize: "0.85em" }}>{items.join("\n")}</pre>
      </div>
    </div>
  );
}

export default function IntegrityCenter({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/integrity", { cache: "no-store" });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j && typeof j === "object" && "error" in j ? String(j.error) : `HTTP ${r.status}`);
      const res = j && typeof j === "object" && "result" in j ? j.result : j;
      setData(res as Result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", overflow: "auto", padding: 16, zIndex: 1000 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", color: "#eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>🛡 File Integrity (KEI)</h2>
          <div>
            <button onClick={load} disabled={loading}>{loading ? "..." : "Refresh"}</button>{" "}
            <button onClick={onClose}>Close</button>
          </div>
        </div>
        {error && <div className="status-card"><div className="status-card__extra">⚠ {error}</div></div>}
        {data && (
          <>
            <div className="status-card">
              <div className="status-card__extra">
                {data.ok ? "✅ គ្មានការផ្លាស់ប្ដូរ (OK)" : "⚠ រកឃើញការផ្លាស់ប្ដូរ"}
                <div style={{ opacity: 0.7, fontSize: "0.8em" }}>{data.checkedAt}</div>
              </div>
            </div>
            <Group title="Changed" items={data.changed} />
            <Group title="Added" items={data.added} />
            <Group title="Missing" items={data.missing} />
          </>
        )}
      </div>
    </div>
  );
}
