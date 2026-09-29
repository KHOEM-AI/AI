import { describe, it, expect, beforeEach } from "vitest";
import { registerTool } from "../toolRegistry.mjs";
import { executeTool } from "../toolExecutor.mjs";

describe("toolExecutor.mjs", () => {
  beforeEach(() => {
    // Registry is process-global; use unique IDs per test.
  });

  it("executes LOW-risk tools", async () => {
    const id = `scan-${Date.now()}-${Math.random()}`;

    registerTool({
      id,
      action: "tool.scan",
      name: "Scan",
    });

    const result = await executeTool({
      toolId: id,
      actor: "tester",
      input: { target: "repo" },
      execute: async ({ input }) => ({
        found: true,
        target: input.target,
      }),
    });

    expect(result.status).toBe("EXECUTED");
    expect(result.result).toEqual({
      found: true,
      target: "repo",
    });
  });

  it("does not execute HIGH-risk tools without approval", async () => {
    const id = `apply-${Date.now()}-${Math.random()}`;
    let executed = false;

    registerTool({
      id,
      action: "code.applyPatch",
      name: "Apply Patch",
    });

    const result = await executeTool({
      toolId: id,
      actor: "tester",
      execute: async () => {
        executed = true;
        return { changed: true };
      },
    });

    expect(result.status).toBe("REQUIRES_APPROVAL");
    expect(executed).toBe(false);
  });

  it("executes HIGH-risk tools after approval and blocks reuse", async () => {
    const id = `apply-approved-${Date.now()}-${Math.random()}`;
    let executions = 0;

    registerTool({
      id,
      action: "code.applyPatch",
      name: "Apply Patch",
    });

    const pending = await executeTool({
      toolId: id,
      actor: "tester",
      input: {
        target: "proposal-1",
        resource: "src/example.mjs",
      },
      execute: async () => {
        executions += 1;
        return { changed: true };
      },
    });

    expect(pending.status).toBe("REQUIRES_APPROVAL");
    expect(pending.approvalId).toBeTruthy();
    expect(executions).toBe(0);

    const { approveRequest } = await import("../approvals.mjs");
    const approved = approveRequest(
      pending.approvalId,
      "human:reviewer",
      "approved",
    );

    expect(approved.ok).toBe(true);

    const executed = await executeTool({
      toolId: id,
      actor: "tester",
      input: {
        target: "proposal-1",
        resource: "src/example.mjs",
      },
      approvalId: pending.approvalId,
      execute: async () => {
        executions += 1;
        return { changed: true };
      },
    });

    expect(executed.status).toBe("EXECUTED");
    expect(executed.result).toEqual({ changed: true });
    expect(executions).toBe(1);

    await expect(
      executeTool({
        toolId: id,
        actor: "tester",
        input: {
          target: "proposal-1",
          resource: "src/example.mjs",
        },
        approvalId: pending.approvalId,
        execute: async () => {
          executions += 1;
          return { changed: true };
        },
      }),
    ).rejects.toMatchObject({
      status: 403,
    });

    expect(executions).toBe(1);
  });

  it("denies unknown actions", async () => {
    const id = `ghost-${Date.now()}-${Math.random()}`;

    registerTool({
      id,
      action: "nonexistent.action",
      name: "Ghost",
    });

    await expect(
      executeTool({
        toolId: id,
        actor: "tester",
        execute: async () => ({ ok: true }),
      }),
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  it("rejects unknown tools", async () => {
    await expect(
      executeTool({
        toolId: "does-not-exist",
        execute: async () => ({ ok: true }),
      }),
    ).rejects.toMatchObject({
      status: 404,
    });
  });

  it("requires an execute function", async () => {
    const id = `scan-input-${Date.now()}-${Math.random()}`;

    registerTool({
      id,
      action: "tool.scan",
      name: "Scan",
    });

    await expect(
      executeTool({
        toolId: id,
      }),
    ).rejects.toMatchObject({
      status: 400,
    });
  });
});
