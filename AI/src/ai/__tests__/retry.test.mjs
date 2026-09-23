import { describe, it, expect, vi } from "vitest";
import { retryIdempotent, isRetryable } from "../retry.mjs";

describe("retry.mjs", () => {
  it("succeeds on first try without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const r = await retryIdempotent(fn, { maxRetries: 3, baseDelayMs: 1 });
    expect(r.ok).toBe(true);
    expect(r.attempts).toBe(1);
  });

  it("retries then succeeds", async () => {
    let calls = 0;
    const fn = vi.fn().mockImplementation(() => {
      calls++;
      if (calls < 3) throw new Error("transient");
      return "recovered";
    });
    const r = await retryIdempotent(fn, { maxRetries: 3, baseDelayMs: 1 });
    expect(r.ok).toBe(true);
    expect(r.result).toBe("recovered");
    expect(r.attempts).toBe(3);
  });

  it("gives up after maxRetries and returns the last error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));
    const r = await retryIdempotent(fn, { maxRetries: 2, baseDelayMs: 1 });
    expect(r.ok).toBe(false);
    expect(r.attempts).toBe(3);
    expect(r.error).toBe("always fails");
  });

  it("marks write/mutating actions as non-retryable", () => {
    expect(isRetryable("code.applyPatch")).toBe(false);
    expect(isRetryable("learning.write")).toBe(false);
    expect(isRetryable("tool.scan")).toBe(true);
  });
});
