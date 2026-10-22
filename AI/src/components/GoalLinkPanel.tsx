import { useState } from "react";
import { getAdminKey, clearAdminKey } from "./adminKey";

async function api(url: string, body: unknown) {
  const key = getAdminKey("សូមបញ្ចូល API key (KHOEM_API_KEY)");
  if (!key) throw new Error("no key");
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-actor": "goal-link", "x-api-key": key },
    body: JSON.stringify(body),
  });
  if (r.status === 401) clearAdminKey();
  const json = await r.json();
  return (json && typeof json === "object" && "result" in json) ? json.result : json;
}

const STATUSES = ["ACTIVE", "COMPLETED", "ABANDONED"];

export default function GoalLinkPanel({ goalId }: { goalId: string }) {
  const [ideaId, setIdeaId] = useState("");
  const [planId, setPlanId] = useState("");
  const [status, setStatus] = useState(STATUSES[0]);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(path: string, body: unknown) {
    setError(null); setOut(null); setBusy(true);
    try { setOut(await api(`/api/goals/${encodeURIComponent(goalId)}/${path}`, body)); }
    catch { setError("សកម្មភាពមិនបានសម្រេច"); }
    finally { setBusy(false); }
  }

  const noGoal = !goalId;
  return (
    <div className="status-panel__meta" style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={ideaId} onChange={(e) => setIdeaId(e.target.value)} placeholder="Idea ID" />
        <button disabled={busy || noGoal || !ideaId.trim()}
          onClick={() => send("ideas", { ideaId: ideaId.trim() })}>Link idea</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={planId} onChange={(e) => setPlanId(e.target.value)} placeholder="Plan ID" />
        <button disabled={busy || noGoal || !planId.trim()}
          onClick={() => send("plans", { planId: planId.trim() })}>Link plan</button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button disabled={busy || noGoal} onClick={() => send("status", { status })}>Set status</button>
      </div>
      {noGoal && <div style={{ marginTop: 8, opacity: 0.7 }}>បញ្ចូល Goal ID ខាងលើសិន</div>}
      {error && <div style={{ color: "crimson", marginTop: 8 }}>{error}</div>}
      {out !== null && (
        <pre style={{ whiteSpace: "pre-wrap", margin: "8px 0 0", fontSize: "0.85em" }}>
          {JSON.stringify(out, null, 2)}
        </pre>
      )}
    </div>
  );
}
