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

export default function ManagementCenter({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguageCode();
  const k = useKhoem(lang);
  const kk = (key: string, fb: string) => k(key) || fb;

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

  const [goalDetailId, setGoalDetailId] = useState("");
  const [goalDetail, setGoalDetail] = useState<unknown | null>(null);

  const [ideaRank, setIdeaRank] = useState<unknown | null>(null);

  const [planDetailId, setPlanDetailId] = useState("");
  const [planDetail, setPlanDetail] = useState<unknown | null>(null);

  const [experimentDetailId, setExperimentDetailId] = useState("");
  const [experimentDetail, setExperimentDetail] = useState<unknown | null>(null);
  const [experimentTransitionTo, setExperimentTransitionTo] = useState("");

  const [budgetDetailTaskId, setBudgetDetailTaskId] = useState("");
  const [budgetDetail, setBudgetDetail] = useState<unknown | null>(null);

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

  async function loadGoalDetail() {
    if (!goalDetailId.trim()) return;
    setBusy("goal-detail"); setError(null);
    try { setGoalDetail(await api(`/api/goals/${encodeURIComponent(goalDetailId.trim())}/progress`)); }
    catch { setError("goal detail failed"); } finally { setBusy(null); }
  }

  async function loadIdeaRank() {
    setBusy("idea-rank"); setError(null);
    try { setIdeaRank(await api("/api/ideas/rank")); }
    catch { setError("idea rank failed"); } finally { setBusy(null); }
  }

  async function loadPlanDetail() {
    if (!planDetailId.trim()) return;
    setBusy("plan-detail"); setError(null);
    try { setPlanDetail(await api(`/api/plans/${encodeURIComponent(planDetailId.trim())}`)); }
    catch { setError("plan detail failed"); } finally { setBusy(null); }
  }

  async function loadExperimentDetail() {
    if (!experimentDetailId.trim()) return;
    setBusy("experiment-detail"); setError(null);
    try { setExperimentDetail(await api(`/api/experiments/${encodeURIComponent(experimentDetailId.trim())}`)); }
    catch { setError("experiment detail failed"); } finally { setBusy(null); }
  }

  async function transitionExperiment() {
    if (!experimentDetailId.trim() || !experimentTransitionTo.trim()) return;
    setBusy("experiment-transition"); setError(null);
    try {
      await api(`/api/experiments/${encodeURIComponent(experimentDetailId.trim())}/transition`, {
        method: "POST",
        body: JSON.stringify({ to: experimentTransitionTo.trim() }),
      });
      setExperimentTransitionTo("");
      await loadExperimentDetail();
    } catch { setError("experiment transition failed"); } finally { setBusy(null); }
  }

  async function loadBudgetDetail() {
    if (!budgetDetailTaskId.trim()) return;
    setBusy("budget-detail"); setError(null);
    try { setBudgetDetail(await api(`/api/budget/${encodeURIComponent(budgetDetailTaskId.trim())}`)); }
    catch { setError("budget detail failed"); } finally { setBusy(null); }
  }

  return (
    <div className="status-overlay" role="dialog" aria-label="Management Center">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">Management</div>
            <div className="status-panel__page-title">
              {kk("ai.menu.management01", pickText(lang, "គោលដៅ, គំនិត, ផែនការ, ការពិសោធន៍, និងថវិកា", "Goals, ideas, plans, experiments, and budgets"))}
            </div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        {error && <div className="status-card__err">{error}</div>}

        {/* Goals */}
        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{kk("ai.menu.management02", pickText(lang, "គោលដៅ", "Goals"))}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)}
            placeholder={kk("ai.menu.management03", pickText(lang, "ចំណងជើងគោលដៅថ្មី", "New goal title"))} />
          <button disabled={busy === "goals-create" || !goalTitle.trim()} onClick={createGoal}>
            {kk("ai.menu.management04", pickText(lang, "បង្កើត", "Create"))}
          </button>
          <button disabled={busy === "goals-load"} onClick={loadGoals}>
            {kk("ai.menu.management05", pickText(lang, "ផ្ទុក", "Load"))}
          </button>
        </div>
        {goals !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={goals} /></div>}

        {/* Ideas */}
        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{kk("ai.menu.management06", pickText(lang, "គំនិត", "Ideas"))}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)}
            placeholder={kk("ai.menu.management07", pickText(lang, "គំនិតថ្មី", "New idea title"))} />
          <button disabled={busy === "ideas-create" || !ideaTitle.trim()} onClick={createIdea}>
            {kk("ai.menu.management04", pickText(lang, "បង្កើត", "Create"))}
          </button>
          <button disabled={busy === "ideas-load"} onClick={loadIdeas}>
            {kk("ai.menu.management05", pickText(lang, "ផ្ទុក", "Load"))}
          </button>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={goalDetailId} onChange={(e) => setGoalDetailId(e.target.value)}
            placeholder="Goal ID" />
          <button disabled={busy === "goal-detail" || !goalDetailId.trim()} onClick={loadGoalDetail}>
            {kk("ai.menu.management08", pickText(lang, "មើលវឌ្ឍនភាព", "View progress"))}
          </button>
        </div>
        {goalDetail !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={goalDetail} /></div>}

        {ideas !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={ideas} /></div>}
        <div className="status-panel__meta" style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button disabled={busy === "idea-rank"} onClick={loadIdeaRank}>
            {kk("ai.menu.management09", pickText(lang, "ចាត់ចំណាត់ថ្នាក់តាមអាទិភាព", "Rank by priority"))}
          </button>
        </div>
        {ideaRank !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={ideaRank} /></div>}

        {/* Plans */}
        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{kk("ai.menu.management10", pickText(lang, "ផែនការ", "Plans"))}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={planTitle} onChange={(e) => setPlanTitle(e.target.value)}
            placeholder={kk("ai.menu.management11", pickText(lang, "ផែនការថ្មី", "New plan title"))} />
          <button disabled={busy === "plans-create" || !planTitle.trim()} onClick={createPlan}>
            {kk("ai.menu.management04", pickText(lang, "បង្កើត", "Create"))}
          </button>
          <button disabled={busy === "plans-load"} onClick={loadPlans}>
            {kk("ai.menu.management05", pickText(lang, "ផ្ទុក", "Load"))}
          </button>
        </div>
        {plans !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={plans} /></div>}
        <div className="status-panel__meta" style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={planDetailId} onChange={(e) => setPlanDetailId(e.target.value)}
            placeholder="Plan ID" />
          <button disabled={busy === "plan-detail" || !planDetailId.trim()} onClick={loadPlanDetail}>
            {kk("ai.menu.management12", pickText(lang, "មើលលម្អិត", "View detail"))}
          </button>
        </div>
        {planDetail !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={planDetail} /></div>}

        {/* Experiments */}
        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{kk("ai.menu.management13", pickText(lang, "ការពិសោធន៍", "Experiments"))}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={experimentTitle} onChange={(e) => setExperimentTitle(e.target.value)}
            placeholder={kk("ai.menu.management14", pickText(lang, "ការពិសោធន៍ថ្មី", "New experiment title"))} />
          <button disabled={busy === "experiments-create" || !experimentTitle.trim()} onClick={createExperiment}>
            {kk("ai.menu.management04", pickText(lang, "បង្កើត", "Create"))}
          </button>
          <button disabled={busy === "experiments-load"} onClick={loadExperiments}>
            {kk("ai.menu.management05", pickText(lang, "ផ្ទុក", "Load"))}
          </button>
        </div>
        {experiments !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={experiments} /></div>}
        <div className="status-panel__meta" style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={experimentDetailId} onChange={(e) => setExperimentDetailId(e.target.value)}
            placeholder="Experiment ID" />
          <button disabled={busy === "experiment-detail" || !experimentDetailId.trim()} onClick={loadExperimentDetail}>
            {kk("ai.menu.management12", pickText(lang, "មើលលម្អិត", "View detail"))}
          </button>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={experimentTransitionTo} onChange={(e) => setExperimentTransitionTo(e.target.value)}
            placeholder={kk("ai.menu.management15", pickText(lang, "ដំណាក់កាលថ្មី", "new status"))} />
          <button disabled={busy === "experiment-transition" || !experimentDetailId.trim() || !experimentTransitionTo.trim()} onClick={transitionExperiment}>
            {kk("ai.menu.management16", pickText(lang, "ប្តូរដំណាក់កាល", "Transition"))}
          </button>
        </div>
        {experimentDetail !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={experimentDetail} /></div>}

        {/* Budgets */}
        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{kk("ai.menu.management17", pickText(lang, "ថវិកា", "Budgets"))}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={budgetTaskId} onChange={(e) => setBudgetTaskId(e.target.value)}
            placeholder={kk("ai.menu.management18", pickText(lang, "Task ID", "Task ID"))} />
          <button disabled={busy === "budgets-create" || !budgetTaskId.trim()} onClick={createBudget}>
            {kk("ai.menu.management04", pickText(lang, "បង្កើត", "Create"))}
          </button>
          <button disabled={busy === "budgets-load"} onClick={loadBudgets}>
            {kk("ai.menu.management05", pickText(lang, "ផ្ទុក", "Load"))}
          </button>
        </div>
        {budgets !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={budgets} /></div>}
        <div className="status-panel__meta" style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={budgetDetailTaskId} onChange={(e) => setBudgetDetailTaskId(e.target.value)}
            placeholder="Task ID" />
          <button disabled={busy === "budget-detail" || !budgetDetailTaskId.trim()} onClick={loadBudgetDetail}>
            {kk("ai.menu.management12", pickText(lang, "មើលលម្អិត", "View detail"))}
          </button>
        </div>
        {budgetDetail !== null && <div className="status-grid" style={{ marginTop: 8 }}><JsonBlock data={budgetDetail} /></div>}
      </div>
    </div>
  );
}
