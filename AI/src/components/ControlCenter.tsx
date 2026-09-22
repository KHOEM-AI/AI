import { useEffect, useState } from "react";

interface TaskEvent {
  id: string;
  taskId: string;
  type: string;
  timestamp: string;
  duration: number | null;
  metadata: Record<string, unknown>;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  permission: string | null;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  approvalRequired: boolean;
  decision: "ALLOW" | "DENY" | "REQUIRE_APPROVAL" | "SANDBOX_ONLY";
  reason?: string;
}

interface ControlData {
  events: TaskEvent[];
  audit: AuditEntry[];
}

const RISK_COLOR: Record<string, string> = {
  LOW: "#4ade80",
  MEDIUM: "#38bdf8",
  HIGH: "#fb923c",
  CRITICAL: "#f87171",
};

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("en-GB") : "—");

export default function ControlCenter({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<ControlData | null>(null);

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      try {
        const r = await fetch("/api/control", { cache: "no-store" });
        const d = await r.json();
        if (!stopped) setData(d);
      } catch {
        // silent: control center is observability-only, never blocks the app
      }
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, []);

  const events = data?.events ?? [];
  const audit = data?.audit ?? [];

  return (
    <div className="status-overlay" role="dialog" aria-label="CONTROL CENTER">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">Control Center</div>
            <div className="status-panel__page-title">ព្រឹត្តិការណ៍ និងការអនុញ្ញាត — Events &amp; Permissions</div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label="បិទ">✕</button>
        </div>

        <div className="status-panel__meta">
          <span>Recent Task Events — ព្រឹត្តិការណ៍ថ្មីៗ ({events.length})</span>
        </div>
        <div className="status-grid">
          {events.length === 0 && (
            <div className="status-card">
              <p className="status-card__desc-km">មិនទាន់មានព្រឹត្តិការណ៍ណាមួយទេ</p>
            </div>
          )}
          {[...events].reverse().map((e) => (
            <div className="status-card" key={e.id}>
              <div className="status-card__head">
                <span className="status-card__name">{e.type}</span>
                <span className="status-badge">{fmtTime(e.timestamp)}</span>
              </div>
              <p className="status-card__desc-en">task: {e.taskId.slice(0, 8)}…</p>
              {e.metadata && Object.keys(e.metadata).length > 0 && (
                <div className="status-card__extra">
                  {Object.entries(e.metadata).map(([k, v]) => (
                    <div key={k}><b>{k}:</b> {String(v)}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>Permission Audit — កំណត់ត្រាការអនុញ្ញាត ({audit.length})</span>
        </div>
        <div className="status-grid">
          {audit.length === 0 && (
            <div className="status-card">
              <p className="status-card__desc-km">មិនទាន់មានកំណត់ត្រាណាមួយទេ</p>
            </div>
          )}
          {[...audit].reverse().map((a) => (
            <div className="status-card" key={a.id}>
              <div className="status-card__head">
                <span className="status-card__name">{a.action}</span>
                <span className="status-badge" style={{ ["--badge-color" as any]: RISK_COLOR[a.risk] }}>
                  {a.risk} — {a.decision}
                </span>
              </div>
              <p className="status-card__desc-en">
                permission: {a.permission ?? "—"} · actor: {a.actor}
              </p>
              <div className="status-card__extra">
                <div>Approval required: {a.approvalRequired ? "yes" : "no"}</div>
                {a.reason && <div>Reason: {a.reason}</div>}
                <div>Time: {fmtTime(a.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
