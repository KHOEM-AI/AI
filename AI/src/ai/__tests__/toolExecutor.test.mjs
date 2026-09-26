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
