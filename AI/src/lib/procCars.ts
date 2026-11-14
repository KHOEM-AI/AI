// KHOEM-AI procedural 3D cars (self-built, no external assets, no license issues).
// Car faces +X, up is +Y, width along Z. Units ~ metres.
import * as THREE from "three";

export type CarId =
  | "v99" | "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7" | "s8"
  | "s9" | "s10" | "s11" | "s12" | "s13" | "s14" | "s15";
export type LedMode = 0 | 3 | 6 | 9;

export const LED_COLORS: Record<LedMode, number> = {
  0: 0x000000, 3: 0x2f7bff, 6: 0xa24bff, 9: 0xff2a3a,
};
export const LED_NAMES: Record<LedMode, string> = {
  0: "Off", 3: "Blue Energy", 6: "Purple AI", 9: "Red Combat",
};

type Pt = [number, number]; // [u along length 0..1 rear→front, h height m]

interface CarSpec {
  id: CarId;
  name: string;
  kind: string;
  L: number; W: number; gc: number;
  wheelR: number; wheelW: number;
  wf: number; wr: number;       // axle positions (u)
  lower: Pt[]; glass: Pt[];
  color: number;
  bpillar?: number;             // u of B pillar
  rim?: number;
  taper?: number;               // plan-view nose/tail narrowing (0..0.3)
  stripe?: number;              // single centre racing stripe colour
  grille?: "hex" | "lux"; lamps?: "round"; caliper?: number; exhaust?: boolean; intake?: boolean;
}

