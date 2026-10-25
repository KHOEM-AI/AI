import { describe, it, expect } from "vitest";
import { planFromStoryboard, motionFor } from "../videoPlan.mjs";

const mk = (id, status, movement, dur) => ({
  id, status, durationSec: dur, camera: { movement, speed: "normal" },
  dialogue: [{ speaker: "narrator", text: "សួស្តី" }],
});
const sb = { id: "sb1", title: "T", aspect: "9:16",
  scenes: [mk("a", "approved", "zoom", 4), mk("b", "draft", "pan", 3), mk("c", "approved", "orbit", 6)] };

describe("videoPlan", () => {
  it("យកតែ scene approved ហើយគណនាពេលវេលា", () => {
    const p = planFromStoryboard(sb);
    expect(p.ok).toBe(true);
    expect(p.scenes.map((s) => s.sceneId)).toEqual(["a", "c"]);
    expect(p.scenes[1].startSec).toBe(4);
    expect(p.totalSec).toBe(10);
    expect(p.skipped[0].sceneId).toBe("b");
  });
  it("aspect 9:16 → 720x1280", () => {
    const p = planFromStoryboard(sb);
    expect([p.width, p.height]).toEqual([720, 1280]);
  });
  it("មិនមាន approved → បរាជ័យ", () => {
    const p = planFromStoryboard({ id: "x", aspect: "16:9", scenes: [mk("z", "draft", "pan", 3)] });
    expect(p.ok).toBe(false);
    expect(p.reason).toBe("no_approved_scenes");
  });
  it("map ចលនាកាមេរ៉ា", () => {
    expect(motionFor({ movement: "dolly" }).type).toBe("zoom_in");
    expect(motionFor({ movement: "crane_up" }).type).toBe("zoom_out");
    expect(motionFor({ movement: "static" }).type).toBe("static");
  });
  it("storyboard មិនត្រឹមត្រូវ", () => {
    expect(planFromStoryboard(null).ok).toBe(false);
  });
});


describe("videoPlan resolution profiles", () => {
  it.each([
    ["720p", 1280, 720],
    ["1080p", 1920, 1080],
    ["4k", 3840, 2160],
    ["5k", 5120, 2880],
    ["36k", 36000, 20250],
  ])("supports %s landscape", (resolution, width, height) => {
    const landscape = { ...sb, aspect: "16:9" };
    const p = planFromStoryboard(landscape, { resolution });
    expect(p.ok).toBe(true);
    expect([p.width, p.height]).toEqual([width, height]);
    expect(p.resolution).toBe(resolution);
  });

  it("rejects unsupported resolution", () => {
    const p = planFromStoryboard(sb, { resolution: "1000k" });
    expect(p.ok).toBe(false);
    expect(p.reason).toBe("unsupported_resolution");
  });
});
