import { describe, it, expect } from "vitest";
import { checkModelHealth, getModelInfo } from "../model.mjs";

describe("model.mjs", () => {
  it("OFFLINE when no provider", () => {
    expect(checkModelHealth({}, { chat: 0 }).status).toBe("OFFLINE");
  });
  it("READY when idle with provider", () => {
    expect(checkModelHealth({ provider: "khoem-local" }, { chat: 0 }).status).toBe("READY");
  });
  it("ACTIVE when busy", () => {
    expect(checkModelHealth({ provider: "khoem-local" }, { chat: 1 }).status).toBe("ACTIVE");
  });
  it("getModelInfo reflects config", () => {
    expect(getModelInfo({}).configured).toBe(false);
    expect(getModelInfo({ provider: "x" }).configured).toBe(true);
  });
});
