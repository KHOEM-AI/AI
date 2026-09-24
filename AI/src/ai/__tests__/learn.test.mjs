import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

let tmpHome;

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      homedir: () => globalThis.__TEST_HOME__,
    },
    homedir: () => globalThis.__TEST_HOME__,
  };
});

let handleLearn, load;

beforeEach(async () => {
  vi.resetModules();
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "khoem-learn-test-"));
  globalThis.__TEST_HOME__ = tmpHome;
  const mod = await import("../learn.mjs");
  handleLearn = mod.handleLearn;
  load = mod.load;
});

afterEach(() => {
  fs.rmSync(tmpHome, { recursive: true, force: true });
  delete globalThis.__TEST_HOME__;
});

describe("load", () => {
  it("returns {} when no learned file exists yet", () => {
    expect(load()).toEqual({});
  });

  it("returns the parsed contents once something has been learned", () => {
    handleLearn("/learn សួស្ដី = សួស្ដីបង!");
    expect(load()).toEqual({ "សួស្ដី": "សួស្ដីបង!" });
  });
});

describe("/learn", () => {
  it("saves a new question/answer pair and confirms with a count", () => {
    const res = handleLearn("/learn តើអ្នកជានរណា = ខ្ញុំជា AI");
    expect(res).toContain("បានរៀនហើយ");
    expect(res).toContain("1");
    expect(load()).toEqual({ "តើអ្នកជានរណា": "ខ្ញុំជា AI" });
  });

  it("normalizes the key (trims, lowercases, collapses spaces, strips trailing punctuation)", () => {
    handleLearn("/learn  Hello World?  =  Hi there  ");
    expect(load()).toEqual({ "hello world": "Hi there" });
  });

  it("returns the format hint when there is no '=' separator", () => {
    const res = handleLearn("/learn just a question");
    expect(res).toBe("ទម្រង់: /learn សំណួរ = ចម្លើយ");
    expect(load()).toEqual({});
  });

  it("returns the format hint when the key is empty", () => {
    const res = handleLearn("/learn  = some answer");
    expect(res).toBe("ទម្រង់: /learn សំណួរ = ចម្លើយ");
  });

  it("returns the format hint when the answer is empty", () => {
    const res = handleLearn("/learn some question = ");
    expect(res).toBe("ទម្រង់: /learn សំណួរ = ចម្លើយ");
  });

  it("rejects a key that starts with a slash", () => {
    const res = handleLearn("/learn /admin = hacked");
    expect(res).toBe("សំណួរមិនអាចចាប់ផ្តើមដោយ / បានទេ");
    expect(load()).toEqual({});
  });

  it("overwrites an existing key and keeps the count accurate", () => {
    handleLearn("/learn foo = bar");
    const res = handleLearn("/learn foo = baz");
    expect(res).toContain("1");
    expect(load()).toEqual({ foo: "baz" });
  });

  it("increments the reported count as more entries are added", () => {
    handleLearn("/learn a = 1");
    const res = handleLearn("/learn b = 2");
    expect(res).toContain("2");
  });
});

describe("/forget", () => {
  it("removes a previously learned key", () => {
    handleLearn("/learn foo = bar");
    const res = handleLearn("/forget foo");
    expect(res).toBe("បានភ្លេចហើយ: foo");
    expect(load()).toEqual({});
  });

  it("returns a not-found message for an unknown key", () => {
    const res = handleLearn("/forget nope");
    expect(res).toBe("ប្អូនមិនធ្លាប់រៀនអំពី: nope");
  });

  it("normalizes the key before looking it up", () => {
    handleLearn("/learn Hello = Hi");
    const res = handleLearn("/forget   HELLO  ");
    expect(res).toBe("បានភ្លេចហើយ: hello");
  });
});

describe("/learned", () => {
  it("reports nothing learned yet when empty", () => {
    const res = handleLearn("/learned");
    expect(res).toContain("មិនទាន់បានរៀនអ្វីទេ");
  });

  it("lists every learned key", () => {
    handleLearn("/learn a = 1");
    handleLearn("/learn b = 2");
    const res = handleLearn("/learned");
    expect(res).toContain("2 ចំណុច");
    expect(res).toContain("- a");
    expect(res).toContain("- b");
  });
});

describe("/stats", () => {
  it("reports zero counts when nothing has been learned", () => {
    const res = handleLearn("/stats");
    expect(res).toContain("ចំនុចដែលបានរៀន: 0");
    expect(res).toContain("ប្រវែងចម្លើយជាមធ្យម: 0 តួអក្សរ");
  });

  it("reports the correct count and average answer length", () => {
    handleLearn("/learn a = 1234");
    handleLearn("/learn b = 12345678");
    const res = handleLearn("/stats");
    expect(res).toContain("ចំនុចដែលបានរៀន: 2");
    expect(res).toContain("ប្រវែងចម្លើយជាមធ្យម: 6 តួអក្សរ");
  });
});

describe("plain-text lookup", () => {
  it("returns the exact answer for an exact (normalized) match", () => {
    handleLearn("/learn What is your name? = Khoem");
    expect(handleLearn("what is your name")).toBe("Khoem");
  });

  it("suggests a close match above the fuzzy threshold but below exact", () => {
    handleLearn("/learn hello there = hi");
    const res = handleLearn("hello");
    expect(res).toContain("តើបងចង់សួរ");
    expect(res).toContain("hello there");
  });

  it("returns null when nothing is close enough to match", () => {
    handleLearn("/learn hello = hi");
    expect(handleLearn("completely unrelated topic xyz")).toBeNull();
  });

  it("returns null on an empty learned set", () => {
    expect(handleLearn("anything")).toBeNull();
  });

  it("ignores lines starting with / for plain-text lookup (handled by commands above)", () => {
    expect(handleLearn("/unknown")).toBeNull();
  });
});

describe("backups", () => {
  it("creates a backup file after the second save", () => {
    handleLearn("/learn a = 1");
    handleLearn("/learn b = 2");
    const backupDir = path.join(tmpHome, "khoem-learned-backups");
    expect(fs.existsSync(backupDir)).toBe(true);
    const files = fs.readdirSync(backupDir);
    expect(files.length).toBeGreaterThanOrEqual(1);
  });

  it("does not error when saving for the very first time (no prior file to back up)", () => {
    expect(() => handleLearn("/learn a = 1")).not.toThrow();
  });
});
