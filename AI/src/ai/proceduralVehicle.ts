import type { BufferGeometry, Group, Material, Mesh } from "three";

// A simple built-in 3D vehicle, used when there is no real .glb model yet. It is a stylised test car
// (extruded side profile + wheels + glass + LED strips), NOT the real KHOEM-AI design.
// Car faces +z, width along x, wheels have their axle on x so "spin wheels" works with axis X.

type Three = typeof import("three");

interface Style {
  L: number; W: number; g: number;
  deck: number; belt: number; hood: number; nose: number;
  cabR: number; cabF: number; roofR: number; roofF: number; roof: number;
  wr: number; ww: number; axles: number[];
}

const STYLES: Record<string, Style> = {
  coupe: { L: 4.6, W: 1.95, g: 0.14, deck: 0.78, belt: 0.82, hood: 0.66, nose: 0.46, cabR: -1.0, cabF: 0.55, roofR: -0.5, roofF: 0.1, roof: 1.2, wr: 0.36, ww: 0.3, axles: [1.45, -1.4] },
  suv: { L: 4.7, W: 1.95, g: 0.2, deck: 1.15, belt: 1.1, hood: 0.98, nose: 0.72, cabR: -2.1, cabF: 0.8, roofR: -2.0, roofF: 0.4, roof: 1.7, wr: 0.4, ww: 0.32, axles: [1.45, -1.4] },
  sedan: { L: 4.9, W: 1.9, g: 0.15, deck: 0.95, belt: 0.95, hood: 0.82, nose: 0.6, cabR: -1.3, cabF: 0.85, roofR: -0.85, roofF: 0.25, roof: 1.45, wr: 0.35, ww: 0.26, axles: [1.5, -1.5] },
  city: { L: 3.8, W: 1.7, g: 0.15, deck: 0.95, belt: 0.9, hood: 0.8, nose: 0.6, cabR: -1.6, cabF: 0.5, roofR: -1.45, roofF: 0.1, roof: 1.45, wr: 0.3, ww: 0.22, axles: [1.15, -1.1] },
  van: { L: 5.0, W: 1.95, g: 0.2, deck: 1.35, belt: 1.3, hood: 1.0, nose: 0.75, cabR: -2.4, cabF: 1.15, roofR: -2.35, roofF: 0.9, roof: 1.95, wr: 0.38, ww: 0.26, axles: [1.55, -1.5] },
  pickup: { L: 5.3, W: 2.0, g: 0.25, deck: 1.05, belt: 1.05, hood: 0.95, nose: 0.7, cabR: -0.4, cabF: 0.95, roofR: -0.3, roofF: 0.55, roof: 1.75, wr: 0.42, ww: 0.32, axles: [1.7, -1.6] },
  truck: { L: 7.2, W: 2.5, g: 0.38, deck: 2.3, belt: 2.1, hood: 1.8, nose: 1.3, cabR: 1.1, cabF: 3.1, roofR: 1.2, roofF: 2.9, roof: 3.0, wr: 0.55, ww: 0.4, axles: [2.7, -1.4, -2.7] },
  military: { L: 5.2, W: 2.3, g: 0.5, deck: 1.6, belt: 1.55, hood: 1.4, nose: 1.1, cabR: -1.3, cabF: 1.6, roofR: -1.2, roofF: 1.2, roof: 2.1, wr: 0.52, ww: 0.38, axles: [1.8, -1.9] },
};

// The text is "kind name id" of the vehicle, e.g. "super sport khoem-ai s2 s02".
function styleName(k: string): string {
  if (/fire/.test(k)) return "truck";
  if (/military/.test(k)) return "military";
  if (/racing|formula/.test(k)) return "formula";
  if (/pickup/.test(k)) return "pickup";
  if (/ambulance|mpv|family|\bvan\b/.test(k)) return "van";
  if (/off-?road|suv|crossover/.test(k)) return "suv";
  if (/police|luxury|sedan/.test(k)) return "sedan";
  if (/city/.test(k)) return "city";
  return "coupe";
}

function colorFor(k: string): number {
  if (/police/.test(k)) return 0x15171c;
  if (/ambulance/.test(k)) return 0xf2f4f5;
  if (/fire/.test(k)) return 0xc4161c;
  if (/military/.test(k)) return 0x56603a;
  if (/off-?road/.test(k)) return 0x3f6a2e;
  if (/pickup/.test(k)) return 0xd9692a;
  if (/crossover/.test(k)) return 0x6b3aa0;
  if (/city/.test(k)) return 0xe6b800;
  if (/racing/.test(k)) return 0x1c4fd6;
  if (/hyper/.test(k)) return 0x1b3a8a;
  if (/super/.test(k)) return 0xc0222a;
  if (/luxury|sedan/.test(k)) return 0x14161b;
  if (/family|mpv/.test(k)) return 0xe9edf0;
  if (/electric|suv/.test(k)) return 0xe8ecef;
  if (/hero|v99/.test(k)) return 0xb9c0cb;
  return 0xaab4c4;
}

