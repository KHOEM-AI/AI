import { describe, it, expect } from "vitest";
import { recordAuditEvent, readRecentAuditEvents } from "../audit.mjs";

describe("audit.mjs", () => {
  it("records and scrubs secrets", () => {
    recordAuditEvent("TEST_EVENT", { password: "secret", note: "ok" });
    const events = readRecentAuditEvents(5);
    const found = events.find((e) => e.event === "TEST_EVENT");
    expect(found).toBeTruthy();
    expect(found.data.password).toBeUndefined();
    expect(found.data.note).toBe("ok");
  });

  it("never throws on circular data", () => {
    const circ = {}; circ.self = circ;
    expect(() => recordAuditEvent("CIRCULAR_TEST", circ)).not.toThrow();
  });
});