const SPECS: CarSpec[] = [
  { id: "v99", name: "KHOEM-AI V99", kind: "Flagship hyper GT", L: 4.95, W: 2.0, gc: 0.1,
    wheelR: 0.37, wheelW: 0.3, wf: 0.8, wr: 0.2,
    lower: [[0, .1], [1, .1], [1, .46], [.7, .72], [.5, .84], [.18, .9], [0, .8]],
    glass: [[.62, .8], [.5, 1.12], [.3, 1.12], [.14, .88]], color: 0x15131f, rim: 0xb78cff },
  { id: "s1", name: "S1 Sport Coupe", kind: "Sport coupe", L: 4.5, W: 1.85, gc: 0.13,
    wheelR: 0.34, wheelW: 0.26, wf: 0.8, wr: 0.2,
    lower: [[0, .13], [1, .13], [1, .56], [.66, .86], [.28, .86], [0, .92]],
    glass: [[.63, .86], [.5, 1.28], [.34, 1.28], [.2, .88]], color: 0xd9172c },
  { id: "s2", name: "S2 Super Sport", kind: "Super sport", L: 4.6, W: 1.95, gc: 0.1,
    wheelR: 0.36, wheelW: 0.3, wf: 0.8, wr: 0.2,
    lower: [[0, .1], [1, .1], [1, .42], [.62, .74], [.3, .8], [0, .85]],
    glass: [[.6, .76], [.46, 1.1], [.3, 1.1], [.14, .82]], color: 0xffb400 },
  { id: "s3", name: "S3 Hyper Car", kind: "Hyper car", L: 4.7, W: 2.05, gc: 0.08,
    wheelR: 0.37, wheelW: 0.32, wf: 0.78, wr: 0.2,
    lower: [[0, .08], [1, .08], [1, .36], [.72, .62], [.5, .78], [.2, .82], [0, .7]],
    glass: [[.6, .74], [.48, 1.03], [.32, 1.03], [.2, .8]], color: 0x16b9d6, rim: 0xffffff },
  { id: "s4", name: "S4 Electric SUV", kind: "Electric SUV", L: 4.8, W: 1.95, gc: 0.2,
    wheelR: 0.4, wheelW: 0.27, wf: 0.79, wr: 0.21,
    lower: [[0, .2], [1, .2], [1, .85], [.72, 1.08], [.14, 1.1], [0, 1.2]],
    glass: [[.68, 1.1], [.56, 1.72], [.16, 1.72], [.08, 1.14]], color: 0xe9eef2, bpillar: .36 },
  { id: "s5", name: "S5 Luxury Sedan", kind: "Luxury sedan", L: 5.15, W: 1.92, gc: 0.15,
    wheelR: 0.36, wheelW: 0.26, wf: 0.8, wr: 0.2,
    lower: [[0, .15], [1, .15], [1, .7], [.68, .98], [.2, 1.0], [0, .98]],
    glass: [[.62, .98], [.5, 1.46], [.28, 1.46], [.16, 1.0]], color: 0x0c0d12, bpillar: .39 },
  { id: "s6", name: "S6 Family MPV", kind: "Family MPV", L: 4.85, W: 1.9, gc: 0.18,
    wheelR: 0.34, wheelW: 0.25, wf: 0.8, wr: 0.2,
    lower: [[0, .18], [1, .18], [1, .8], [.76, 1.04], [.06, 1.1], [0, 1.3]],
    glass: [[.72, 1.04], [.62, 1.78], [.1, 1.78], [.05, 1.12]], color: 0xa9b4c2, bpillar: .46 },
  { id: "s7", name: "S7 Off-road SUV", kind: "Off-road SUV", L: 4.5, W: 1.95, gc: 0.3,
    wheelR: 0.48, wheelW: 0.32, wf: 0.78, wr: 0.22,
    lower: [[0, .3], [1, .3], [1, 1.02], [.72, 1.2], [.04, 1.22], [0, 1.3]],
    glass: [[.7, 1.2], [.65, 1.92], [.07, 1.92], [.04, 1.22]], color: 0x3f7a3d, bpillar: .38 },
  { id: "s8", name: "S8 Pickup", kind: "Pickup truck", L: 5.4, W: 2.0, gc: 0.3,
    wheelR: 0.46, wheelW: 0.3, wf: 0.8, wr: 0.2,
    lower: [[0, .3], [1, .3], [1, 1.0], [.7, 1.2], [.4, 1.22], [.4, .98], [0, .98]],
    glass: [[.66, 1.2], [.58, 1.9], [.45, 1.9], [.4, 1.22]], color: 0xe36b12, bpillar: .52 },
  { id: "s9", name: "S9 Crossover", kind: "Crossover", L: 4.6, W: 1.88, gc: 0.2,
    wheelR: 0.37, wheelW: 0.26, wf: 0.8, wr: 0.2,
    lower: [[0, .2], [1, .2], [1, .78], [.7, 1.0], [.12, 1.04], [0, 1.1]],
    glass: [[.64, 1.0], [.52, 1.6], [.2, 1.6], [.1, 1.06]], color: 0x2d6cdf, bpillar: .38 },
  { id: "s10", name: "S10 City Car", kind: "City car", L: 3.7, W: 1.7, gc: 0.16,
    wheelR: 0.3, wheelW: 0.2, wf: 0.8, wr: 0.2,
    lower: [[0, .16], [1, .16], [1, .72], [.76, .94], [.1, .96], [0, 1.1]],
    glass: [[.72, .94], [.6, 1.56], [.14, 1.56], [.08, 1.0]], color: 0xff7ab0, bpillar: .4 },
  { id: "s11", name: "S11 Racing Car", kind: "Racing car", L: 4.8, W: 2.02, gc: 0.09,
    wheelR: 0.37, wheelW: 0.34, wf: 0.79, wr: 0.2,
    lower: [[0, .09], [1, .09], [1, .4], [.6, .72], [.3, .8], [0, .84]],
    glass: [[.58, .74], [.46, 1.0], [.32, 1.0], [.2, .8]], color: 0xf4f4f4, rim: 0xffcc00 },
  { id: "s12", name: "S12 Police Car", kind: "Police car", L: 4.95, W: 1.9, gc: 0.15,
    wheelR: 0.36, wheelW: 0.25, wf: 0.8, wr: 0.2,
    lower: [[0, .15], [1, .15], [1, .7], [.68, .98], [.2, 1.0], [0, .98]],
    glass: [[.62, .98], [.5, 1.46], [.28, 1.46], [.16, 1.0]], color: 0xf2f5f8, bpillar: .39 },
  { id: "s13", name: "S13 Ambulance", kind: "Ambulance", L: 5.5, W: 2.0, gc: 0.22,
    wheelR: 0.38, wheelW: 0.27, wf: 0.79, wr: 0.2,
    lower: [[0, .22], [1, .22], [1, 1.0], [.84, 1.34], [.7, 1.4], [.7, 2.4], [0, 2.4]],
    glass: [[.84, 1.34], [.76, 2.0], [.7, 2.0], [.7, 1.4]], color: 0xf5f5f5 },
  { id: "s14", name: "S14 Fire Rescue", kind: "Fire rescue", L: 7.0, W: 2.45, gc: 0.3,
    wheelR: 0.5, wheelW: 0.36, wf: 0.82, wr: 0.2,
    lower: [[0, .3], [1, .3], [1, 1.3], [.88, 1.5], [.72, 1.55], [.72, 2.7], [.62, 2.7], [.62, 2.1], [0, 2.1]],
    glass: [[.88, 1.5], [.8, 2.35], [.72, 2.35], [.72, 1.55]], color: 0xd81f1f },
  { id: "s15", name: "S15 Military Vehicle", kind: "Military vehicle", L: 5.3, W: 2.35, gc: 0.42,
    wheelR: 0.56, wheelW: 0.4, wf: 0.8, wr: 0.2,
    lower: [[0, .42], [1, .42], [1, 1.2], [.86, 1.55], [.62, 1.7], [.55, 2.05], [.2, 2.05], [.08, 1.7], [0, 1.65]],
    glass: [[.84, 1.56], [.78, 1.9], [.64, 1.9], [.62, 1.7]], color: 0x5b6b3a },
];

// styling per model (supercar / luxury details + factory colours)
const EXTRA: Partial<Record<CarId, Partial<CarSpec>>> = {
  v99: { color: 0xb4bac4, taper: 0.24, grille: "hex", caliper: 0x2f7bff, exhaust: true, intake: true, rim: 0x14161c },
  s1:  { color: 0x6a7077, taper: 0.2, grille: "hex", caliper: 0xd9172c, exhaust: true, intake: true, stripe: 0xd9172c },
  s2:  { color: 0x8fdc1e, taper: 0.26, grille: "hex", caliper: 0x111111, exhaust: true, intake: true, stripe: 0x0e0e10 },
  s3:  { color: 0x1747d6, taper: 0.26, grille: "hex", caliper: 0xffffff, exhaust: true, intake: true, stripe: 0xf5f7fa },
  s4:  { taper: 0.1, caliper: 0x2f7bff }, s5: { color: 0x0f3d2c, taper: 0.06, grille: "lux", lamps: "round", caliper: 0xd9b24c },
  s6:  { taper: 0.05 }, s7: { taper: 0.04, caliper: 0xff7a00 }, s9: { taper: 0.1, caliper: 0xd9172c },
  s10: { taper: 0.08 }, s11: { taper: 0.22, grille: "hex", caliper: 0xffcc00, exhaust: true, intake: true },
  s12: { taper: 0.06, caliper: 0x2f7bff },
};
for (const sp of SPECS) Object.assign(sp, EXTRA[sp.id] ?? {});

