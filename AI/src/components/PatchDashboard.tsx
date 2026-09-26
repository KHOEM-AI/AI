import { useEffect, useState, useCallback } from "react";
import { useT, useLanguageCode, pickText } from "../i18n";

interface Proposal {
  id: string;
  relPath: string;
  reason: string;
  actor: string;
  createdAt: string;
  status: "PENDING_APPROVAL" | "REJECTED_BY_SANDBOX";
  sandboxOk: boolean;
  approvalId: string | null;
}

const POLL_MS = 10000;

async function apiFetch(url: string, opts: RequestInit = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  return r.json();
}

export default function PatchDashboard({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguageCode();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/api/patch/list");
      if (Array.isArray(data.proposals)) setProposals(data.proposals);
      else if (data.error) setError(data.error);
    } catch {
      setError("network error");
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const act = async (
    id: string,
    action: "approve" | "reject" | "apply",
    approvalId: string | null,
  ) => {
    setBusyId(id);
    setError(null);

    try {
      const data = await apiFetch(`/api/patch/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify({
          approvalId,
          actor: "dashboard",
        }),
      });

      if (!data || data.error || data.ok === false) {
        setError(data?.error || `Patch ${action} failed`);
        return;
      }

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setBusyId(null);
    }
  };

  const pending = proposals.filter((p) => p.status === "PENDING_APPROVAL");

  return (
    <div className="status-overlay" role="dialog" aria-label="Patch Dashboard">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">Patch Dashboard</div>
            <div className="status-panel__page-title">
              {pickText(lang, "សំណើកែកូដកំពុងរង់ចាំ", "Pending code patch proposals")}
            </div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        {error && <div className="status-card__err">{error}</div>}

        <div className="status-grid">
          {pending.length === 0 && (
            <div className="status-card">
              <p className="status-card__desc-km">
                {pickText(lang, "គ្មានសំណើកំពុងរង់ចាំ។", "No proposals pending.")}
              </p>
            </div>
          )}
          {pending.map((p) => (
            <div className="status-card" key={p.id}>
              <div className="status-card__head">
                <span className="status-card__name">{p.relPath}</span>
                <span className="status-badge" style={{ "--badge-color": "#e0a800" } as React.CSSProperties}>
                  ● {p.status}
                </span>
              </div>
              <p className="status-card__desc-km">{p.reason}</p>
              <div className="status-card__diag">
                <div>actor: {p.actor}</div>
                <div>created: {new Date(p.createdAt).toLocaleString()}</div>
                <div>sandboxOk: {String(p.sandboxOk)}</div>
              </div>
              <div className="status-card__commands">
                <button disabled={busyId === p.id} onClick={() => act(p.id, "approve", p.approvalId)}>
                  {pickText(lang, "អនុម័ត", "Approve")}
                </button>
                <button disabled={busyId === p.id} onClick={() => act(p.id, "reject", p.approvalId)}>
                  {pickText(lang, "បដិសេធ", "Reject")}
                </button>
                <button disabled={busyId === p.id} onClick={() => act(p.id, "apply", p.approvalId)}>
                  {pickText(lang, "អនុវត្ត", "Apply")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
