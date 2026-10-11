import { describe, it, expect } from "vitest";
import { buildShotList, splitBeats } from "../shotlist.mjs";

describe("shotlist", () => {
  it("splits text into beats", () => {
    expect(splitBeats("A one.\nB two. C three!")).toEqual(["A one.", "B two.", "C three!"]);
  });
  it("matches characters, assets and voices by name", () => {
    const r = buildShotList({
      title: "t",
      beats: ["Sok walks to the market", "Night falls"],
      characters: [{ id: "c1", name: "Sok", prompt: "p" }],
      assets: [{ id: "a1", nameEn: "market" }],
      voices: { c1: "voiceA" },
    });
    expect(r.total).toBe(2);
    expect(r.shots[0].characters[0]).toMatchObject({ id: "c1", name: "Sok", voice: "voiceA" });
    expect(r.shots[0].asset).toMatchObject({ id: "a1", name: "market" });
    expect(r.shots[1].characters).toEqual([]);
    expect(r.shots[1].asset).toBeNull();
  });
  it("caps maxShots and sums duration", () => {
    const r = buildShotList({ beats: ["a", "b", "c", "d"], maxShots: 2 });
    expect(r.total).toBe(2);
    expect(r.durationSec).toBe(r.shots.reduce((a, s) => a + s.durationSec, 0));
  });
  it("handles empty or bad input without throwing", () => {
    expect(buildShotList().total).toBe(0);
    expect(buildShotList({ beats: null, characters: "x", assets: 5, voices: null }).total).toBe(0);
  });
  it("does not mutate inputs", () => {
    const beats = ["Sok runs"]; const characters = [{ id: "c", name: "Sok" }];
    const a = JSON.stringify({ beats, characters });
    buildShotList({ beats, characters });
    expect(JSON.stringify({ beats, characters })).toBe(a);
  });
});
