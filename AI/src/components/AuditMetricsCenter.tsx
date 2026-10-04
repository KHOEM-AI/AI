import { useState } from "react";
import { useT, useLanguageCode, pickText } from "../i18n";
import { useKhoem } from "../hooks/useKhoem";

interface PolicyDecision {
  id: string; timestamp: string; actor: string; action: string;
  permission: string | null; risk: string; decision: string; reason?: string;
}
interface AuditEvent { id?: string; type?: string; timestamp?: string; [k: string]: unknown }
interface AuditData { policyDecisions: PolicyDecision[]; events: AuditEvent[] }
interface MetricsData { [k: string]: unknown }

const RISK_COLOR: Record<string, string> = {
  CRITICAL: "#f87171", HIGH: "#fb923c", MEDIUM: "#facc15", LOW: "#38bdf8",
};
const DECISION_COLOR: Record<string, string> = {
  DENY: "#f87171", REQUIRE_APPROVAL: "#facc15", ALLOW: "#4ade80", SANDBOX_ONLY: "#38bdf8",
};

async function api(url: string, opts: RequestInit = {}) {
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  const json = await r.json();
  return (json && typeof json === "object" && "result" in json) ? json.result : json;
}

export default function AuditMetricsCenter({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguageCode();
  const k = useKhoem(lang);
  const kk = (key: string, fb: string) => k(key) || fb;
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAudit() {
    setBusy("audit"); setError(null);
    try {
      const r = await fetch("/api/audit?limit=50");
      const json = await r.json();
      setAudit(json);
    } catch { setError("audit load failed"); } finally { setBusy(null); }
  }

  async function loadMetrics() {
    setBusy("metrics"); setError(null);
    try { setMetrics(await api("/api/metrics")); }
    catch { setError("metrics load failed"); } finally { setBusy(null); }
  }

  return (
    <div className="status-overlay" role="dialog" aria-label="Audit & Metrics Center">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">Audit &amp; Metrics</div>
            <div className="status-panel__page-title">
              {kk("ai.menu.audit01", pickText(lang, "ត្រួតពិនិត្យសកម្មភាព និងទិន្នន័យប្រព័ន្ធ", "Review policy decisions and system metrics"))}
            </div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        {error && <div className="status-card__err">{error}</div>}

        <div className="status-panel__meta" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button disabled={busy === "audit"} onClick={loadAudit}>
            {kk("ai.menu.audit02", pickText(lang, "ផ្ទុកកំណត់ត្រា Audit", "Load audit log"))}
          </button>
          <button disabled={busy === "metrics"} onClick={loadMetrics}>
            {kk("ai.menu.audit03", pickText(lang, "ផ្ទុក Metrics", "Load metrics"))}
          </button>
        </div>

        {audit && (
          <>
            <div className="status-panel__meta" style={{ marginTop: 16 }}>
              <span>{kk("ai.menu.audit04", pickText(lang, "សេចក្តីសម្រេចផ្នែក Policy", "Policy decisions"))}: {audit.policyDecisions.length}</span>
            </div>
            <div className="status-grid" style={{ marginTop: 8 }}>
              {audit.policyDecisions.length === 0 && (
                <div className="status-card">
                  <p className="status-card__desc-km">{kk("ai.menu.audit05", pickText(lang, "គ្មានទិន្នន័យ", "No data"))}</p>
                </div>
              )}
              {audit.policyDecisions.map((d) => (
                <div className="status-card" key={d.id}>
                  <div className="status-card__head">
                    <span className="status-card__name">{d.action} · {d.actor}</span>
                    <span className="status-badge" style={{ "--badge-color": DECISION_COLOR[d.decision] || "#94a3b8" } as React.CSSProperties}>
                      {d.decision}
                    </span>
                  </div>
                  <div className="status-card__extra">
                    <div>
                      <span className="status-badge" style={{ "--badge-color": RISK_COLOR[d.risk] || "#94a3b8" } as React.CSSProperties}>
                        {d.risk}
                      </span>
                      {d.permission ? ` · ${d.permission}` : ""}
                    </div>
                    <div>{d.timestamp}</div>
                    {d.reason && <div>{d.reason}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div className="status-panel__meta" style={{ marginTop: 16 }}>
              <span>{kk("ai.menu.audit06", pickText(lang, "ព្រឹត្តិការណ៍ Audit", "Audit events"))}: {audit.events.length}</span>
            </div>
            <div className="status-grid" style={{ marginTop: 8 }}>
              {audit.events.length === 0 && (
                <div className="status-card">
                  <p className="status-card__desc-km">{kk("ai.menu.audit05", pickText(lang, "គ្មានទិន្នន័យ", "No data"))}</p>
                </div>
              )}
              {audit.events.map((e, i) => (
                <div className="status-card" key={e.id ?? i}>
                  <div className="status-card__head">
                    <span className="status-card__name">{e.type ?? "event"}</span>
                  </div>
                  <div className="status-card__extra">
                    <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.85em" }}>
                      {JSON.stringify(e, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {metrics && (
          <>
            <div className="status-panel__meta" style={{ marginTop: 16 }}>
              <span>{kk("ai.menu.audit07", pickText(lang, "Metrics ប្រព័ន្ធ", "System metrics"))}</span>
            </div>
            <div className="status-grid" style={{ marginTop: 8 }}>
              <div className="status-card">
                <div className="status-card__extra">
                  <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.85em" }}>
                    {JSON.stringify(metrics, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
