import type * as THREE from "three";

export function createThreeScene(options?: {
  orbitRadius?: number;
  orbitHeight?: number;
  orbitSpeed?: number;
}): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  cube: THREE.Mesh;
  update: (timeSeconds?: number) => void;
  setOrbitAngle: (degrees: number) => void;
  setOrbitSpeed: (speed: number) => void;
};
