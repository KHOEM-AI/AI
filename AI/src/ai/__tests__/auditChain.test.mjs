import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { recordAuditEvent, verifyAuditChain } from "../audit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, "..", "..", "..", "data", "audit-log.test.jsonl");

describe("audit.mjs — tamper-evident hash chain", () => {
  beforeEach(() => {
    fs.rmSync(LOG_FILE, { force: true });
  });
  it("verifies a valid, untouched chain", () => {
    recordAuditEvent("TEST_EVENT_1", { note: "chain test" });
    recordAuditEvent("TEST_EVENT_2", { note: "chain test" });
    const result = verifyAuditChain();
    expect(result.valid).toBe(true);
  });

  it("detects tampering when a line's data is edited after the fact", () => {
    recordAuditEvent("TEST_EVENT_3", { note: "before tamper" });
    const lines = fs.readFileSync(LOG_FILE, "utf8").trim().split("\n");
    const last = JSON.parse(lines[lines.length - 1]);
    last.data.note = "TAMPERED"; // edit content but keep old hash
    lines[lines.length - 1] = JSON.stringify(last);
    fs.writeFileSync(LOG_FILE, lines.join("\n") + "\n", "utf8");
    const result = verifyAuditChain();
    expect(result.valid).toBe(false);
  });

  it("detects a deleted/removed line breaking the chain", () => {
    recordAuditEvent("TEST_EVENT_4", { note: "a" });
    recordAuditEvent("TEST_EVENT_5", { note: "b" });
    const lines = fs.readFileSync(LOG_FILE, "utf8").trim().split("\n");
    lines.splice(lines.length - 2, 1); // remove second-to-last line
    fs.writeFileSync(LOG_FILE, lines.join("\n") + "\n", "utf8");
    const result = verifyAuditChain();
    expect(result.valid).toBe(false);
  });
});
