// src/ai/enginesSummary.mjs — counts/status only, for the unauthenticated Control Center feed.
// Deliberately exposes NO titles, goals, descriptions or other user-entered text.
import { listIdeas } from "./ideas.mjs";
import { listPlans } from "./planning.mjs";
import { listExperiments } from "./experiments.mjs";

const tally = (arr, key) =>
  arr.reduce((m, x) => {
    m[x[key]] = (m[x[key]] || 0) + 1;
    return m;
  }, {});

export function summarizeEngines() {
  const ideas = listIdeas();
  const plans = listPlans();
  const experiments = listExperiments();
  return {
    ideas: { total: ideas.length, byRisk: tally(ideas, "risk") },
    plans: {
      total: plans.length,
      byStatus: tally(plans, "status"),
      needingApproval: plans.filter((p) => p.requiresApproval).length,
    },
    experiments: { total: experiments.length, byStatus: tally(experiments, "status") },
  };
}
