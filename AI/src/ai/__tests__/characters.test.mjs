import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createItem, listItems, GROUPS } from "../library.mjs";
import { createCharacter, mergeCharacter, getTimeline, buildPrompt, listCharacters } from "../characters.mjs";

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lib-"));
  process.env.LIBRARY_FILE = path.join(dir, "library.json");
});
afterEach(() => {
  delete process.env.LIBRARY_FILE;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("library.mjs", () => {
  it("has 16 groups and rejects bad group/source/name", () => {
    expect(GROUPS).toHaveLength(16);
    expect(createItem({ group: "x", name: "a" }).reason).toBe("bad_group");
    expect(createItem({ group: "food", name: "a", source: "zzz" }).reason).toBe("bad_source");
    expect(createItem({ group: "food", name: "  " }).reason).toBe("empty_name");
  });
  it("filters by group, tag and source", () => {
    createItem({ group: "food", name: "អាម៉ុក", tags: ["khmer"], source: "real" });
    createItem({ group: "fruits", name: "ម្នាស់", source: "ai" });
    expect(listItems({ group: "food" })).toHaveLength(1);
    expect(listItems({ tag: "khmer" })).toHaveLength(1);
    expect(listItems({ source: "ai" })[0].name).toBe("ម្នាស់");
  });
});

describe("characters.mjs", () => {
  it("creates a character in the shared library (group people)", () => {
    const r = createCharacter({ name: "សុខា", identity: { face: "មុខមូល" }, current: { body: "ធាត់" } });
    expect(r.ok).toBe(true);
    expect(r.item.group).toBe("people");
    expect(listCharacters()).toHaveLength(1);
  });

  it("records only what changed, with before/after", () => {
    const { item } = createCharacter({ name: "សុខា", current: { body: "ធាត់", hair: "ខ្លី" } });
    const r = mergeCharacter(item.id, { current: { body: "មាំ", hair: "ខ្លី" }, event: "ហាត់ប្រាណ" });
    expect(r.changed).toBe(1);
    const t = getTimeline(item.id);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ field: "body", before: "ធាត់", after: "មាំ", event: "ហាត់ប្រាណ" });
  });

  it("does not overwrite original identity without force; reports conflict", () => {
    const { item } = createCharacter({ name: "A", identity: { skinTone: "ស្រអែម" } });
    const r = mergeCharacter(item.id, { identity: { skinTone: "ស" } });
    expect(r.changed).toBe(0);
    expect(r.conflicts).toEqual([{ field: "identity.skinTone", existing: "ស្រអែម", proposed: "ស" }]);
    expect(r.item.data.identity.skinTone).toBe("ស្រអែម");
    const f = mergeCharacter(item.id, { identity: { skinTone: "ស" } }, { force: true });
    expect(f.item.data.identity.skinTone).toBe("ស");
    expect(f.item.history.at(-1).kind).toBe("identity.force");
  });

  it("fills empty identity fields and is idempotent on repeat", () => {
    const { item } = createCharacter({ name: "B" });
    expect(mergeCharacter(item.id, { identity: { marks: "ស្នាមមុន" } }).changed).toBe(1);
    expect(mergeCharacter(item.id, { identity: { marks: "ស្នាមមុន" } }).changed).toBe(0);
  });

  it("keeps outfits without duplicates and builds a prompt", () => {
    const { item } = createCharacter({ name: "C", identity: { face: "វែង" } });
    mergeCharacter(item.id, { outfit: { label: "ធ្វើការ", desc: "ឯកសណ្ឋាន" } });
    mergeCharacter(item.id, { outfit: { label: "ធ្វើការ", desc: "ឯកសណ្ឋាន" } });
    expect(listCharacters()[0].data.outfits).toHaveLength(1);
    expect(buildPrompt(item.id, { outfit: "ធ្វើការ" })).toContain("outfit: ឯកសណ្ឋាន");
  });

  it("returns not_found for unknown id", () => {
    expect(mergeCharacter("nope", {}).reason).toBe("not_found");
    expect(getTimeline("nope")).toBeNull();
  });
});
