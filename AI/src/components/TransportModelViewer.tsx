import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

type Props = {
  type: "phones" | "aircraft";
  name: string;
};

export default function TransportModelViewer({ type, name }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = host.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#061326");

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(8, 5.5, 9);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4;
    controls.maxDistance = 19;

    scene.add(new THREE.HemisphereLight(0xc5eaff, 0x152238, 2));

    const key = new THREE.DirectionalLight(0xffffff, 3);
    key.position.set(6, 10, 8);
    scene.add(key);

    const fill = new THREE.PointLight(0x159cff, 28, 30);
    fill.position.set(-5, 3, -5);
    scene.add(fill);

    const model = new THREE.Group();
    scene.add(model);

    const mat = (
      color: string,
      metalness = 0.45,
      roughness = 0.3,
      emissive?: string,
      intensity = 0
    ) => new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness,
      emissive: emissive ?? "#000000",
      emissiveIntensity: intensity,
    });

    const white = mat("#dce8f2", 0.55, 0.25);
    const belly = mat("#8ca9c1", 0.65, 0.3);
    const blue = mat("#0754a0", 0.55, 0.25);
    const glass = mat("#061c35", 0.35, 0.12);
    const dark = mat("#101a27", 0.65, 0.3);
    const metal = mat("#7d91a3", 0.8, 0.22);
    const rubber = mat("#11151c", 0.05, 0.9);
    const redLight = mat("#ff172c", 0.1, 0.2, "#ff0018", 2);
    const greenLight = mat("#00ff75", 0.1, 0.2, "#00ff55", 2);
    const whiteLight = mat("#ffffff", 0.1, 0.15, "#ffffff", 2.5);
    const engineGlow = mat("#ff8a35", 0.2, 0.25, "#ff4b12", 1.2);

    const box = (
      parent: THREE.Object3D,
      w: number, h: number, d: number,
      material: THREE.Material,
      x = 0, y = 0, z = 0
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d), material
      );
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };

    // Create a swept wing from mathematical coordinates.
    // The local XY profile is converted to a horizontal XZ wing.
    const makeWing = (
      parent: THREE.Object3D,
      points: [number, number][],
      thickness: number,
      material: THREE.Material
    ) => {
      const shape = new THREE.Shape();
      shape.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i][0], points[i][1]);
      }
      shape.closePath();

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.035,
        bevelThickness: 0.025,
      });

      geometry.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = 0;
      parent.add(mesh);
      return mesh;
    };

    const cylinderAlongX = (
      parent: THREE.Object3D,
      radius: number,
      length: number,
      material: THREE.Material,
      x: number, y: number, z: number
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, length, 40),
        material
      );
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };

    if (type === "phones") {
      const body = mat("#253c5b", 0.8, 0.2);
      box(model, 1.3, 0.18, 2.6, body);
      box(model, 1.18, 0.025, 2.4, glass, 0, 0.105, 0);
      box(model, 0.18, 0.025, 0.04, whiteLight, 0, 0.13, -1.1);
      box(model, 0.07, 0.12, 0.45, metal, 0.68, 0, 0.4);
      box(model, 0.07, 0.12, 0.45, metal, -0.68, 0, 0.4);
    } else {
      const isHelicopter = /helicopter/i.test(name);
      const isVintage = /wright flyer/i.test(name);
      const isConcorde = /concorde/i.test(name);
      const isLarge = /747|777|787|a380|cargo/i.test(name);

      if (isVintage) {
        // Historically styled biplane: two wings, propeller and tail.
        makeWing(model, [
          [1.0, -3.1], [-1.4, -3.1],
          [-1.4, 3.1], [1.0, 3.1],
        ], 0.08, belly);

        makeWing(model, [
          [0.7, -2.8], [-1.2, -2.8],
          [-1.2, 2.8], [0.7, 2.8],
        ], 0.08, white);

        cylinderAlongX(model, 0.12, 5.5, belly, 0, 0, 0);
        box(model, 0.8, 0.08, 1.5, belly, -2.2, 0, 0);
        box(model, 0.55, 0.75, 0.08, white, -2.1, 0.35, 0);

        // Propeller at the nose.
        const prop = box(model, 0.07, 1.6, 0.12, dark, 3, 0, 0);
        prop.rotation.x = 0.25;

        // Simple landing gear.
        for (const z of [-0.8, 0.8]) {
          const strut = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, 0.75, 12),
            metal
          );
          strut.position.set(0.4, -0.45, z);
          model.add(strut);

          const wheel = new THREE.Mesh(
            new THREE.TorusGeometry(0.19, 0.065, 12, 24),
            rubber
          );
          wheel.position.set(0.4, -0.78, z);
          wheel.rotation.y = Math.PI / 2;
          model.add(wheel);
        }
      } else if (isHelicopter) {
        // Helicopter body and rotor.
        const cabin = new THREE.Mesh(
          new THREE.SphereGeometry(0.7, 32, 24),
          white
        );
        cabin.scale.set(1.6, 0.85, 0.9);
        cabin.position.set(0.3, 0, 0);
        model.add(cabin);

        const tail = cylinderAlongX(model, 0.12, 3.4, belly, -2.0, 0.1, 0);
        tail.rotation.z = Math.PI / 2;

        box(model, 0.5, 0.08, 1.4, white, -3.4, 0.2, 0);
        box(model, 0.45, 0.65, 0.08, white, -3.5, 0.35, 0);

        box(model, 0.08, 0.08, 5.5, dark, 0, 0.95, 0);
        box(model, 5.5, 0.08, 0.08, dark, 0, 0.95, 0);

        for (const z of [-0.55, 0.55]) {
          const wheel = new THREE.Mesh(
            new THREE.TorusGeometry(0.17, 0.055, 10, 20),
            rubber
          );
          wheel.position.set(0, -0.65, z);
          wheel.rotation.y = Math.PI / 2;
          model.add(wheel);
        }
      } else {
        const scale = isLarge ? 1.15 : 1;

        // Fuselage profile: rounded nose, cabin and tapered tail.
        const fuselagePoints = [
          new THREE.Vector2(0.02, -3.8 * scale),
          new THREE.Vector2(0.16, -3.5 * scale),
          new THREE.Vector2(0.30, -2.8 * scale),
          new THREE.Vector2(0.38, -1.7 * scale),
          new THREE.Vector2(0.40, 1.8 * scale),
          new THREE.Vector2(0.34, 2.7 * scale),
          new THREE.Vector2(0.20, 3.5 * scale),
          new THREE.Vector2(0.02, 3.9 * scale),
        ];

        const fuselageGeometry = new THREE.LatheGeometry(
          fuselagePoints, 40
        );
        fuselageGeometry.rotateZ(Math.PI / 2);
        const fuselage = new THREE.Mesh(fuselageGeometry, white);
        model.add(fuselage);

        // Nose cone.
        const nose = new THREE.Mesh(
          new THREE.SphereGeometry(0.36, 32, 24),
          white
        );
        nose.scale.set(1.35, 0.85, 0.85);
        nose.position.x = 3.65 * scale;
        model.add(nose);

        // Blue lower fuselage stripe.
        box(model, 5.3 * scale, 0.055, 0.12, blue, -0.1, -0.18, 0);

        // Main swept wings.
        const span = isLarge ? 5.5 : 4.8;
        const wingPoints: [number, number][] = [
          [0.95, -0.65],
          [0.55, -span],
          [-1.35, -span],
          [-0.45, -0.7],
          [-1.35, 0],
          [-0.45, 0.7],
          [-1.35, span],
          [0.55, span],
          [0.95, 0.65],
        ];
        makeWing(model, wingPoints, 0.16, white);

        // Winglets at both tips.
        for (const side of [-1, 1]) {
          const winglet = box(
            model, 0.42, 0.85, 0.12,
            blue, -0.55, 0.38, side * (span - 0.08)
          );
          winglet.rotation.x = side * -0.12;
        }

        // Rear horizontal stabilizers and vertical fin.
        makeWing(model, [
          [-2.3, -1.65],
          [-2.8, -1.65],
          [-2.25, 0],
          [-2.8, 1.65],
          [-2.3, 1.65],
          [-1.8, 0],
        ], 0.12, white);

        const finShape = new THREE.Shape();
        finShape.moveTo(-2.8, 0);
        finShape.lineTo(-1.5, 0);
        finShape.lineTo(-2.25, 1.55);
        finShape.lineTo(-2.8, 1.55);
        finShape.closePath();

        const finGeometry = new THREE.ExtrudeGeometry(finShape, {
          depth: 0.13,
          bevelEnabled: true,
          bevelSize: 0.025,
          bevelThickness: 0.02,
          bevelSegments: 2,
        });
        const fin = new THREE.Mesh(finGeometry, blue);
        fin.rotation.y = Math.PI / 2;
        fin.position.set(0, 0, -0.065);
        model.add(fin);

        // Two jet engines under the wings.
        const enginePositions = [-1.75, 1.75];
        for (const z of enginePositions) {
          const engine = cylinderAlongX(
            model, 0.36, 1.35, belly, -0.45, -0.48, z
          );

          // Front intake rim.
          cylinderAlongX(
            model, 0.31, 0.07, metal, 0.24, -0.48, z
          );

          // Dark intake opening.
          cylinderAlongX(
            model, 0.255, 0.075, dark, 0.29, -0.48, z
          );

          // Rear exhaust opening.
          cylinderAlongX(
            model, 0.29, 0.08, dark, -1.16, -0.48, z
          );

          // Subtle warm exhaust glow, not a false rainbow flame.
          cylinderAlongX(
            model, 0.16, 0.025, engineGlow, -1.22, -0.48, z
          );

          // Engine pylon.
          box(model, 0.7, 0.28, 0.2, belly, -0.35, -0.23, z);
        }

        // Cockpit windows.
        for (const z of [-0.18, 0, 0.18]) {
          const window = box(
            model, 0.025, 0.15, 0.11, glass,
            3.48 * scale, 0.27, z
          );
          window.rotation.z = -0.2;
        }

        // Passenger windows along both sides.
        for (const side of [-1, 1]) {
          for (let i = 0; i < 17; i++) {
            const x = 2.5 - i * 0.32;
            const window = new THREE.Mesh(
              new THREE.SphereGeometry(0.045, 10, 8),
              glass
            );
            window.scale.set(0.5, 1, 1);
            window.position.set(x, 0.27, side * 0.365);
            model.add(window);
          }
        }

        // Landing gear: nose gear (2 wheels) and two main bogies (4 wheels).
        const addWheel = (x: number, y: number, z: number) => {
          const wheel = new THREE.Mesh(
            new THREE.TorusGeometry(0.19, 0.075, 12, 24),
            rubber
          );
          wheel.position.set(x, y, z);
          wheel.rotation.y = Math.PI / 2;
          model.add(wheel);

          const hub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.075, 0.075, 0.04, 20),
            metal
          );
          hub.rotation.z = Math.PI / 2;
          hub.position.copy(wheel.position);
          model.add(hub);
        };

        // Nose gear pair.
        const noseStrut = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 0.75, 14),
          metal
        );
        noseStrut.position.set(2.1, -0.52, 0);
        model.add(noseStrut);
        addWheel(2.1, -0.91, -0.16);
        addWheel(2.1, -0.91, 0.16);

        // Main landing gear pairs.
        for (const side of [-1, 1]) {
          const strut = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.95, 14),
            metal
          );
          strut.position.set(-0.9, -0.58, side * 0.95);
          model.add(strut);

          addWheel(-0.9, -1.05, side * 0.78);
          addWheel(-0.9, -1.05, side * 1.12);
        }

        // Navigation lights at wingtips:
        // left/port = red, right/starboard = green.
        const leftNav = new THREE.Mesh(
          new THREE.SphereGeometry(0.105, 16, 12), redLight
        );
        leftNav.position.set(-1.15, 0.06, -span);
        model.add(leftNav);

        const rightNav = new THREE.Mesh(
          new THREE.SphereGeometry(0.105, 16, 12), greenLight
        );
        rightNav.position.set(-1.15, 0.06, span);
        model.add(rightNav);

        // White strobe lights at both wing tips.
        for (const side of [-1, 1]) {
          const strobe = new THREE.Mesh(
            new THREE.SphereGeometry(0.075, 12, 10),
            whiteLight
          );
          strobe.position.set(0.35, 0.12, side * span);
          model.add(strobe);
        }

        // Red anti-collision beacon on top and bottom.
        for (const y of [-0.48, 0.48]) {
          const beacon = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 16, 12),
            redLight
          );
          beacon.position.set(-0.7, y, 0);
          model.add(beacon);
        }

        // White tail light.
        const tailLight = new THREE.Mesh(
          new THREE.SphereGeometry(0.07, 12, 10),
          whiteLight
        );
        tailLight.position.set(-2.8, 0.2, 0);
        model.add(tailLight);
      }
    }

    // Display platform.
    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 5.5, 0.12, 64),
      mat("#102d49", 0.65, 0.4)
    );
    floor.position.y = type === "phones" ? -1.65 : -1.8;
    scene.add(floor);

    const grid = new THREE.GridHelper(14, 28, 0x17618c, 0x12304b);
    grid.position.y = floor.position.y + 0.07;
    scene.add(grid);

    let frame = 0;
    let disposed = false;

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const render = () => {
      if (disposed) return;
      frame = requestAnimationFrame(render);
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();

      scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      });

      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [type, name]);

  return (
    <div className="tm-viewer">
      <div className="tm-title">{name}</div>
      <div className="tm-canvas" ref={host} />
      <div className="tm-help">
        Drag to rotate 360° · Pinch to zoom · View wings, engines and landing gear
      </div>
    </div>
  );
}
