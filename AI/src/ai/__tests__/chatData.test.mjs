// Copyright (c) 2026 KHOEM-AI. Licensed under the MIT License.
// Guards the matching rules in chatData.mjs using a private fixture folder.
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

let dir;
let prevEnv;
let findChatReply;

const RULES = [
  { keys: ["សប្បាយ"], km: ["ល្អណាស់!"], en: ["Nice!"] },
  { keys: ["ហត់"], km: ["សម្រាកទៅ{pro}"], en: ["Rest up{pro}"] },
  { keys: ["=បាទ"], km: ["ចាស!"], en: ["Yes!"] },
  { keys: ["hello", "=hi"], km: ["សួស្ដី"], en: ["Hi!"] },
  { keys: ["អាកាសធាតុ"], km: ["ពិនិត្យកម្មវិធីអាកាសធាតុ"], en: ["Check a weather app"] },
];

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "khoem-chatdata-"));
  mkdirSync(path.join(dir, "data", "chat"), { recursive: true });
  writeFileSync(
    path.join(dir, "data", "index.json"),
    JSON.stringify({ datasets: [{ path: "data/chat/test.json" }, { path: "data/colors/x.json" }] }),
  );
  writeFileSync(path.join(dir, "data", "chat", "test.json"), JSON.stringify({ items: RULES }));
  prevEnv = process.env.CHAT_DATA_DIR;
  process.env.CHAT_DATA_DIR = dir; // ROOT is read at import time, so set it first
  ({ findChatReply } = await import("../chatData.mjs"));
});

afterAll(() => {
  if (prevEnv === undefined) delete process.env.CHAT_DATA_DIR;
  else process.env.CHAT_DATA_DIR = prevEnv;
  rmSync(dir, { recursive: true, force: true });
});

afterEach(() => vi.restoreAllMocks());

describe("chatData.findChatReply — matching", () => {
  it("answers a short Khmer sentence that contains a key", async () => {
    expect(await findChatReply("ខ្ញុំសប្បាយ")).toBe("ល្អណាស់!");
  });

  it("falls through (null) when the sentence is negated", async () => {
    expect(await findChatReply("ខ្ញុំមិនសប្បាយចិត្តទេ")).toBeNull();
    expect(await findChatReply("មិនហត់")).toBeNull(); // short, negation only
  });

  it("falls through (null) when the sentence is much longer than the key", async () => {
    expect(await findChatReply("ថ្ងៃនេះខ្ញុំសប្បាយខ្លាំងណាស់ដោយសារបានជាប់ការងារ")).toBeNull();
    expect(await findChatReply("សូមពន្យល់ពីអាកាសធាតុនៅកម្ពុជាឱ្យបានលម្អិត")).toBeNull();
  });

  it("still answers the bare key", async () => {
    expect(await findChatReply("អាកាសធាតុ")).toBe("ពិនិត្យកម្មវិធីអាកាសធាតុ");
  });

  it("'=' keys need an exact match", async () => {
    expect(await findChatReply("បាទ")).toBe("ចាស!");
    expect(await findChatReply("បាទ ខ្ញុំយល់ហើយ")).toBeNull();
  });

  it("ASCII keys need an exact match, not a substring", async () => {
    expect(await findChatReply("hello")).toBe("Hi!");
    expect(await findChatReply("say hello to everyone")).toBeNull();
    expect(await findChatReply("this")).toBeNull(); // must not match 'hi'
  });

  it("returns null for empty or unknown input", async () => {
    expect(await findChatReply("")).toBeNull();
    expect(await findChatReply("   ")).toBeNull();
    expect(await findChatReply("ឡូឡាឡាឡា")).toBeNull();
  });
});

describe("chatData.findChatReply — {pro} handling", () => {
  it("adds ប្រូ when the random roll is under 0.5", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    expect(await findChatReply("ខ្ញុំហត់")).toBe("សម្រាកទៅប្រូ");
  });

  it("omits ប្រូ when the random roll is 0.5 or more", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    expect(await findChatReply("ខ្ញុំហត់")).toBe("សម្រាកទៅ");
  });

  it("never leaks a literal {pro} and strips it from English", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    expect(await findChatReply("ខ្ញុំហត់")).not.toContain("{pro}");
    expect(await findChatReply("hello")).toBe("Hi!");
  });
});
