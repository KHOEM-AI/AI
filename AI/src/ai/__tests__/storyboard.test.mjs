import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createCharacter } from "../characters.mjs";
import { createAsset } from "../assets.mjs";
import {
  createStoryboard, addScene, updateScene, setSceneStatus, buildScenePrompt,
  continuityReport, getStoryboard, listStoryboards, OPTIONS,
} from "../storyboard.mjs";

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-"));
  process.env.LIBRARY_FILE = path.join(dir, "library.json");
  process.env.STORYBOARD_FILE = path.join(dir, "storyboards.json");
});
afterEach(() => {
  delete process.env.LIBRARY_FILE;
  delete process.env.STORYBOARD_FILE;
  fs.rmSync(dir, { recursive: true, force: true });
});

const mk = () => createStoryboard({ title: "រឿងសាកល្បង" }).storyboard;

describe("storyboard.mjs", () => {
  it("validates title, style and aspect", () => {
    expect(createStoryboard({ title: " " }).reason).toBe("empty_title");
    expect(createStoryboard({ title: "x", style: "bogus" }).reason).toBe("bad_style");
    expect(createStoryboard({ title: "x", aspect: "4:3" }).reason).toBe("bad_aspect");
    expect(createStoryboard({ title: "x" }).storyboard.style).toBe("cinematic");
  });

  it("rejects unknown characters, assets and speakers, including prototype names", () => {
    const sb = mk();
    expect(addScene(sb.id, { characters: [{ id: "nope" }] }).reason).toBe("unknown_character");
    expect(addScene(sb.id, { assets: ["constructor"] }).reason).toBe("unknown_asset");
    expect(addScene(sb.id, { dialogue: [{ speaker: "ghost", text: "x" }] }).reason).toBe("unknown_character");
    expect(addScene("__proto__", {}).reason).toBe("not_found");
    expect(getStoryboard("constructor")).toBeNull();
    expect(addScene(sb.id, { dialogue: [{ speaker: "narrator", text: "ថ្ងៃមួយ" }] }).ok).toBe(true);
  });

  it("picks a default rig from the camera movement", () => {
    const sb = mk();
    const rig = (camera) => addScene(sb.id, { camera }).scene.camera.rig;
    expect(rig({ movement: "drone_flyover" })).toBe("drone");
    expect(rig({ shot: "aerial" })).toBe("drone");
    expect(rig({ movement: "fpv_dive" })).toBe("drone");
    expect(rig({ movement: "crane_up" })).toBe("crane");
    expect(rig({ movement: "orbit" })).toBe("gimbal");
    expect(rig({ movement: "handheld" })).toBe("handheld");
    expect(rig({})).toBe("tripod");
    expect(rig({ movement: "orbit", rig: "drone" })).toBe("drone");
  });

  it("orbit defaults to 360 degrees, clamps at 720, and rejects bad camera values", () => {
    const sb = mk();
    expect(addScene(sb.id, { camera: { movement: "orbit" } }).scene.camera.degrees).toBe(360);
    expect(addScene(sb.id, { camera: { movement: "pan" } }).scene.camera.degrees).toBe(0);
    expect(addScene(sb.id, { camera: { movement: "spiral_up", degrees: 5000 } }).scene.camera.degrees).toBe(720);
    expect(addScene(sb.id, { camera: { movement: "teleport" } }).reason).toBe("bad_camera");
    expect(addScene(sb.id, { camera: { rig: "jetpack" } }).reason).toBe("bad_camera");
    expect(addScene(sb.id, { camera: { speed: "warp" } }).reason).toBe("bad_camera");
    expect(OPTIONS.moves).toContain("orbit");
  });

  it("validates season, time of day and weather, and puts them in the prompt", () => {
    const sb = mk();
    expect(addScene(sb.id, { season: "monsoon" }).reason).toBe("bad_season");
    expect(addScene(sb.id, { weather: "meteor" }).reason).toBe("bad_weather");
    expect(addScene(sb.id, { timeOfDay: "teatime" }).reason).toBe("bad_timeOfDay");
    const s = addScene(sb.id, { season: "rainy", timeOfDay: "golden_hour", weather: "fog", action: "ដើរ" }).scene;
    const p = buildScenePrompt(sb.id, s.id).prompt;
    expect(p).toContain("Environment: rainy season, golden_hour, fog");
  });

  it("logs only real changes and flips approved to needs_regen on visual edits, not notes", () => {
    const sb = mk();
    const s = addScene(sb.id, { action: "ដើរ" }).scene;
    setSceneStatus(sb.id, s.id, "approved");
    expect(updateScene(sb.id, s.id, { action: "ដើរ" }).changed).toBe(0);
    expect(updateScene(sb.id, s.id, { notes: "ចំណាំ" }).scene.status).toBe("approved");
    const r = updateScene(sb.id, s.id, { action: "រត់" });
    expect(r.changed).toBe(1);
    expect(r.scene.status).toBe("needs_regen");
    expect(r.scene.history.some((h) => h.field === "action" && h.before === "ដើរ" && h.after === "រត់")).toBe(true);
    expect(updateScene(sb.id, "nope", {}).reason).toBe("not_found");
    expect(setSceneStatus(sb.id, s.id, "bogus").reason).toBe("bad_status");
  });

  it("a partial camera patch recomputes the rig for the new movement", () => {
    const sb = mk();
    const s = addScene(sb.id, { camera: { movement: "pan" } }).scene;
    expect(s.camera.rig).toBe("tripod");
    const r = updateScene(sb.id, s.id, { camera: { movement: "drone_flyover", speed: "fast" } });
    expect(r.scene.camera).toMatchObject({ movement: "drone_flyover", rig: "drone", speed: "fast" });
  });

  it("builds a per-scene prompt from character identity and asset appearance", () => {
    const sb = mk();
    const ch = createCharacter({ name: "សុខា", identity: { face: "មុខមូល" }, current: { body: "ធាត់" } }).item;
    const loc = createAsset({ group: "places", nameEn: "Highway", appearance: "ផ្លូវធំច្រើនគន្លង" }).item;
    const car = createAsset({ group: "vehicles", nameEn: "Race car", appearance: "រថយន្តទាបមុខស្រួច" }).item;
    const s = addScene(sb.id, {
      location: loc.id, characters: [{ id: ch.id }], assets: [car.id, car.id],
      action: "បើកឡាន", camera: { shot: "aerial", movement: "orbit" }, durationSec: 8,
    }).scene;
    expect(s.assets).toHaveLength(1);
    const p = buildScenePrompt(sb.id, s.id).prompt;
    expect(p).toContain("Highway (ផ្លូវធំច្រើនគន្លង)");
    expect(p).toContain("សុខា");
    expect(p).toContain("face: មុខមូល");
    expect(p).toContain("Object: Race car");
    expect(p).toContain("aerial shot");
    expect(p).toContain("orbit 360deg");
    expect(p).toContain("drone rig");
    expect(p).toContain("Duration: 8s");
    expect(buildScenePrompt(sb.id, "nope").reason).toBe("not_found");
  });

  it("warns when an outfit changes without a reason, but not when a reason is given", () => {
    const sb = mk();
    const ch = createCharacter({ name: "A" }).item;
    addScene(sb.id, { characters: [{ id: ch.id, outfit: "ធ្វើការ" }] });
    addScene(sb.id, { characters: [{ id: ch.id, outfit: "ពិធី" }] });
    addScene(sb.id, { characters: [{ id: ch.id, outfit: "ពិធី" }] });
    addScene(sb.id, { characters: [{ id: ch.id, outfit: "ធ្វើការ" }], outfitChangeReason: "ត្រឡប់ទៅផ្ទះ" });
    const w = continuityReport(sb.id).warnings;
    expect(w).toHaveLength(1);
    expect(w[0]).toMatchObject({ scene: 2, type: "outfit_changed_without_reason", from: "ធ្វើការ", to: "ពិធី" });
  });

  it("persists to disk and lists storyboards with scene counts", () => {
    const sb = mk();
    addScene(sb.id, { action: "a" });
    addScene(sb.id, { action: "b" });
    expect(fs.existsSync(path.join(dir, "storyboards.json"))).toBe(true);
    expect(getStoryboard(sb.id).scenes).toHaveLength(2);
    expect(listStoryboards()[0].sceneCount).toBe(2);
  });
});
