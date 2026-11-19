import { describe, it, expect } from "vitest";
import { sideView, buildVehicle } from "../proceduralVehicle.ts";
import * as THREE from "three";

describe("proceduralVehicle", () => {
  it("returns valid side view for supported vehicle styles", () => {
    for (const key of ["coupe", "suv", "sedan", "city", "van", "pickup", "truck", "military"]) {
      const result = sideView(key);
      expect(result).not.toBeNull();
      expect(result.body.length).toBeGreaterThan(0);
      expect(result.glass.length).toBeGreaterThan(0);
      expect(result.wheels.length).toBeGreaterThan(0);
    }
  });

  it("returns null for formula side view", () => {
    expect(sideView("racing")).toBeNull();
    expect(sideView("formula")).toBeNull();
  });

  it("builds a Three.js group for vehicle types", () => {
    for (const key of ["coupe", "suv", "pickup", "truck", "military", "racing"]) {
      const vehicle = buildVehicle(THREE, key);
      expect(vehicle).toBeInstanceOf(THREE.Group);
      expect(vehicle.children.length).toBeGreaterThan(0);
    }
  });

  it("assigns a KHOEM-AI name", () => {
    const vehicle = buildVehicle(THREE, "super sport");
    expect(vehicle.name).toContain("KHOEM-AI");
  });
});
