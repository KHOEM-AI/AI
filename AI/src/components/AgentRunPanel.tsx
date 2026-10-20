import { useState } from "react";
import { getAdminKey, clearAdminKey } from "./adminKey";

async function api(url: string, opts: RequestInit = {}) {
  const key = getAdminKey("សូមបញ្ចូល API key (KHOEM_API_KEY)");
  if (!key) throw new Error("no key");
  const r = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-actor": "agent-run", "x-api-key": key, ...(opts.headers || {}) },
  });
  if (r.status === 401) clearAdminKey();
  const json = await r.json();
  return (json && typeof json === "object" && "result" in json) ? json.result : json;
}

const DEFAULT_CRITERIA = "scan.ok=true\nscan.fileCount>0";

const DEFAULT_STEPS = JSON.stringify(
  [{ description: "scan repo", tools: ["scan-repo-data"], input: {} }],
  null,
  2
);

export default function AgentRunPanel() {
  const [goal, setGoal] = useState("");
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown | null>(null);

  async function run() {
    setError(null);
    setResult(null);
    if (!goal.trim()) { setError("សូមបញ្ចូល goal (ម៉ែតិចជាង 200 តួ)"); return; }
    if (goal.length > 200) { setError("goal វែងពេក (អតិបរមា 200 តួ)"); return; }
    let parsed: unknown;
    try { parsed = JSON.parse(steps); }
    catch { setError("steps មិនមែន JSON ត្រឹមត្រូវ"); return; }
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 5) {
      setError("steps ត្រូវតែជា array 1 ដល់ 5 ធាតុ");
      return;
    }
    const crit = criteria.split("\n").map((x) => x.trim()).filter(Boolean);
    if (crit.length < 1 || crit.length > 10) {
      setError("verificationCriteria ត្រូវមាន 1 ដល់ 10 បន្ទាត់");
      return;
    }
    setBusy(true);
    try {
      const r = await api("/api/agent/run", {
        method: "POST",
        body: JSON.stringify({ goal: goal.trim(), steps: parsed, verificationCriteria: crit }),
      });
      setResult(r);
    } catch {
      setError("រត់ Agent មិនបាន");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="status-card">
      <div className="status-card__extra">
        <h3 style={{ marginTop: 0 }}>Agent Run</h3>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="goal (អតិបរមា 200 តួ)"
          style={{ width: "100%", marginBottom: 8 }}
        />
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          rows={8}
          style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85em" }}
        />
        <textarea
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
          rows={3}
          placeholder="verificationCriteria (មួយបន្ទាត់ក្នុងមួយលក្ខខណ្ឌ)"
          style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85em", marginTop: 8 }}
        />
        <div style={{ marginTop: 8 }}>
          <button onClick={run} disabled={busy}>{busy ? "កំពុងរត់..." : "រត់ Agent"}</button>
        </div>
        {error && <div style={{ color: "crimson", marginTop: 8 }}>{error}</div>}
        {result !== null && (
          <pre style={{ whiteSpace: "pre-wrap", margin: "8px 0 0", fontSize: "0.85em" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