const bodyPolygon = (s: Style): number[][] => {
  const x0 = -s.L / 2;
  const x1 = s.L / 2;
  return [[x0, s.g], [x0, s.deck], [s.cabR, s.belt], [s.cabF, s.belt], [x1 - Math.min(0.5, s.L * 0.1), s.hood], [x1, s.nose], [x1, s.g]];
};
const glassPolygon = (s: Style): number[][] =>
  [[s.cabR + 0.02, s.belt - 0.01], [s.roofR, s.roof - 0.02], [s.roofF, s.roof - 0.02], [s.cabF - 0.02, s.belt - 0.01]];

// Pure data for tests: the side view of a vehicle.
export function sideView(key: string): { body: number[][]; glass: number[][]; wheels: { z: number; r: number }[]; L: number } | null {
  const k = key.toLowerCase();
  const s = STYLES[styleName(k)];
  if (!s) return null;
  return { body: bodyPolygon(s), glass: glassPolygon(s), wheels: s.axles.map((z) => ({ z, r: s.wr })), L: s.L };
}

export function buildVehicle(T: Three, key: string): Group {
  const k = key.toLowerCase();
  const name = styleName(k);
  const bodyColor = colorFor(k);
  const mat = (label: string, o: Record<string, unknown>): Material => {
    const m = new T.MeshStandardMaterial(o);
    m.name = label;
    return m;
  };
  const body = mat("body", { color: bodyColor, metalness: 0.7, roughness: 0.32 });
  const glass = mat("glass", { color: 0x0b1118, metalness: 0.9, roughness: 0.08 });
  const rubber = mat("tyre", { color: 0x111214, roughness: 0.9 });
  const rimMat = mat("rim", { color: 0xcfd4dc, metalness: 0.9, roughness: 0.25 });
  const metal = mat("trim", { color: 0x5a6070, metalness: 0.8, roughness: 0.4 });
  const led = (label: string, hex: number): Material => mat(label, { color: 0x0a1a33, emissive: hex, emissiveIntensity: 2 });
  const root = new T.Group();
  root.name = `KHOEM-AI ${name}`;

  const box = (w: number, h: number, d: number, m: Material, x: number, y: number, z: number): Mesh => {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  };
  const extrude = (poly: number[][], depth: number, m: Material): Mesh => {
    const sh = new T.Shape();
    sh.moveTo(poly[0][0], poly[0][1]);
    poly.slice(1).forEach((p) => sh.lineTo(p[0], p[1]));
    sh.closePath();
    const geo: BufferGeometry = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
    geo.translate(0, 0, -depth / 2);
    const mesh = new T.Mesh(geo, m);
    mesh.rotation.y = -Math.PI / 2; // shape x (front +) -> world +z, extrusion -> width on x
    root.add(mesh);
    return mesh;
  };
  const cyl = (rt: number, rb: number, h: number, m: Material, x: number, y: number, z: number, axis: "x" | "z"): Mesh => {
    const mesh = new T.Mesh(new T.CylinderGeometry(rt, rb, h, 20), m);
    mesh.position.set(x, y, z);
    if (axis === "x") mesh.rotation.z = Math.PI / 2; else mesh.rotation.x = Math.PI / 2;
    root.add(mesh);
    return mesh;
  };
  const wheelAt = (label: string, x: number, z: number, r: number, w: number): void => {
    const g = new T.Group();
    g.name = label;
    g.position.set(x, r, z);
    const tyre = new T.Mesh(new T.CylinderGeometry(r, r, w, 24), rubber);
    tyre.rotation.z = Math.PI / 2;
    const rim = new T.Mesh(new T.CylinderGeometry(r * 0.62, r * 0.62, w * 1.02, 16), rimMat);
    rim.rotation.z = Math.PI / 2;
    g.add(tyre, rim);
    for (let i = 0; i < 5; i++) { // spokes, so the spin can be seen
      const spoke = new T.Mesh(new T.BoxGeometry(w * 1.04, r * 1.15, 0.05), metal);
      spoke.rotation.x = (i * Math.PI) / 5;
      g.add(spoke);
    }
    root.add(g);
  };

  if (name === "formula") {
    box(0.55, 0.34, 3.2, body, 0, 0.3, 0);
    cyl(0.04, 0.17, 1.5, body, 0, 0.27, 2.2, "z").rotation.x = -Math.PI / 2; // nose cone
    box(1.9, 0.04, 0.38, body, 0, 0.12, 2.8);
    box(1.2, 0.05, 0.42, body, 0, 0.88, -2.0);
    for (const s of [-1, 1]) {
      box(0.04, 0.4, 0.42, metal, s * 0.6, 0.78, -2.0);
      box(0.34, 0.28, 1.4, body, s * 0.46, 0.32, -0.2);
      box(0.04, 0.3, 0.38, metal, s * 0.95, 0.2, 2.8);
    }
    box(0.1, 0.5, 0.1, metal, 0, 0.6, -1.9);
    const dome = new T.Mesh(new T.SphereGeometry(0.2, 16, 12), glass);
    dome.position.set(0, 0.52, 0.25);
    dome.scale.set(1, 0.8, 1.6);
    root.add(dome);
    for (const z of [1.6, -1.5]) for (const s of [-1, 1]) wheelAt(`wheel_${z > 0 ? "F" : "R"}${s < 0 ? "L" : "R"}`, s * 0.98, z, 0.36, 0.4);
    box(0.5, 0.05, 0.05, led("LED_headlight", 0x2f8bff), 0, 0.36, 3.02);
    return root;
  }

  const s = STYLES[name];
  const bw = s.W * 0.96;
  extrude(bodyPolygon(s), bw, body);
  extrude(glassPolygon(s), s.W * 0.9, glass);
  box(s.W * 0.9, 0.05, s.roofF - s.roofR + 0.02, body, 0, s.roof, (s.roofR + s.roofF) / 2);

  s.axles.forEach((z, i) => {
    for (const side of [-1, 1]) wheelAt(`wheel_${i}${side < 0 ? "L" : "R"}`, side * (s.W / 2 - s.ww / 2 + 0.03), z, s.wr, s.ww);
  });

  const frontZ = s.L / 2;
  const headlight = led("LED_headlight", 0x2f8bff);
  const tail = led("LED_taillight", 0x2f8bff);
  const under = led("LED_underglow", 0x2f8bff);
  for (const side of [-1, 1]) {
    box(0.36, 0.07, 0.05, headlight, side * s.W * 0.3, s.nose - 0.1, frontZ + 0.02);
    box(0.34, 0.07, 0.05, tail, side * s.W * 0.3, s.deck - 0.14, -frontZ - 0.02);
    box(0.03, 0.04, s.L * 0.65, under, side * (bw / 2 - 0.02), s.g + 0.02, 0);
  }

  if (name === "coupe" && /hero|v99|super|hyper/.test(k)) {
    box(s.W * 0.92, 0.05, 0.4, body, 0, s.deck + 0.42, -frontZ + 0.25);
    for (const side of [-1, 1]) box(0.05, 0.4, 0.2, metal, side * s.W * 0.28, s.deck + 0.2, -frontZ + 0.25);
  }
  const bar = (z: number, y: number): void => {
    box(0.55, 0.1, 0.22, mat("lightbar_red", { color: 0x300808, emissive: 0xff2a2a, emissiveIntensity: 2 }), -0.3, y, z);
    box(0.55, 0.1, 0.22, mat("lightbar_blue", { color: 0x08103a, emissive: 0x2a5aff, emissiveIntensity: 2 }), 0.3, y, z);
  };
  if (/police/.test(k)) bar((s.roofR + s.roofF) / 2, s.roof + 0.07);
  if (/ambulance/.test(k)) {
    bar((s.roofR + s.roofF) / 2, s.roof + 0.07);
    const red = mat("stripe", { color: 0xd01c24, roughness: 0.5 });
    for (const side of [-1, 1]) box(0.02, 0.22, s.L * 0.8, red, side * (bw / 2 + 0.015), s.belt - 0.3, -0.1);
  }
  if (name === "truck") {
    bar(2.0, s.roof + 0.07);
    for (const side of [-1, 1]) box(0.08, 0.1, 5.8, metal, side * 0.35, s.deck + 0.2, -0.7);
    for (let i = 0; i < 12; i++) box(0.8, 0.05, 0.05, metal, 0, s.deck + 0.2, -3.4 + i * 0.5);
  }
  if (name === "military") {
    cyl(0.55, 0.6, 0.35, body, 0, s.roof + 0.25, -0.2, "z").rotation.x = 0; // turret ring (vertical cylinder)
    cyl(0.07, 0.07, 1.8, metal, 0, s.roof + 0.35, 0.9, "z");
  }
  return root;
}
