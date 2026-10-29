import { useCallback, useEffect, useState } from "react";

type Root = { name: string; path?: string; ok: boolean; files?: number; skipped?: number; added?: string[]; missing?: string[]; changed?: string[]; error?: string };
type Result = { ok: boolean; checkedAt: string; roots: Root[] };

function List({ title, items }: { title: string; items?: string[] }) {
  if (!items || !items.length) return null;
  const shown = items.slice(0, 50);
  return (
    <div style={{ marginTop: 6 }}>
      <strong>{title} ({items.length})</strong>
      <pre style={{ whiteSpace: "pre-wrap", margin: "4px 0 0", fontSize: "0.85em" }}>
        {shown.join("\n")}{items.length > shown.length ? `\n… +${items.length - shown.length}` : ""}
      </pre>
    </div>
  );
}

export default function IntegrityCenter() {
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
    <div className="status-card" style={{ marginTop: 16 }}>
      <div className="status-card__extra">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>🛡 File Integrity — ទាំងគម្រោង</strong>
          <button onClick={load} disabled={loading}>{loading ? "..." : "Refresh"}</button>
        </div>
        {error && <div style={{ marginTop: 8 }}>⚠ {error}</div>}
        {data && (
          <>
            <div style={{ marginTop: 8 }}>
              {data.ok ? "✅ គ្មានការផ្លាស់ប្ដូរ" : "⚠ រកឃើញការផ្លាស់ប្ដូរ ឬបញ្ហា"}
              <span style={{ opacity: 0.7, fontSize: "0.8em" }}> · {data.checkedAt}</span>
            </div>
            {data.roots.map((r) => (
              <details key={r.name} open={!r.ok} style={{ marginTop: 6 }}>
                <summary>
                  {r.error ? "✗" : r.ok ? "✓" : "⚠"} {r.name}
                  {r.files !== undefined ? ` · ${r.files} files` : ""}
                  {r.changed?.length ? ` · changed ${r.changed.length}` : ""}
                  {r.added?.length ? ` · added ${r.added.length}` : ""}
                  {r.missing?.length ? ` · missing ${r.missing.length}` : ""}
                </summary>
                {r.error && <div style={{ marginTop: 4 }}>{r.error}</div>}
                <List title="Changed" items={r.changed} />
                <List title="Added" items={r.added} />
                <List title="Missing" items={r.missing} />
              </details>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
