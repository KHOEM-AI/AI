import { describe, it, expect } from "vitest";
import {
  isGlb, guessBodyMaterial, isLedName, isWheelName, cameraPreset, fitDistance, turntableAngle, isOneShotClip, LED_MODES, CAMERA_PRESETS,
} from "../modelTools.mjs";
import { VEHICLES, vehicleById } from "../vehicles.mjs";

describe("modelTools", () => {
  it("isGlb accepts a glb header and refuses html / short / empty input", () => {
    const glb = new Uint8Array([0x67, 0x6c, 0x54, 0x46, 2, 0, 0, 0, 12, 0, 0, 0]);
    expect(isGlb(glb)).toBe(true);
    expect(isGlb(glb.buffer)).toBe(true);
    expect(isGlb(new TextEncoder().encode("<!doctype html><html></html>"))).toBe(false);
    expect(isGlb(new Uint8Array(4))).toBe(false);
    expect(isGlb(null)).toBe(false);
    expect(isGlb("glTF")).toBe(false);
  });

  it("guessBodyMaterial prefers a paint-like name, then the biggest non-glass part", () => {
    expect(guessBodyMaterial([{ name: "glass", area: 9 }, { name: "CarPaint_Silver", area: 3 }, { name: "tire", area: 5 }])).toBe("CarPaint_Silver");
    expect(guessBodyMaterial([{ name: "glass", area: 9 }, { name: "mat7", area: 3 }, { name: "tire", area: 5 }])).toBe("mat7");
    expect(guessBodyMaterial([{ name: "glass", area: 1 }, { name: "tire", area: 5 }])).toBe("tire");
    expect(guessBodyMaterial([])).toBe(null);
    expect(guessBodyMaterial(null)).toBe(null);
  });

  it("recognises LED and wheel names", () => {
    expect(isLedName("Headlight_LED")).toBe(true);
    expect(isLedName("neon_strip")).toBe(true);
    expect(isLedName("Window_Glass_Light")).toBe(false);
    expect(isLedName("body")).toBe(false);
    expect(isWheelName("Wheel_FL")).toBe(true);
    expect(isWheelName("tyre.001")).toBe(true);
    expect(isWheelName("door_left")).toBe(false);
    expect(Object.keys(LED_MODES).map((k) => LED_MODES[k].n)).toEqual([3, 6, 9]);
  });

  it("camera presets are at the asked distance and the model faces +Z", () => {
    for (const name of CAMERA_PRESETS) {
      const p = cameraPreset(name, 5);
      expect(Math.hypot(...p)).toBeCloseTo(5, 6);
    }
    expect(cameraPreset("front", 2)[2]).toBeGreaterThan(1.9);
    expect(cameraPreset("rear", 2)[2]).toBeLessThan(-1.9);
    expect(() => cameraPreset("nope", 1)).toThrow();
    expect(() => cameraPreset("front", 0)).toThrow();
  });

  it("fitDistance grows with the radius and refuses nonsense", () => {
    expect(fitDistance(2, 45)).toBeGreaterThan(fitDistance(1, 45));
    expect(() => fitDistance(0, 45)).toThrow();
    expect(() => fitDistance(1, 0)).toThrow();
  });

  it("turntableAngle makes exactly one turn per period", () => {
    expect(turntableAngle(0, 8)).toBe(0);
    expect(turntableAngle(4, 8)).toBeCloseTo(Math.PI, 9);
    expect(turntableAngle(8, 8)).toBeCloseTo(0, 9);
    expect(turntableAngle(10, 8)).toBeCloseTo(turntableAngle(2, 8), 9);
    expect(turntableAngle(-2, 8)).toBeCloseTo(turntableAngle(6, 8), 9);
    expect(() => turntableAngle(1, 0)).toThrow();
  });

  it("isOneShotClip catches door / hood clips only", () => {
    expect(isOneShotClip("DoorOpen_L")).toBe(true);
    expect(isOneShotClip("hood")).toBe(true);
    expect(isOneShotClip("idle")).toBe(false);
  });
});

describe("vehicles", () => {
  it("has the hero car and S1-S15 with unique ids and matching file names", () => {
    expect(VEHICLES).toHaveLength(16);
    expect(new Set(VEHICLES.map((v) => v.id)).size).toBe(16);
    expect(vehicleById("s05").name).toBe("KHOEM-AI S5");
    expect(vehicleById("s05").image).toBe("/vehicles/s05_luxury-sedan.png");
    expect(vehicleById("s05").glb).toBe("/models/s05.glb");
    expect(vehicleById("nope")).toBe(null);
    expect(VEHICLES.every((v) => v.image.startsWith("/vehicles/") && v.glb.startsWith("/models/"))).toBe(true);
  });
});
