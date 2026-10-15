import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../khoem.mjs", () => ({
  khoemReply: vi.fn(async () => "test reply"),
}));

import { AICore } from "../core.mjs";
import { AIMemory } from "../memory.mjs";

describe("AICore memory history", () => {
  let memory;
  let core;

  beforeEach(() => {
    memory = new AIMemory({ maxMessages: 50 });
    core = new AICore({ memory });
  });

  it("does not duplicate a repeated conversation history", async () => {
    const history = [
      { role: "user", content: "សួស្តី" },
      { role: "assistant", content: "ជំរាបសួរ" },
      { role: "user", content: "សុខសប្បាយទេ?" },
    ];

    await core.chat(history, { sessionId: "test-session" });
    await core.chat(history, { sessionId: "test-session" });

    expect(memory.get("test-session").map(({ role, content }) => ({
      role,
      content,
    }))).toEqual([
      ...history,
      { role: "assistant", content: "test reply" },
    ]);
  });

  it("replaces stale assistant replies when regenerating", async () => {
    const originalHistory = [
      { role: "user", content: "សួស្តី" },
      { role: "assistant", content: "ចម្លើយចាស់" },
    ];

    await core.chat(originalHistory, { sessionId: "test-session" });

    const regeneratedHistory = [
      { role: "user", content: "សួស្តី" },
    ];

    await core.chat(regeneratedHistory, { sessionId: "test-session" });

    expect(memory.get("test-session").map(({ role, content }) => ({
      role,
      content,
    }))).toEqual([
      { role: "user", content: "សួស្តី" },
      { role: "assistant", content: "test reply" },
    ]);
  });

  it("keeps a new conversation separate from the previous history", async () => {
    await core.chat(
      [{ role: "user", content: "សន្ទនាចាស់" }],
      { sessionId: "test-session" },
    );

    await core.chat(
      [{ role: "user", content: "សន្ទនាថ្មី" }],
      { sessionId: "test-session" },
    );

    expect(memory.get("test-session").map(({ content }) => content)).toEqual([
      "សន្ទនាថ្មី",
      "test reply",
    ]);
  });
});
