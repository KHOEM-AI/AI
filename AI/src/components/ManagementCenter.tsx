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

export default function ManagementCenter({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguageCode();

  const [goals, setGoals] = useState<unknown | null>(null);
  const [goalTitle, setGoalTitle] = useState("");

  const [ideas, setIdeas] = useState<unknown | null>(null);
  const [ideaTitle, setIdeaTitle] = useState("");

  const [plans, setPlans] = useState<unknown | null>(null);
  const [planTitle, setPlanTitle] = useState("");

  const [experiments, setExperiments] = useState<unknown | null>(null);
  const [experimentTitle, setExperimentTitle] = useState("");

  const [budgets, setBudgets] = useState<unknown | null>(null);
  const [budgetTaskId, setBudgetTaskId] = useState("");

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadGoals() {
    setBusy("goals-load"); setError(null);
    try { setGoals(await api("/api/goals")); }
    catch { setError("goals load failed"); } finally { setBusy(null); }
  }
  async function createGoal() {
    if (!goalTitle.trim()) return;
    setBusy("goals-create"); setError(null);
    try {
      await api("/api/goals", { method: "POST", body: JSON.stringify({ title: goalTitle.trim() }) });
      setGoalTitle("");
      await loadGoals();
    } catch { setError("goal create failed"); } finally { setBusy(null); }
  }

  async function loadIdeas() {
    setBusy("ideas-load"); setError(null);
    try { setIdeas(await api("/api/ideas")); }
    catch { setError("ideas load failed"); } finally { setBusy(null); }
  }
  async function createIdea() {
    if (!ideaTitle.trim()) return;
    setBusy("ideas-create"); setError(null);
    try {
      await api("/api/ideas", { method: "POST", body: JSON.stringify({ title: ideaTitle.trim() }) });
      setIdeaTitle("");
      await loadIdeas();
    } catch { setError("idea create failed"); } finally { setBusy(null); }
  }

  async function loadPlans() {
    setBusy("plans-load"); setError(null);
    try { setPlans(await api("/api/plans")); }
    catch { setError("plans load failed"); } finally { setBusy(null); }
  }
  async function createPlan() {
    if (!planTitle.trim()) return;
    setBusy("plans-create"); setError(null);
    try {
      await api("/api/plans", { method: "POST", body: JSON.stringify({ title: planTitle.trim() }) });
      setPlanTitle("");
      await loadPlans();
    } catch { setError("plan create failed"); } finally { setBusy(null); }
  }

  async function loadExperiments() {
    setBusy("experiments-load"); setError(null);
    try { setExperiments(await api("/api/experiments")); }
    catch { setError("experiments load failed"); } finally { setBusy(null); }
  }
  async function createExperiment() {
    if (!experimentTitle.trim()) return;
    setBusy("experiments-create"); setError(null);
    try {
      await api("/api/experiments", { method: "POST", body: JSON.stringify({ title: experimentTitle.trim() }) });
      setExperimentTitle("");
      await loadExperiments();
    } catch { setError("experiment create failed"); } finally { setBusy(null); }
  }

  async function loadBudgets() {
    setBusy("budgets-load"); setError(null);
    try { setBudgets(await api("/api/budget")); }
    catch { setError("budgets load failed"); } finally { setBusy(null); }
  }
  async function createBudget() {
    if (!budgetTaskId.trim()) return;
    setBusy("budgets-create"); setError(null);
    try {
      await api("/api/budget/create", { method: "POST", body: JSON.stringify({ taskId: budgetTaskId.trim() }) });
      setBudgetTaskId("");
      await loadBudgets();
    } catch { setError("budget create failed"); } finally { setBusy(null); }
  }

  return (
    <div className="status-overlay" role="dialog" aria-label="Management Center">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">Management</div>
            <div className="status-panel__page-title">
              {pickText(lang, "គោលដៅ, គំនិត, ផែនការ, ការពិសោធន៍, និងថវិកា", "Goals, ideas, plans, experiments, and budgets")}
            </div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        {error && <div className="status-card__err">{error}</div>}

        {/* Goals */}
        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{pickText(lang, "គោលដៅ", "Goals")}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)}
            placeholder={pickText(lang, "ចំណងជើងគោលដៅថ្មី", "New goal title")} />
          <button disabled={busy === "goals-create" || !goalTitle.trim()} onClick={createGoal}>
            {pickText(lang, "បង្កើត", "Create")}
          </button>
          <button disabled={busy === "goals-load"} onClick={loadGoals}>
            {pickText(lang, "ផ្ទុក", "Load")}
          </button>
        </div>
        {goals !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={goals} /></div>}

        {/* Ideas */}
        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{pickText(lang, "គំនិត", "Ideas")}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)}
            placeholder={pickText(lang, "គំនិតថ្មី", "New idea title")} />
          <button disabled={busy === "ideas-create" || !ideaTitle.trim()} onClick={createIdea}>
            {pickText(lang, "បង្កើត", "Create")}
          </button>
          <button disabled={busy === "ideas-load"} onClick={loadIdeas}>
            {pickText(lang, "ផ្ទុក", "Load")}
          </button>
        </div>
        {ideas !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={ideas} /></div>}

        {/* Plans */}
        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{pickText(lang, "ផែនការ", "Plans")}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={planTitle} onChange={(e) => setPlanTitle(e.target.value)}
            placeholder={pickText(lang, "ផែនការថ្មី", "New plan title")} />
          <button disabled={busy === "plans-create" || !planTitle.trim()} onClick={createPlan}>
            {pickText(lang, "បង្កើត", "Create")}
          </button>
          <button disabled={busy === "plans-load"} onClick={loadPlans}>
            {pickText(lang, "ផ្ទុក", "Load")}
          </button>
        </div>
        {plans !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={plans} /></div>}

        {/* Experiments */}
        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{pickText(lang, "ការពិសោធន៍", "Experiments")}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={experimentTitle} onChange={(e) => setExperimentTitle(e.target.value)}
            placeholder={pickText(lang, "ការពិសោធន៍ថ្មី", "New experiment title")} />
          <button disabled={busy === "experiments-create" || !experimentTitle.trim()} onClick={createExperiment}>
            {pickText(lang, "បង្កើត", "Create")}
          </button>
          <button disabled={busy === "experiments-load"} onClick={loadExperiments}>
            {pickText(lang, "ផ្ទុក", "Load")}
          </button>
        </div>
        {experiments !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={experiments} /></div>}

        {/* Budgets */}
        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{pickText(lang, "ថវិកា", "Budgets")}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={budgetTaskId} onChange={(e) => setBudgetTaskId(e.target.value)}
            placeholder={pickText(lang, "Task ID", "Task ID")} />
          <button disabled={busy === "budgets-create" || !budgetTaskId.trim()} onClick={createBudget}>
            {pickText(lang, "បង្កើត", "Create")}
          </button>
          <button disabled={busy === "budgets-load"} onClick={loadBudgets}>
            {pickText(lang, "ផ្ទុក", "Load")}
          </button>
        </div>
        {budgets !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={budgets} /></div>}
      </div>
    </div>
  );
}
