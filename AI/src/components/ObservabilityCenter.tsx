import { useState } from "react";
import { useT, useLanguageCode, pickText } from "../i18n";

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

export default function ObservabilityCenter({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguageCode();
  const [tasks, setTasks] = useState<unknown | null>(null);
  const [circuits, setCircuits] = useState<unknown | null>(null);
  const [routing, setRouting] = useState<unknown | null>(null);
  const [verification, setVerification] = useState<unknown | null>(null);
  const [taskDetailId, setTaskDetailId] = useState("");
  const [taskDetail, setTaskDetail] = useState<unknown | null>(null);
  const [circuitName, setCircuitName] = useState("");
  const [circuitDetail, setCircuitDetail] = useState<unknown | null>(null);
  const [routeDecision, setRouteDecision] = useState<unknown | null>(null);
  const [preferredProvider, setPreferredProvider] = useState("khoem");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadTasks() {
    setBusy("tasks"); setError(null);
    try { setTasks(await api("/api/tasks")); }
    catch { setError("tasks load failed"); } finally { setBusy(null); }
  }

  async function loadCircuits() {
    setBusy("circuits"); setError(null);
    try { setCircuits(await api("/api/circuit")); }
    catch { setError("circuit load failed"); } finally { setBusy(null); }
  }

  async function loadRouting() {
    setBusy("routing"); setError(null);
    try {
      const providers = await api("/api/model/providers");
      const history = await api("/api/model/routing-history");
      setRouting({ providers, history });
    } catch { setError("routing load failed"); } finally { setBusy(null); }
  }

  async function loadVerification() {
    setBusy("verify"); setError(null);
    try {
      const last = await api("/api/verify/last");
      const history = await api("/api/verify/history");
      setVerification({ last, history });
    } catch { setError("verification load failed"); } finally { setBusy(null); }
  }

  async function loadTaskDetail() {
    if (!taskDetailId.trim()) return;
    setBusy("task-detail"); setError(null);
    try { setTaskDetail(await api(`/api/tasks/${encodeURIComponent(taskDetailId.trim())}`)); }
    catch { setError("task detail failed"); } finally { setBusy(null); }
  }

  async function loadCircuitDetail() {
    if (!circuitName.trim()) return;
    setBusy("circuit-detail"); setError(null);
    try { setCircuitDetail(await api(`/api/circuit/${encodeURIComponent(circuitName.trim())}`)); }
    catch { setError("circuit detail failed"); } finally { setBusy(null); }
  }

  async function decideRoute() {
    setBusy("route-decide"); setError(null);
    try { setRouteDecision(await api(`/api/model/route?preferred=${encodeURIComponent(preferredProvider.trim() || "khoem")}`)); }
    catch { setError("route decision failed"); } finally { setBusy(null); }
  }

    async function runVerification() {
    setBusy("run-verify"); setError(null);
    try {
      const result = await api("/api/verify", { method: "POST", body: JSON.stringify({ reason: "manual UI trigger" }) });
      setVerification((prev: any) => ({ ...(prev || {}), last: { verification: result } }));
    } catch { setError("run verification failed"); } finally { setBusy(null); }
  }

  return (
    <div className="status-overlay" role="dialog" aria-label="Observability Center">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">Observability</div>
            <div className="status-panel__page-title">
              {pickText(lang, "ភារកិច្ច, Circuit Breaker, ការចាត់តាំង Model, និងការផ្ទៀងផ្ទាត់", "Tasks, circuit breakers, model routing, and verification")}
            </div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        {error && <div className="status-card__err">{error}</div>}

        <div className="status-panel__meta" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button disabled={busy === "tasks"} onClick={loadTasks}>
            {pickText(lang, "ផ្ទុកភារកិច្ច", "Load tasks")}
          </button>
          <button disabled={busy === "circuits"} onClick={loadCircuits}>
            {pickText(lang, "ផ្ទុក Circuit Breakers", "Load circuit breakers")}
          </button>
          <button disabled={busy === "routing"} onClick={loadRouting}>
            {pickText(lang, "ផ្ទុកការចាត់តាំង Model", "Load model routing")}
          </button>
          <button disabled={busy === "verify"} onClick={loadVerification}>
            {pickText(lang, "ផ្ទុកការផ្ទៀងផ្ទាត់", "Load verification")}
          </button>
          <button disabled={busy === "run-verify"} onClick={runVerification}>
            {pickText(lang, "ដំណើរការផ្ទៀងផ្ទាត់ថ្មី", "Run new verification")}
          </button>
        </div>

        <div className="status-panel__meta" style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={taskDetailId} onChange={(e) => setTaskDetailId(e.target.value)} placeholder="Task ID" />
          <button disabled={busy === "task-detail" || !taskDetailId.trim()} onClick={loadTaskDetail}>
            {pickText(lang, "មើលលម្អិត", "View detail")}
          </button>
        </div>
        {taskDetail !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={taskDetail} /></div>}

        <div className="status-panel__meta" style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={circuitName} onChange={(e) => setCircuitName(e.target.value)} placeholder="Circuit name" />
          <button disabled={busy === "circuit-detail" || !circuitName.trim()} onClick={loadCircuitDetail}>
            {pickText(lang, "មើលលម្អិត Circuit", "View circuit detail")}
          </button>
        </div>
        {circuitDetail !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={circuitDetail} /></div>}

        <div className="status-panel__meta" style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={preferredProvider} onChange={(e) => setPreferredProvider(e.target.value)} placeholder="preferred provider" />
          <button disabled={busy === "route-decide"} onClick={decideRoute}>
            {pickText(lang, "សម្រេចជ្រើសរើស Provider", "Decide provider")}
          </button>
        </div>
        {routeDecision !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={routeDecision} /></div>}

        {tasks !== null && (
          <>
            <div className="status-panel__meta" style={{ marginTop: 16 }}>
              <span>{pickText(lang, "ភារកិច្ច", "Tasks")}</span>
            </div>
            <div className="status-grid" style={{ marginTop: 8 }}>
              <JsonBlock data={tasks} />
            </div>
          </>
        )}

        {circuits !== null && (
          <>
            <div className="status-panel__meta" style={{ marginTop: 16 }}>
              <span>{pickText(lang, "Circuit Breakers", "Circuit breakers")}</span>
            </div>
            <div className="status-grid" style={{ marginTop: 8 }}>
              <JsonBlock data={circuits} />
            </div>
          </>
        )}

        {routing !== null && (
          <>
            <div className="status-panel__meta" style={{ marginTop: 16 }}>
              <span>{pickText(lang, "ការចាត់តាំង Model", "Model routing")}</span>
            </div>
            <div className="status-grid" style={{ marginTop: 8 }}>
              <JsonBlock data={routing} />
            </div>
          </>
        )}

        {verification !== null && (
          <>
            <div className="status-panel__meta" style={{ marginTop: 16 }}>
              <span>{pickText(lang, "ការផ្ទៀងផ្ទាត់", "Verification")}</span>
            </div>
            <div className="status-grid" style={{ marginTop: 8 }}>
              <JsonBlock data={verification} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
