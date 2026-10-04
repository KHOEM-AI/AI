import { useState } from "react";
import { useT, useLanguageCode, pickText } from "../i18n";
import { useKhoem } from "../hooks/useKhoem";

async function api(url: string, opts: RequestInit = {}) {
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  const json = await r.json();
  return (json && typeof json === "object" && "result" in json) ? json.result : json;
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <div className="status-card">
      <div className="status-card__extra">
        <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.85em" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default function SafetyCenter({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguageCode();
  const k = useKhoem(lang);
  const kk = (key: string, fb: string) => k(key) || fb;

  const [snapshots, setSnapshots] = useState<unknown | null>(null);
  const [snapshotReason, setSnapshotReason] = useState("");

  const [rollbackPlanId, setRollbackPlanId] = useState("");
  const [rollbackPlan, setRollbackPlan] = useState<unknown | null>(null);

  const [selfEvalInput, setSelfEvalInput] = useState("");
  const [selfEvalResult, setSelfEvalResult] = useState<unknown | null>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSnapshots() {
    setBusy("snapshots-load"); setError(null);
    try { setSnapshots(await api("/api/rollback/snapshots")); }
    catch { setError("snapshots load failed"); } finally { setBusy(null); }
  }

  async function createSnapshot() {
    setBusy("snapshots-create"); setError(null);
    try {
      await api("/api/rollback/snapshot", {
        method: "POST",
        body: JSON.stringify({ reason: snapshotReason.trim() || "manual UI snapshot" }),
      });
      setSnapshotReason("");
      await loadSnapshots();
    } catch { setError("snapshot create failed"); } finally { setBusy(null); }
  }

  async function loadRollbackPlan() {
    if (!rollbackPlanId.trim()) return;
    setBusy("plan-load"); setError(null);
    try {
      setRollbackPlan(await api(`/api/rollback/plan/${encodeURIComponent(rollbackPlanId.trim())}`));
    } catch { setError("rollback plan load failed"); } finally { setBusy(null); }
  }

  async function runSelfEval() {
    setBusy("selfeval-run"); setError(null);
    try {
      const body = selfEvalInput.trim() ? { input: selfEvalInput.trim() } : {};
      setSelfEvalResult(await api("/api/selfeval", { method: "POST", body: JSON.stringify(body) }));
    } catch { setError("self-eval failed"); } finally { setBusy(null); }
  }

  return (
    <div className="status-overlay" role="dialog" aria-label="Safety Center">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">Safety</div>
            <div className="status-panel__page-title">
              {kk("ai.menu.safety01", pickText(lang, "Rollback Snapshot និង ការវាយតម្លៃខ្លួនឯង", "Rollback snapshots and self-evaluation"))}
            </div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        {error && <div className="status-card__err">{error}</div>}

        {/* Rollback snapshots */}
        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{kk("ai.menu.safety02", pickText(lang, "Rollback Snapshot", "Rollback snapshots"))}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={snapshotReason} onChange={(e) => setSnapshotReason(e.target.value)}
            placeholder={kk("ai.menu.safety03", pickText(lang, "មូលហេតុ (ស្រេចចិត្ត)", "reason (optional)"))} />
          <button disabled={busy === "snapshots-create"} onClick={createSnapshot}>
            {kk("ai.menu.safety04", pickText(lang, "បង្កើត Snapshot", "Create snapshot"))}
          </button>
          <button disabled={busy === "snapshots-load"} onClick={loadSnapshots}>
            {kk("ai.menu.safety05", pickText(lang, "ផ្ទុក", "Load"))}
          </button>
        </div>
        {snapshots !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={snapshots} /></div>}

        {/* Rollback plan lookup */}
        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{kk("ai.menu.safety06", pickText(lang, "គម្រោង Rollback", "Rollback plan"))}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={rollbackPlanId} onChange={(e) => setRollbackPlanId(e.target.value)}
            placeholder={kk("ai.menu.safety07", pickText(lang, "Snapshot ID", "Snapshot ID"))} />
          <button disabled={busy === "plan-load" || !rollbackPlanId.trim()} onClick={loadRollbackPlan}>
            {kk("ai.menu.safety08", pickText(lang, "មើលគម្រោង", "View plan"))}
          </button>
        </div>
        {rollbackPlan !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={rollbackPlan} /></div>}

        {/* Self-evaluation */}
        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{kk("ai.menu.safety09", pickText(lang, "ការវាយតម្លៃខ្លួនឯង", "Self-evaluation"))}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={selfEvalInput} onChange={(e) => setSelfEvalInput(e.target.value)}
            placeholder={kk("ai.menu.safety10", pickText(lang, "ព័ត៌មានបញ្ចូល (ស្រេចចិត្ត)", "input (optional)"))} />
          <button disabled={busy === "selfeval-run"} onClick={runSelfEval}>
            {kk("ai.menu.safety11", pickText(lang, "ដំណើរការវាយតម្លៃ", "Run evaluation"))}
          </button>
        </div>
        {selfEvalResult !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={selfEvalResult} /></div>}
      </div>
    </div>
  );
}
