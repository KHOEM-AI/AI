import { useCallback, useEffect, useState } from "react";
import { useT } from "../i18n";

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

interface ApprovalItem {
  id: string;
  action: string;
  actor: string;
  permission: string | null;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
  createdAt: string;
  expiresAt: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "EXPIRED";
}

interface EngineSummary {
  ideas: { total: number; byRisk: Record<string, number> };
  plans: { total: number; byStatus: Record<string, number>; needingApproval: number };
  experiments: { total: number; byStatus: Record<string, number> };
}

interface ControlData {
  events: TaskEvent[];
  audit: AuditEntry[];
  approvals: ApprovalItem[];
  engines?: EngineSummary;
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
  const [busyId, setBusyId] = useState<string | null>(null);
  const t = useT();

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/control", { cache: "no-store" });
      const d = await r.json();
      setData(d);
    } catch {
      // silent: control center is observability-only, never blocks the app
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const timer = window.setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  async function decide(id: string, action: "approve" | "reject") {
    const key = window.prompt(t.apiKeyPrompt);
    if (!key) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/approvals/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key },
        body: JSON.stringify({ decidedBy: "control-center" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert(`${t.decisionFailed}: ${d.error || r.status}`);
        return;
      }
      await load();
    } catch {
      alert(t.connectFailed);
    } finally {
      setBusyId(null);
    }
  }

  const events = data?.events ?? [];
  const audit = data?.audit ?? [];
  const approvals = data?.approvals ?? [];
  const pending = approvals.filter((a) => a.status === "PENDING_APPROVAL");
  const engines = data?.engines;

  return (
    <div className="status-overlay" role="dialog" aria-label={t.navControlCenter}>
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">Control Center</div>
            <div className="status-panel__page-title">{t.controlCenterSubtitle}</div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        {engines && (
          <>
            <div className="status-panel__meta">
              <span>Engines (read-only) — Ideas {engines.ideas.total} · Plans {engines.plans.total} · Experiments {engines.experiments.total}</span>
            </div>
            <div className="status-grid">
              <div className="status-card">
                <p className="status-card__desc-km">
                  Ideas — risk: {((o) => Object.entries(o).map(([k, v]) => k + " " + v).join(" · ") || "—")(engines.ideas.byRisk)}
                </p>
                <p className="status-card__desc-km">
                  Plans — {((o) => Object.entries(o).map(([k, v]) => k + " " + v).join(" · ") || "—")(engines.plans.byStatus)} · ត្រូវការ approval: {engines.plans.needingApproval}
                </p>
                <p className="status-card__desc-km">
                  Experiments — {((o) => Object.entries(o).map(([k, v]) => k + " " + v).join(" · ") || "—")(engines.experiments.byStatus)}
                </p>
              </div>
            </div>
          </>
        )}

        <div className="status-panel__meta">
          <span>{t.pendingApprovalsLabel} ({pending.length})</span>
        </div>
        <div className="status-grid">
          {pending.length === 0 && (
            <div className="status-card">
              <p className="status-card__desc-km">{t.noPendingApprovals}</p>
            </div>
          )}
          {pending.map((a) => (
            <div className="status-card" key={a.id}>
              <div className="status-card__head">
                <span className="status-card__name">{a.action}</span>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <span className="status-badge" style={{ "--badge-color": RISK_COLOR[a.risk] } as React.CSSProperties}>
                  {a.risk}
                </span>
              </div>
              <p className="status-card__desc-en">permission: {a.permission ?? "—"} · actor: {a.actor}</p>
              <div className="status-card__extra">
                <div>Reason: {a.reason}</div>
                <div>Created: {fmtTime(a.createdAt)}</div>
                <div>Expires: {fmtTime(a.expiresAt)}</div>
              </div>
              <div className="status-card__extra" style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button disabled={busyId === a.id} onClick={() => decide(a.id, "approve")}>{t.approveAction}</button>
                <button disabled={busyId === a.id} onClick={() => decide(a.id, "reject")}>{t.rejectAction}</button>
              </div>
            </div>
          ))}
        </div>

        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{t.recentEventsLabel} ({events.length})</span>
        </div>
        <div className="status-grid">
          {events.length === 0 && (
            <div className="status-card">
              <p className="status-card__desc-km">{t.noEvents}</p>
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
          <span>{t.permissionAuditLabel} ({audit.length})</span>
        </div>
        <div className="status-grid">
          {audit.length === 0 && (
            <div className="status-card">
              <p className="status-card__desc-km">{t.noAuditEntries}</p>
            </div>
          )}
          {[...audit].reverse().map((a) => (
            <div className="status-card" key={a.id}>
              <div className="status-card__head">
                <span className="status-card__name">{a.action}</span>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <span className="status-badge" style={{ "--badge-color": RISK_COLOR[a.risk] } as React.CSSProperties}>
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
