import { getTool, describeToolRisk } from "./toolRegistry.mjs";
import { recordAuditEvent } from "./audit.mjs";
import {
  createApprovalRequest,
  verifyBeforeExecution,
  markExecuted,
} from "./approvals.mjs";

function auditTool(tool, actor, event, extra = {}) {
  recordAuditEvent(event, {
    toolId: tool?.id,
    action: tool?.action,
    actor,
    ...extra,
  });
}

export async function executeTool({
  toolId,
  actor = "user",
  input = {},
  execute,
  approvalId = null,
}) {
  const tool = getTool(toolId);

  if (!tool) {
    recordAuditEvent("tool.execution.denied", {
      toolId,
      actor,
      reason: "unknown_tool",
    });

    throw Object.assign(
      new Error(`Unknown tool: ${toolId}`),
      { status: 404 },
    );
  }

  if (typeof execute !== "function") {
    auditTool(tool, actor, "tool.execution.denied", {
      reason: "execute_function_required",
    });

    throw Object.assign(
      new Error("execute function is required"),
      { status: 400 },
    );
  }

  const riskInfo = describeToolRisk(toolId, actor);

  if (!riskInfo?.policy) {
    auditTool(tool, actor, "tool.execution.denied", {
      reason: "policy_unavailable",
    });

    throw Object.assign(
      new Error("Tool policy unavailable"),
      { status: 403 },
    );
  }

  const policy = riskInfo.policy;

  if (policy.decision === "DENY") {
    auditTool(tool, actor, "tool.execution.denied", {
      reason: "policy_denied",
      risk: policy.risk,
    });

    throw Object.assign(
      new Error(`Tool execution denied: ${toolId}`),
      { status: 403 },
    );
  }

  /*
   * HIGH / CRITICAL:
   * First call creates an approval request.
   * Second call must provide approvalId and pass
   * verifyBeforeExecution() immediately before execution.
   */
  if (policy.decision === "REQUIRE_APPROVAL") {
    if (!approvalId) {
      const approval = createApprovalRequest({
        action: tool.action,
        actor,
        permission: policy.permission,
        risk: policy.risk,
        reason: `Tool ${toolId} requires human approval`,
        target: input?.target ?? null,
        resource: input?.resource ?? null,
        metadata: {
          toolId,
        },
      });

      auditTool(tool, actor, "tool.execution.approval_required", {
        risk: policy.risk,
        approvalId: approval.id,
      });

      return {
        status: "REQUIRES_APPROVAL",
        tool,
        policy,
        approvalId: approval.id,
        approval,
        input,
      };
    }

    const verification = verifyBeforeExecution(approvalId, {
      action: tool.action,
      target: input?.target ?? null,
    });

    if (!verification.ok) {
      auditTool(tool, actor, "tool.execution.denied", {
        reason: verification.error,
        risk: policy.risk,
        approvalId,
      });

      throw Object.assign(
        new Error(`Approval verification failed: ${verification.error}`),
        { status: 403 },
      );
    }
  }

  auditTool(tool, actor, "tool.execution.started", {
    risk: policy.risk,
    approvalId,
  });

  try {
    const result = await execute({
      tool,
      input,
      actor,
    });

    if (approvalId) {
      markExecuted(approvalId);
    }

    auditTool(tool, actor, "tool.execution.completed", {
      risk: policy.risk,
      approvalId,
    });

    return {
      status: "EXECUTED",
      tool,
      policy,
      approvalId,
      result,
    };
  } catch (error) {
    auditTool(tool, actor, "tool.execution.failed", {
      risk: policy.risk,
      approvalId,
      error: error?.message || String(error),
    });

    throw error;
  }
}
