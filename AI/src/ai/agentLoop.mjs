// src/ai/agentLoop.mjs — goal -> task -> plan -> tools -> verify -> selfEval (additive, standalone)
import { createTask, transition, setExecution, setCognitive, getTask } from "./tasks.mjs";
import { createGoal, linkTaskToGoal, linkPlanToGoal, setGoalStatus, GOAL_STATUS } from "./goal.mjs";
import { createPlan } from "./planning.mjs";
import { executeTool } from "./toolExecutor.mjs";
import { selfEvaluate, EVAL } from "./selfEval.mjs";
import { recordAuditEvent } from "./audit.mjs";

/**
 * runAgent({ goal, steps, verificationCriteria, rollbackPlan, runners, verify, actor })
 *  - steps:   [{ description, risk?, tools?: [toolId], input?: {} }]
 *  - runners: { [toolId]: async (input) => result }   (passed to executeTool as `execute`)
 *  - verify:  async () => true | false | { passed, evidence: [] }
 */
export async function runAgent({
  goal,
  steps,
  verificationCriteria = [],
  rollbackPlan = "",
  runners = {},
  verify = null,
  actor = "agent",
} = {}) {
  const goalRec = createGoal(goal);
  const task = createTask({ goalId: goalRec.id, kind: "agent-loop" });
  const id = task.taskId;
  linkTaskToGoal(goalRec.id, id);
  transition(id, "QUEUED", "agent loop queued");
  transition(id, "RUNNING", "agent loop started");

  const evidence = [];
  let planId = null;
  const results = [];

  const base = () => ({ taskId: id, goalId: goalRec.id, planId, evidence });

  const fail = (reason, extra = {}) => {
    const t = getTask(id);
    if (t && (t.state === "RUNNING" || t.state === "WAITING")) {
      transition(id, "FAILED", reason);
    }
    recordAuditEvent("agent.loop.failed", { taskId: id, reason });
    return { status: "FAILED", reason, ...base(), ...extra };
  };

  try {
    setExecution(id, "PROCESSING", "agent started");
    setCognitive(id, "UNDERSTANDING", "goal received");
    setCognitive(id, "PLANNING", "building plan");

    const plan = createPlan({ goal, steps, verificationCriteria, rollbackPlan });
    planId = plan.planId;
    linkPlanToGoal(goalRec.id, planId);

    if (plan.status !== "VALID") {
      return fail(`plan invalid: ${plan.validation.problems.join(", ")}`);
    }

    if (plan.requiresApproval) {
      transition(id, "WAITING", "plan needs human approval");
      recordAuditEvent("agent.loop.needs_approval", { taskId: id, planId, risk: plan.risk });
      return { status: "NEEDS_APPROVAL", reason: `plan risk ${plan.risk}`, ...base() };
    }

    setCognitive(id, "REASONING", "executing plan");

    for (const [i, step] of plan.steps.entries()) {
      const input = steps[i]?.input ?? {};
      for (const toolId of step.tools) {
        const execute = runners[toolId];
        if (typeof execute !== "function") {
          return fail(`no runner for tool ${toolId}`);
        }
        setExecution(id, "TOOL_CALL", `step ${step.order}: ${toolId}`);
        const res = await executeTool({ toolId, actor, input, execute: () => execute(input) });
        if (res?.status === "REQUIRES_APPROVAL") {
          transition(id, "WAITING", `tool ${toolId} needs approval`);
          recordAuditEvent("agent.loop.needs_approval", { taskId: id, planId, toolId, approvalId: res.approvalId });
          return { status: "NEEDS_APPROVAL", reason: `tool ${toolId} requires approval`, approvalId: res.approvalId, ...base() };
        }
        results.push({ toolId, status: res?.status, result: res?.result });
        evidence.push(`step ${step.order}: tool ${toolId} executed`);
        setExecution(id, "PROCESSING", `step ${step.order} done`);
      }
    }

    setCognitive(id, "VERIFYING", "checking result");
    let testsPassed;
    if (typeof verify === "function") {
      const v = await verify({ results });
      testsPassed = typeof v === "object" && v !== null ? v.passed === true : v === true;
      const extra = typeof v === "object" && v !== null && Array.isArray(v.evidence) ? v.evidence : [];
      evidence.push(`verify: ${testsPassed ? "passed" : "failed"}`, ...extra);
    }

    const evaluation = selfEvaluate({
      goalAchieved: testsPassed === true,
      testsPassed,
      evidence,
      remaining: [],
    });

    setCognitive(id, "ANSWERING", "result ready");
    setExecution(id, "RESPONDING", "result ready");
    setExecution(id, "IDLE", "done");
    setCognitive(id, "IDLE", "done");

    if (evaluation.result === EVAL.SUCCESS) {
      transition(id, "COMPLETED", evaluation.reason);
      setGoalStatus(goalRec.id, GOAL_STATUS.COMPLETED);
      recordAuditEvent("agent.loop.completed", { taskId: id, planId });
      return { status: "SUCCESS", evaluation, ...base() };
    }

    transition(id, "FAILED", `${evaluation.result}: ${evaluation.reason}`);
    recordAuditEvent("agent.loop.not_success", { taskId: id, result: evaluation.result });
    return { status: evaluation.result, evaluation, ...base() };
  } catch (err) {
    return fail(`exception: ${err?.message ?? err}`);
  }
}
