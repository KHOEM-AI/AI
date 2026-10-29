import { useCallback, useEffect, useState } from "react";

type Alert = { at: string; event: string; ip: string | null; action: string; actor: string; message_km: string; message_en: string };
type Result = { count: number; alerts: Alert[] };

export default function SecurityAlertsCenter() {
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/security/alerts", { cache: "no-store" });
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
          <strong style={{ color: "#fff" }}>🚨 ការព្រមានសុវត្ថិភាព · Security Alerts</strong>
          <button onClick={load} disabled={loading}>{loading ? "..." : "Refresh"}</button>
        </div>
        {error && <div style={{ marginTop: 8, color: "#fff" }}>⚠ {error}</div>}
        {data && (
          data.count === 0 ? (
            <div style={{ marginTop: 8, color: "#fff" }}>✅ គ្មានការព្យាយាមគ្មានសិទ្ធិថ្មីៗទេ · No recent unauthorized attempts</div>
          ) : (
            data.alerts.map((a, i) => (
              <div key={i} style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                <div style={{ opacity: 0.7, fontSize: "0.8em", color: "#fff" }}>{a.at}</div>
                <div style={{ color: "#fff" }}>{a.message_km}</div>
                <div style={{ color: "#fff", opacity: 0.85 }}>{a.message_en}</div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