export const CAR_LIST: { id: CarId; name: string; kind: string }[] =
  SPECS.map(({ id, name, kind }) => ({ id, name, kind }));

export interface CarOptions { color?: number; led?: LedMode }
/** V99 body colour per LED mode (poster 'COLOR MODES'): 3 blue, 6 purple, 9 red, 0 silver. */
export const V99_MODE_PAINT: Record<LedMode, number> = { 0: 0xb4bac4, 3: 0x1f5fe0, 6: 0x8b3fe0, 9: 0xc8202c };
export interface CarData {
  spec: CarSpec; wheels: THREE.Object3D[]; ledMats: THREE.MeshStandardMaterial[];
  ledLight: THREE.PointLight; wheelR: number; led: LedMode;
  paint: THREE.MeshPhysicalMaterial; strobe: THREE.MeshStandardMaterial[]; customColor: boolean;
}

function shapeBody(g: THREE.BufferGeometry, L: number, gc: number, topY: number, taper: number): void {
  const pos = g.attributes.position as THREE.BufferAttribute;
  const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const t = x / L + 0.5, h = Math.min(1, Math.max(0, (y - gc) / Math.max(0.2, topY - gc)));
    const k = 1 - taper * Math.pow(sm(0.8, 1.04, t), 1.4) - taper * 0.45 * Math.pow(sm(0.2, -0.04, t), 1.4) - 0.07 * h * h;
    pos.setZ(i, z * k);
  }
  g.computeVertexNormals();
}
// ---------- helpers ----------
function roundedShape(pts: THREE.Vector2[], r: number | ((p: THREE.Vector2) => number)): THREE.Shape {
  const s = new THREE.Shape(); const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    const rr = typeof r === "function" ? r(p) : r;
    const ta = Math.min(rr / p.distanceTo(a), 0.48), tb = Math.min(rr / p.distanceTo(b), 0.48);
    const e = p.clone().lerp(a, ta), x = p.clone().lerp(b, tb);
    if (i === 0) s.moveTo(e.x, e.y); else s.lineTo(e.x, e.y);
    s.quadraticCurveTo(p.x, p.y, x.x, x.y);
  }
  s.closePath(); return s;
}
function extrudeSide(shape: THREE.Shape, width: number, bevel: number): THREE.ExtrudeGeometry {
  const depth = Math.max(0.02, width - bevel * 2);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.7,
    bevelSegments: 3, curveSegments: 6,
  });
  g.translate(0, 0, -depth / 2); g.computeVertexNormals(); return g;
}
function mesh(g: THREE.BufferGeometry, m: THREE.Material, shadow = true): THREE.Mesh {
  const o = new THREE.Mesh(g, m); o.castShadow = shadow; o.receiveShadow = true; return o;
}
function canvasTex(text: string, fg: string, bg: string | null, w = 512, h = 128): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d")!;
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.fillStyle = fg; x.font = `900 ${Math.round(h * 0.7)}px Arial, sans-serif`;
  x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function buildCar(id: CarId, opts: CarOptions = {}): THREE.Group {
  const spec = SPECS.find((s) => s.id === id) ?? SPECS[0];
  const { L, W, gc } = spec;
  const g = new THREE.Group(); g.name = `car-${id}`;
  const X = (u: number) => (u - 0.5) * L;
  const V = (p: Pt) => new THREE.Vector2(X(p[0]), p[1]);

  const color = opts.color ?? spec.color;
  const paint = new THREE.MeshPhysicalMaterial({
    color, metalness: 0.4, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.75,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0b0c10, roughness: 0.55, metalness: 0.3 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x0a1424, metalness: 0.1, roughness: 0.04, clearcoat: 1, envMapIntensity: 1.6,
  });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dde6, metalness: 1, roughness: 0.18 });
  const tireM = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 });
  const lampM = new THREE.MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xfff2c8, emissiveIntensity: 2.4 });
  const tailM = new THREE.MeshStandardMaterial({ color: 0xff1a22, emissive: 0xff0a14, emissiveIntensity: 2.2 });
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x000000, emissiveIntensity: 3 });
  const trimM = new THREE.MeshStandardMaterial({ color: 0x1b1d24, roughness: 0.4, metalness: 0.6 });

  // body
  const lowerPts = spec.lower.map(V);
  const body = mesh(extrudeSide(roundedShape(lowerPts, (p) => (p.y <= gc + 0.001 ? 0.12 : 0.3)), W, 0.1), paint);
  { const topY = Math.max(...spec.lower.map((p) => p[1])); if (spec.taper) shapeBody(body.geometry, L, gc, topY, spec.taper); }
  g.add(body);

  // cabin glass
  const gp = spec.glass.map(V);
  const cabin = mesh(extrudeSide(roundedShape(gp, 0.22), W * 0.8, 0.06), glass);
  g.add(cabin);

  // roof cap + pillars
  const maxH = Math.max(...gp.map((p) => p.y));
  const top = gp.filter((p) => Math.abs(p.y - maxH) < 0.01);
  const tx0 = Math.min(...top.map((p) => p.x)), tx1 = Math.max(...top.map((p) => p.x));
  const cap = mesh(new THREE.BoxGeometry(tx1 - tx0 + 0.14, 0.07, W * 0.8 + 0.1), paint);
  cap.position.set((tx0 + tx1) / 2, maxH + 0.01, 0); g.add(cap);
  const bar = (a: THREE.Vector2, b: THREE.Vector2, thick: number, depth: number, z: number, m: THREE.Material, off = 0) => {
    const len = a.distanceTo(b), ang = Math.atan2(b.y - a.y, b.x - a.x);
    const bm = mesh(new THREE.BoxGeometry(len, thick, depth), m);
    let nx = -Math.sin(ang), ny = Math.cos(ang);
    if (ny < 0) { nx = -nx; ny = -ny; } // always offset upward
    bm.position.set((a.x + b.x) / 2 + nx * off, (a.y + b.y) / 2 + ny * off, z);
    bm.rotation.z = ang; g.add(bm); return bm;
  };
  for (const side of [-1, 1]) {
    const z = side * W * 0.4;
    bar(gp[0], gp[1], 0.085, 0.07, z, paint);
    bar(gp[2], gp[3], 0.09, 0.07, z, paint);
    if (spec.bpillar) {
      const bx = X(spec.bpillar);
      bar(new THREE.Vector2(bx, gp[0].y), new THREE.Vector2(bx, maxH), 0.07, 0.07, z, paint);
    }
  }

  // wheels
  const wheels: THREE.Object3D[] = [];
  const rimM = new THREE.MeshStandardMaterial({ color: spec.rim ?? 0xcfd5de, metalness: 1, roughness: 0.22 });
  const tireGeo = new THREE.LatheGeometry([
    [spec.wheelR * 0.64, -spec.wheelW / 2], [spec.wheelR * 0.94, -spec.wheelW / 2],
    [spec.wheelR, -spec.wheelW * 0.34], [spec.wheelR, spec.wheelW * 0.34],
    [spec.wheelR * 0.94, spec.wheelW / 2], [spec.wheelR * 0.64, spec.wheelW / 2],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 28);
  for (const u of [spec.wf, spec.wr]) for (const side of [-1, 1]) {
    const wg = new THREE.Group();
    const spin = new THREE.Group();
    const tire = mesh(tireGeo, tireM); tire.rotation.x = Math.PI / 2; spin.add(tire);
    const rim = mesh(new THREE.CylinderGeometry(spec.wheelR * 0.66, spec.wheelR * 0.66, spec.wheelW * 0.9, 24), rimM);
    rim.rotation.x = Math.PI / 2; spin.add(rim);
    const hub = mesh(new THREE.CylinderGeometry(spec.wheelR * 0.2, spec.wheelR * 0.2, spec.wheelW * 0.98, 20), chrome);
    hub.rotation.x = Math.PI / 2; spin.add(hub);
    for (let k = 0; k < 5; k++) {
      const sp = mesh(new THREE.BoxGeometry(spec.wheelR * 0.5, spec.wheelR * 0.12, spec.wheelW * 0.1), dark);
      sp.position.set(0, 0, side * spec.wheelW * 0.46);
      const holder = new THREE.Group(); holder.rotation.z = (k / 5) * Math.PI * 2;
      sp.position.x = spec.wheelR * 0.4; holder.add(sp); spin.add(holder);
    }
    wg.add(spin);
    wg.position.set(X(u), spec.wheelR, side * (W / 2 - spec.wheelW / 2 + 0.05));
    const cal = mesh(new THREE.BoxGeometry(spec.wheelR * 0.42, spec.wheelR * 0.5, spec.wheelW * 0.14), new THREE.MeshStandardMaterial({ color: spec.caliper ?? 0x888d96, roughness: 0.35, metalness: 0.5 }));
    cal.position.set(spec.wheelR * 0.52, spec.wheelR * 0.05, side * spec.wheelW * 0.34); wg.add(cal);
    const disc = mesh(new THREE.CylinderGeometry(spec.wheelR * 0.6, spec.wheelR * 0.6, spec.wheelW * 0.06, 32), new THREE.MeshStandardMaterial({ color: 0x9aa0aa, metalness: 1, roughness: 0.35 }));
    disc.rotation.x = Math.PI / 2; disc.position.z = side * spec.wheelW * 0.3; wg.add(disc);
    wg.userData.spin = spin; g.add(wg); wheels.push(wg);
    const arch = new THREE.Mesh(new THREE.CircleGeometry(spec.wheelR * 1.17, 24),
      new THREE.MeshBasicMaterial({ color: 0x050507 }));
    arch.position.set(X(u), spec.wheelR, side * (W / 2 + 0.004));
    if (side < 0) arch.rotation.y = Math.PI; g.add(arch);
  }
  // wheel centres must be above arches: re-order so arches are drawn first is unnecessary (depth test)

  // lights, grille, bumpers
  const nose = spec.lower[2][1];
  const tail = spec.lower[spec.lower.length - 1][1];
  const frontY = Math.max(gc + 0.2, nose - 0.12);
  const lampH = Math.min(0.1, Math.max(0.05, (nose - gc) * 0.16));
  for (const side of [-1, 1]) {
    if (spec.lamps !== "round") {
      const hl = mesh(new THREE.BoxGeometry(0.06, lampH, W * 0.26), lampM, false);
      hl.position.set(L / 2 + (spec.taper ? 0.07 : 0.03), frontY, side * W * 0.3 * (spec.taper ? 1 - spec.taper * 0.7 : 1)); g.add(hl);
      if (spec.grille === "hex") {
        const claw = mesh(new THREE.BoxGeometry(0.05, 0.022, W * 0.17), new THREE.MeshStandardMaterial({ color: 0xcfeaff, emissive: 0xbfe3ff, emissiveIntensity: 2.6 }), false);
        claw.position.set(L / 2 + 0.07, frontY - lampH * 0.9, side * W * 0.27); claw.rotation.x = side * 0.5; g.add(claw);
      }
    }
    const tl = mesh(new THREE.BoxGeometry(0.05, lampH * 1.1, W * 0.26), tailM, false);
    tl.position.set(-L / 2 - 0.045, Math.max(gc + 0.25, tail - 0.14), side * W * 0.3); g.add(tl);
  }
  if (!spec.grille) {
    const grille = mesh(new THREE.BoxGeometry(0.05, Math.max(0.08, (nose - gc) * 0.3), W * 0.34), trimM);
    grille.position.set(L / 2 + 0.01, gc + (nose - gc) * 0.4, 0); g.add(grille);
  }
  if (spec.grille === "hex") {
    const hr = (nose - gc) * 0.34;
    const frame = mesh(new THREE.CylinderGeometry(hr * 1.12, hr * 1.12, 0.03, 6), chrome); frame.rotation.z = Math.PI / 2; frame.scale.set(1, 1, 2.3);
    frame.position.set(L / 2 + 0.058, gc + (nose - gc) * 0.46, 0); g.add(frame);
    const hex = mesh(new THREE.CylinderGeometry(hr, hr, 0.05, 6), trimM); hex.rotation.z = Math.PI / 2; hex.scale.set(1, 1, 2.3);
    hex.position.set(L / 2 + 0.075, gc + (nose - gc) * 0.46, 0); g.add(hex);
    for (let k = -3; k <= 3; k++) { const b = mesh(new THREE.BoxGeometry(0.02, hr * 1.4, 0.012), chrome, false); b.position.set(L / 2 + 0.102, gc + (nose - gc) * 0.46, k * hr * 0.32); g.add(b); }
  }
  if (spec.grille === "lux") {
    const gh = Math.max(0.22, (nose - gc) * 0.62), gw = W * 0.34, gy = gc + (nose - gc) * 0.55;
    const fr = mesh(new THREE.BoxGeometry(0.05, gh + 0.04, gw + 0.05), chrome); fr.position.set(L / 2 + 0.01, gy, 0); g.add(fr);
    const inner = mesh(new THREE.BoxGeometry(0.06, gh, gw), new THREE.MeshStandardMaterial({ color: 0x07080b, roughness: 0.4 })); inner.position.set(L / 2 + 0.015, gy, 0); g.add(inner);
    for (let k = -6; k <= 6; k++) { const b = mesh(new THREE.BoxGeometry(0.07, gh * 0.94, 0.014), chrome, false); b.position.set(L / 2 + 0.03, gy, k * gw * 0.075); g.add(b); }
    for (const side of [-1, 1]) {
      const rim = mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.04, 28), chrome); rim.rotation.z = Math.PI / 2; rim.position.set(L / 2 + 0.01, frontY + 0.02, side * W * 0.34); g.add(rim);
      const lamp = mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.05, 28), lampM, false); lamp.rotation.z = Math.PI / 2; lamp.position.set(L / 2 + 0.03, frontY + 0.02, side * W * 0.34); g.add(lamp);
      const ring = mesh(new THREE.TorusGeometry(0.06, 0.008, 8, 24), chrome, false); ring.rotation.y = Math.PI / 2; ring.position.set(L / 2 + 0.058, frontY + 0.02, side * W * 0.34); g.add(ring);
    }
  }
  if (spec.exhaust) for (const z of [-0.26, -0.12, 0.12, 0.26]) {
    const ex = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 20), chrome); ex.rotation.z = Math.PI / 2; ex.position.set(-L / 2 - 0.05, gc + 0.14, z * W); g.add(ex);
    const hole = mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.125, 20), new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.9 }), false); hole.rotation.z = Math.PI / 2; hole.position.set(-L / 2 - 0.052, gc + 0.14, z * W); g.add(hole);
  }
  if (spec.intake) for (const side of [-1, 1]) {
    const ib = mesh(new THREE.BoxGeometry(L * 0.13, 0.2, 0.012), new THREE.MeshStandardMaterial({ color: 0x060608, roughness: 0.5 }), false);
    ib.position.set(X(0.4), gc + 0.42, side * (W / 2 + 0.003)); ib.rotation.z = -0.28; g.add(ib);
  }
  if (spec.taper) { const bar = mesh(new THREE.BoxGeometry(0.03, 0.025, W * 0.62), tailM, false); bar.position.set(-L / 2 - 0.04, Math.max(gc + 0.25, tail - 0.14), 0); g.add(bar); }
  const splitter = mesh(new THREE.BoxGeometry(0.25, 0.05, W * (0.96 - (spec.taper ?? 0) * 1.3)), dark);
  splitter.position.set(L / 2 - 0.02, gc + 0.03, 0); g.add(splitter);
  const diffuser = mesh(new THREE.BoxGeometry(0.2, 0.06, W * (0.9 - (spec.taper ?? 0) * 0.6)), dark);
  diffuser.position.set(-L / 2 + 0.0, gc + 0.04, 0); g.add(diffuser);
  // mirrors
  for (const side of [-1, 1]) {
    const m = mesh(new THREE.BoxGeometry(0.16, 0.1, 0.1), paint);
    m.position.set(gp[0].x - 0.05, spec.glass[0][1] + 0.12, side * (W / 2 + 0.07)); g.add(m);
  }
  // door cut lines
  const bx = spec.bpillar ? X(spec.bpillar) : (gp[0].x + gp[3].x) / 2;
  for (const side of [-1, 1]) for (const dx of [gp[0].x - 0.1, bx, gp[3].x + 0.1]) {
    const dl = mesh(new THREE.BoxGeometry(0.012, Math.max(0.2, spec.glass[0][1] - gc - 0.45), 0.004), dark, false);
    dl.position.set(dx, (spec.glass[0][1] + gc) / 2 + 0.05, side * (W / 2 + 0.003)); g.add(dl);
  }

  // LED accent line along each side + underglow
  const ledStrips: THREE.Object3D[] = [];
  for (const side of [-1, 1]) {
    const s = mesh(new THREE.BoxGeometry(L * 0.72, 0.022, 0.012), ledMat, false);
    s.position.set(0, gc + 0.12, side * (W / 2 + 0.01)); g.add(s); ledStrips.push(s);
  }
  const fs = mesh(new THREE.BoxGeometry(0.02, 0.02, W * 0.72), ledMat, false);
  fs.position.set(L / 2 + 0.015, gc + (nose - gc) * 0.72, 0); g.add(fs);
  const gc2 = document.createElement("canvas"); gc2.width = gc2.height = 128;
  const gx = gc2.getContext("2d")!; const gr = gx.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.55, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(L * 1.5, W * 1.7),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc2), color: 0x000000, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.012; g.add(glow);
  const ledLight = new THREE.PointLight(0x000000, 0, 7, 2); ledLight.position.set(0, 0.35, 0); g.add(ledLight);
  const strobe: THREE.MeshStandardMaterial[] = [];

  // ---------- per-type extras ----------
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
    const b = mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b;
  };
  const sidePanel = (x0: number, x1: number, y0: number, y1: number, m: THREE.Material) => {
    for (const side of [-1, 1]) box(x1 - x0, y1 - y0, 0.006, m, (x0 + x1) / 2, (y0 + y1) / 2, side * (W / 2 + 0.006));
  };
  const badge = (text: string, fg: string, bg: string | null, x: number, y: number, w: number, h: number) => {
    const t = canvasTex(text, fg, bg, 512, Math.round(512 * h / w));
    const m = new THREE.MeshBasicMaterial({ map: t, transparent: !bg });
    for (const side of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      p.position.set(x, y, side * (W / 2 + 0.012)); if (side < 0) p.rotation.y = Math.PI; g.add(p);
    }
  };
  const spoiler = (x: number, y: number, w: number, m: THREE.Material) => {
    box(0.42, 0.045, w, m, x, y, 0);
    box(0.5, 0.012, w + 0.04, dark, x - 0.02, y + 0.03, 0);
    for (const side of [-1, 1]) {
      box(0.06, y - (tail + 0.02) + 0.04, 0.05, dark, x + 0.02, (y + tail) / 2 - 0.005, side * w * 0.36);
      box(0.4, 0.2, 0.025, m, x, y + 0.04, side * (w / 2 + 0.02));
    }
  };
  const lightbar = (x: number, y: number, w: number) => {
    const bm = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff0000, emissiveIntensity: 1.5 });
    const bl = new THREE.MeshStandardMaterial({ color: 0x2040ff, emissive: 0x0030ff, emissiveIntensity: 1.5 });
    box(0.3, 0.025, w + 0.04, dark, x, y - 0.025, 0);
    box(0.26, 0.09, w / 2, bm, x, y + 0.04, w / 4);
    box(0.26, 0.09, w / 2, bl, x, y + 0.04, -w / 4);
    strobe.push(bm, bl);
  };
  const stripeAlongHood = (c: number, wid: number) => {
    const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, metalness: 0.2 });
    const n = spec.lower.length;
    const raw = [spec.lower[2], spec.lower[3], spec.glass[0], spec.glass[1], spec.glass[2], spec.glass[3], spec.lower[n - 3], spec.lower[n - 1]];
    const pts: THREE.Vector2[] = [];
    for (const q of raw) { const v = V(q); if (!pts.length || v.x < pts[pts.length - 1].x - 0.01) pts.push(v); }
    for (let k = 0; k + 1 < pts.length; k++) bar(pts[k], pts[k + 1], 0.012, wid, 0, m, 0.078);
  };
  switch (id) {
    case "v99": {
      const carbon = new THREE.MeshStandardMaterial({ color: 0x0b0c10, roughness: 0.35, metalness: 0.6 });
      spoiler(X(0.045), tail + 0.2, W * 0.86, carbon);
      // carbon hood insert + roof + black lower body / skirts / bumper (poster look)
      const hA = V(spec.lower[2]), hB = V(spec.lower[3]);
      bar(hA, hB, 0.012, W * 0.5, 0, carbon, 0.082);
      for (const side of [-1, 1]) {
        sidePanel(X(0.16), X(0.9), gc, gc + 0.2, carbon);
        box(L * 0.7, 0.03, 0.04, ledMat, X(0.5), gc + 0.215, side * (W / 2 + 0.012));
      }
      box(0.3, 0.2, W * (0.96 - 0.24 * 1.3), carbon, L / 2 - 0.02, gc + 0.1, 0);
      box(0.3, 0.22, W * 0.7, carbon, -L / 2 + 0.02, gc + 0.12, 0);
      // names (poster): doors, hood, plates
      badge("KHOEM-AI", "#0b0c10", null, X(0.46), gc + 0.55, 1.15, 0.2);
      const plate = (x: number, y: number, ry: number) => {
        const pm = new THREE.MeshBasicMaterial({ map: canvasTex("KHOEM-AI", "#0b0c10", "#f3f4f6", 512, 128) });
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.125), pm); pl.position.set(x, y, 0); pl.rotation.y = ry; g.add(pl);
      };
      plate(L / 2 + 0.115, gc + 0.2, Math.PI / 2); plate(-L / 2 - 0.075, gc + 0.4, -Math.PI / 2);
      {
        const ang = Math.atan2(hB.y - hA.y, hB.x - hA.x) + Math.PI; // slope with x increasing
        const hm = new THREE.MeshBasicMaterial({ map: canvasTex("KHOEM-AI", "#e8ecf4", null, 512, 128), transparent: true, depthWrite: false });
        const hp = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.2), hm);
        const grp = new THREE.Group(); grp.position.set((hA.x + hB.x) / 2 - 0.05, (hA.y + hB.y) / 2 + 0.1, 0); grp.rotation.z = ang;
        hp.rotation.x = -Math.PI / 2; hp.rotation.z = Math.PI / 2; grp.add(hp); g.add(grp);
      }
      break;
    }
    case "s2": stripeAlongHood(0x111111, 0.3); break;
    case "s3": spoiler(X(0.03), tail + 0.3, W * 0.86, paint); stripeAlongHood(0xf5f7fa, 0.22); break;
    case "s1": spoiler(X(0.03), tail + 0.03, W * 0.7, paint); stripeAlongHood(0xd9172c, 0.2); break;
    case "s4": box(0.03, 0.03, W * 0.8, ledMat, L / 2 + 0.01, spec.lower[2][1] + 0.12, 0); break;
    case "s5": box(0.04, 0.03, W * 0.5, chrome, L / 2 + 0.015, gc + (nose - gc) * 0.4 + 0.1, 0); break;
    case "s7": {
      const rack = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.5, metalness: 0.7 });
      for (const side of [-1, 1]) box(L * 0.4, 0.04, 0.05, rack, X(0.4), 1.99, side * W * 0.4);
      for (let i = 0; i < 4; i++) box(0.04, 0.04, W * 0.8, rack, X(0.22 + i * 0.12), 1.99, 0);
      box(0.2, 0.06, W * 0.9, rack, L / 2 + 0.06, gc + 0.38, 0);
      box(0.08, 0.5, 0.06, rack, L / 2 + 0.08, gc + 0.62, W * 0.3); box(0.08, 0.5, 0.06, rack, L / 2 + 0.08, gc + 0.62, -W * 0.3);
      const sp = mesh(new THREE.CylinderGeometry(spec.wheelR * 0.9, spec.wheelR * 0.9, 0.26, 28), tireM);
      sp.rotation.z = Math.PI / 2; sp.position.set(-L / 2 - 0.16, 1.0, 0); g.add(sp);
      const sr = mesh(new THREE.CylinderGeometry(spec.wheelR * 0.5, spec.wheelR * 0.5, 0.27, 24), rimM);
      sr.rotation.z = Math.PI / 2; sr.position.copy(sp.position); g.add(sr);
      break;
    }
    case "s8": {
      const bedL = X(0.4) - X(0) - 0.1;
      for (const side of [-1, 1]) box(bedL, 0.3, 0.08, paint, X(0) + bedL / 2, 1.13, side * (W / 2 - 0.06));
      box(0.08, 0.3, W - 0.1, paint, X(0) + 0.04, 1.13, 0);
      box(bedL, 0.04, W - 0.2, dark, X(0) + bedL / 2, 0.99, 0);
      box(0.14, 0.04, W * 0.9, chrome, L / 2 + 0.07, gc + 0.35, 0);
      break;
    }
    case "s10": badge("KHOEM", "#ffffff", null, X(0.5), 0.58, 0.9, 0.18); break;
    case "s11": {
      spoiler(X(0.02), tail + 0.42, W * 0.98, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }));
      stripeAlongHood(0xe11d2e, 0.32);
      badge("99", "#e11d2e", "#ffffff", X(0.62), 0.7, 0.3, 0.3);
      sidePanel(X(0.15), X(0.9), gc + 0.28, gc + 0.34, new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }));
      break;
    }
    case "s12": {
      const blk = new THREE.MeshStandardMaterial({ color: 0x0f1218, roughness: 0.4, metalness: 0.4 });
      sidePanel(X(0.25), X(0.72), gc + 0.12, 0.98, blk);
      sidePanel(X(0.08), X(0.92), 0.64, 0.68, new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }));
      badge("POLICE", "#ffffff", "#1d4ed8", X(0.46), 0.8, 0.9, 0.2);
      lightbar(X(0.45), 1.5, W * 0.5);
      break;
    }
    case "s13": {
      const red = new THREE.MeshStandardMaterial({ color: 0xe11d2e, roughness: 0.4 });
      sidePanel(X(0.02), X(0.68), 0.95, 1.1, red);
      badge("AMBULANCE", "#e11d2e", null, X(0.34), 1.78, 1.6, 0.26);
      for (const side of [-1, 1]) {
        box(0.5, 0.14, 0.008, red, X(0.34), 1.45, side * (W / 2 + 0.008));
        box(0.14, 0.5, 0.008, red, X(0.34), 1.45, side * (W / 2 + 0.008));
      }
      lightbar(X(0.74), 2.0, W * 0.55);
      lightbar(X(0.04), 2.46, W * 0.6);
      break;
    }
    case "s14": {
      const wht = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });
      sidePanel(X(0.02), X(0.98), 1.1, 1.22, wht);
      const lad = new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: 0.9, roughness: 0.3 });
      for (const side of [-1, 1]) box(L * 0.55, 0.06, 0.06, lad, X(0.31), 2.8, side * 0.28);
      for (let i = 0; i < 16; i++) box(0.04, 0.04, 0.56, lad, X(0.04 + i * 0.037), 2.8, 0);
      for (const side of [-1, 1]) box(L * 0.55, 0.06, 0.06, lad, X(0.31), 2.9, side * 0.28);
      lightbar(X(0.78), 2.42, W * 0.55);
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) box(0.5, 0.5, 0.012, dark, X(0.1 + i * 0.17), 1.45, side * (W / 2 + 0.006));
      badge("FIRE RESCUE", "#ffffff", null, X(0.32), 1.17, 1.8, 0.18);
      break;
    }
    case "s15": {
      const camo = new THREE.MeshStandardMaterial({ color: 0x3f4a28, roughness: 0.8 });
      box(0.9, 0.42, 1.0, camo, X(0.4), 2.28, 0);
      const barrel = mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.7, 14), dark);
      barrel.rotation.z = Math.PI / 2; barrel.position.set(X(0.4) + 1.2, 2.3, 0); g.add(barrel);
      for (let i = 0; i < 2; i++) box(0.4, 0.04, W * 0.84, camo, X(0.3 + i * 0.12), 2.08, 0);
      sidePanel(X(0.1), X(0.5), 1.0, 1.25, camo);
      break;
    }
    default: break;
  }

  g.traverse((o) => {
    const m = o as THREE.Mesh; if (!m.isMesh) return;
    m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox!;
    m.castShadow = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z) > 0.45; // small details don't cast shadows
    m.receiveShadow = false;
  });
  body.receiveShadow = true;
  const data: CarData = { spec, wheels, ledMats: [ledMat], ledLight, wheelR: spec.wheelR, led: 0, paint, strobe, customColor: opts.color !== undefined };
  (data as any).glow = glow;
  g.userData.car = data;
  setCarLed(g, opts.led ?? 0);
  return g;
}

export function setCarLed(car: THREE.Object3D, mode: LedMode): void {
  const d = car.userData.car as CarData | undefined; if (!d) return;
  d.led = mode;
  if (d.spec.id === "v99" && !d.customColor) d.paint.color.setHex(V99_MODE_PAINT[mode]);
  const c = new THREE.Color(LED_COLORS[mode]);
  for (const m of d.ledMats) { m.color.copy(c); m.emissive.copy(c); m.emissiveIntensity = mode ? 3.5 : 0; }
  d.ledLight.color.copy(c); d.ledLight.intensity = mode ? 6 : 0;
  const glow = (d as any).glow as THREE.Mesh;
  const gm = glow.material as THREE.MeshBasicMaterial; gm.color.copy(c); gm.opacity = mode ? 0.35 : 0;
}

/** Call each frame: spins wheels (speed in m/s) and flashes police/ambulance lights. */
export function animateCar(car: THREE.Object3D, dt: number, speed = 0, time = 0): void {
  const d = car.userData.car as CarData | undefined; if (!d) return;
  for (const w of d.wheels) { const s = w.userData.spin as THREE.Object3D; if (s) s.rotation.z -= (speed / d.wheelR) * dt; }
  if (d.strobe.length) {
    const on = Math.floor(time * 6) % 2 === 0;
    d.strobe.forEach((m, i) => { m.emissiveIntensity = (i % 2 === 0) === on ? 2.4 : 0.2; });
  }
  
}

export function disposeObject(o: THREE.Object3D): void {
  o.traverse((c) => {
    const m = c as THREE.Mesh; if (!m.isMesh) return;
    m.geometry.dispose();
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const x of mats) { (x as any).map?.dispose?.(); x.dispose(); }
  });
}
