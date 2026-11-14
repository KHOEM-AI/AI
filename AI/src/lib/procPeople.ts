// KHOEM-AI procedural 3D people (female / male). Self-built, no external assets.
// Character faces +Z, up is +Y, feet on y=0. Base height 1.75 m, scaled by `height`.
import * as THREE from "three";

export type Gender = "f" | "m";
export type HairStyle = "long" | "bob" | "bun" | "ponytail" | "short" | "buzz" | "bald";
export type BottomType = "pants" | "skirt" | "sampot" | "shorts";
export type Motion = "idle" | "walk" | "wave" | "pose";

export const SKIN_TONES = {
  porcelain: 0xf6d9c6, light: 0xefc5a5, khmer: 0xd9a77c, tan: 0xc08a5e,
  brown: 0x8d5a3b, deep: 0x5b3a29, ebony: 0x3b2417,
} as const;
export type SkinName = keyof typeof SKIN_TONES;

export interface PersonSpec {
  name?: string; gender: Gender; height?: number;
  skin: number; hair: HairStyle; hairColor: number;
  top: { color: number; sleeve: "short" | "long" | "none"; jacket?: number; tie?: number; trim?: number };
  bottom: { type: BottomType; color: number; trim?: number };
  shoes: number; glasses?: boolean; backpack?: number; necklace?: number; hairPin?: number;
  eyeColor?: number; lip?: number; build?: number; // build 0.9..1.15 width multiplier
}

const D = 0x1a1a1f;
export const PEOPLE_PRESETS: Record<string, PersonSpec> = {
  khmerModelF: { name: "Khmer Fashion Model (F)", gender: "f", height: 1.7, skin: SKIN_TONES.khmer, hair: "bun", hairColor: 0x15100d,
    top: { color: 0x7a1f4b, sleeve: "short", trim: 0xf2c14e }, bottom: { type: "sampot", color: 0x7a1f4b, trim: 0xf2c14e },
    shoes: 0xf2c14e, necklace: 0xf2c14e, hairPin: 0xf2c14e, lip: 0xc0314d },
  khmerStudentF: { name: "Khmer Student (F)", gender: "f", height: 1.58, skin: SKIN_TONES.khmer, hair: "ponytail", hairColor: 0x15100d,
    top: { color: 0xffffff, sleeve: "short" }, bottom: { type: "skirt", color: 0x14307a }, shoes: 0x111111, backpack: 0xe25a8a, lip: 0xc8576a },
  khmerStudentM: { name: "Khmer Student (M)", gender: "m", height: 1.68, skin: SKIN_TONES.khmer, hair: "short", hairColor: 0x120d0b,
    top: { color: 0xffffff, sleeve: "short" }, bottom: { type: "pants", color: 0x14307a }, shoes: 0x111111, backpack: 0x2d6cdf },
  khmerModelM: { name: "Khmer Fashion Model (M)", gender: "m", height: 1.82, skin: SKIN_TONES.khmer, hair: "short", hairColor: 0x0e0b09,
    top: { color: 0xf3efe6, sleeve: "long", jacket: 0x23283a }, bottom: { type: "pants", color: 0x23283a }, shoes: 0x2a1c14, glasses: false },
  businessWoman: { name: "Business Woman", gender: "f", height: 1.72, skin: SKIN_TONES.light, hair: "bob", hairColor: 0x3a2418,
    top: { color: 0xffffff, sleeve: "long", jacket: 0x2b2f3b }, bottom: { type: "skirt", color: 0x2b2f3b }, shoes: 0x1a1a1f, lip: 0xb03050, glasses: true },
  businessMan: { name: "Business Man", gender: "m", height: 1.8, skin: SKIN_TONES.light, hair: "short", hairColor: 0x2b1b12,
    top: { color: 0xffffff, sleeve: "long", jacket: 0x1f2433, tie: 0xb3202e }, bottom: { type: "pants", color: 0x1f2433 }, shoes: 0x14100e },
  casualGirl: { name: "Casual Girl", gender: "f", height: 1.65, skin: SKIN_TONES.tan, hair: "long", hairColor: 0x1a120e,
    top: { color: 0xff8fb3, sleeve: "short" }, bottom: { type: "shorts", color: 0x3b6fb6 }, shoes: 0xffffff, lip: 0xd0506a },
  casualBoy: { name: "Casual Boy", gender: "m", height: 1.76, skin: SKIN_TONES.brown, hair: "buzz", hairColor: 0x100b09,
    top: { color: 0x2b8f5a, sleeve: "short" }, bottom: { type: "pants", color: 0x394150 }, shoes: 0xf2f2f2, glasses: true },
  sportsWoman: { name: "Athlete (F)", gender: "f", height: 1.7, skin: SKIN_TONES.deep, hair: "ponytail", hairColor: 0x0d0a09,
    top: { color: 0x7c3aed, sleeve: "none" }, bottom: { type: "shorts", color: 0x16171c }, shoes: 0xffd400, build: 0.97 },
  sportsMan: { name: "Athlete (M)", gender: "m", height: 1.86, skin: SKIN_TONES.ebony, hair: "bald", hairColor: 0x000000,
    top: { color: 0xe11d2e, sleeve: "short" }, bottom: { type: "shorts", color: 0x16171c }, shoes: 0xffffff, build: 1.1 },
};

type Pt = [number, number];
function lathe(pts: Pt[], seg = 32, smooth = true): THREE.LatheGeometry {
  const ordered = pts[0][1] > pts[pts.length - 1][1] ? [...pts].reverse() : pts;
  const v = ordered.map(([r, y]) => new THREE.Vector2(r, y));
  const p = smooth ? new THREE.SplineCurve(v).getPoints(Math.max(12, v.length * 3)) : v;
  p.forEach((q) => { q.x = Math.max(0, q.x); });
  const g = new THREE.LatheGeometry(p, seg); g.computeVertexNormals(); return g;
}
function limbGeo(len: number, rTop: number, rMid: number, rBot: number): THREE.LatheGeometry {
  return lathe([[0, 0.012], [rTop * 0.85, -0.004], [rTop, -len * 0.08], [rMid, -len * 0.5], [rBot, -len * 0.93], [rBot * 0.7, -len * 1.0], [0, -len - 0.005]], 16);
}
function headGeo(female: boolean): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 36, 26);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (y < 0) {
      const k = Math.pow(-y, 1.35);
      x *= 1 - (female ? 0.36 : 0.24) * k;
      if (z > 0) z *= 1 - (female ? 0.1 : 0.04) * k;
      z *= 1 - 0.1 * k;
    } else { x *= 1 - 0.05 * y * y; }
    if (z < 0) z *= 0.92;
    pos.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals(); return g;
}
const mat = (color: number, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
function mk(g: THREE.BufferGeometry, m: THREE.Material, parent?: THREE.Object3D): THREE.Mesh {
  const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; parent?.add(o); return o;
}

export function buildPerson(input: PersonSpec | string, overrides: Partial<PersonSpec> = {}): THREE.Group {
  const base = typeof input === "string" ? PEOPLE_PRESETS[input] ?? PEOPLE_PRESETS.khmerStudentF : input;
  const s: PersonSpec = { ...base, ...overrides };
  const F = s.gender === "f";
  const wide = s.build ?? 1;
  const root = new THREE.Group(); root.name = `person-${s.name ?? s.gender}`;
  const body = new THREE.Group(); root.add(body);

  const skin = new THREE.MeshStandardMaterial({ color: s.skin, roughness: 0.55 });
  const darkSkin = new THREE.Color(s.skin).multiplyScalar(0.8);
  const hairM = new THREE.MeshStandardMaterial({ color: s.hairColor, roughness: 0.4 });
  const shirtM = mat(s.top.color, 0.7);
  const bottomM = mat(s.bottom.color, 0.75);
  const gold = mat(0xf2c14e, 0.25, 1);

  // dimensions (base 1.75 m)
  const legLen = 0.87, thigh = 0.44, shin = 0.4, ankle = 0.045;
  const sw = (F ? 0.162 : 0.222) * wide, hipW = (F ? 0.1 : 0.088) * (F ? 1 : wide);
  const hips = new THREE.Group(); hips.position.y = legLen; body.add(hips);
  const bottomMat = mat(s.bottom.color, 0.75);
  const spine = new THREE.Group(); hips.add(spine);

  // torso (shirt coloured)
  const tp: Pt[] = F
    ? [[0, -0.075], [0.15, -0.05], [0.176, 0.04], [0.14, 0.2], [0.118, 0.27], [0.142, 0.37], [0.15, 0.44], [0.138, 0.5], [0.1, 0.545], [0.06, 0.575], [0.0, 0.585]]
    : [[0, -0.075], [0.148, -0.05], [0.158, 0.05], [0.15, 0.2], [0.178, 0.34], [0.208, 0.44], [0.205, 0.5], [0.15, 0.545], [0.085, 0.57], [0.0, 0.585]];
  const trousers = s.bottom.type === "pants" || s.bottom.type === "shorts";
  const tpc: Pt[] = trousers ? [[0, 0.17] as Pt, ...tp.filter(([, y]) => y >= 0.2)] : tp;
  const wf = (r: number) => r * (wide > 1 ? 1 + (wide - 1) * 0.7 : wide);
  const torsoG = lathe(tpc.map(([r, y]) => [wf(r), y] as Pt), 28);
  if (trousers) {
    const pel = mk(lathe([[0, -0.1], [wf(F ? 0.14 : 0.13), -0.09], [wf(F ? 0.178 : 0.16), 0.0], [wf(F ? 0.165 : 0.158), 0.08], [wf(F ? 0.142 : 0.152), 0.2], [wf(F ? 0.14 : 0.15), 0.225], [0, 0.225]], 40), bottomMat, hips);
    pel.scale.z = F ? 0.64 : 0.7;
  }
  const torso = mk(torsoG, shirtM, spine); torso.scale.z = F ? 0.64 : 0.7;
  if (s.top.jacket) {
    const jm = mat(s.top.jacket, 0.8);
    const jk = mk(lathe(tp.map(([r, y]) => [r * 1.06 * wide, y * 1.0] as Pt), 40), jm, spine);
    jk.scale.set(1, 1, F ? 0.7 : 0.76); jk.position.y = -0.005;
    // shirt V
    const v = mk(new THREE.ConeGeometry(0.06, 0.22, 3), mat(s.top.color, 0.6), spine);
    v.rotation.set(Math.PI, 0, 0); v.position.set(0, 0.45, 0.115 * 1.0); v.scale.set(1, 1, 0.25);
    if (s.top.tie) { const t = mk(new THREE.ConeGeometry(0.032, 0.3, 4), mat(s.top.tie, 0.5), spine); t.rotation.x = Math.PI; t.position.set(0, 0.4, 0.14); t.scale.set(1, 1, 0.35); }
  } else if (s.top.trim) {
    const tr = mk(new THREE.TorusGeometry(0.075, 0.009, 8, 28, Math.PI), mat(s.top.trim, 0.3, 1), spine);
    tr.position.set(0, 0.53, 0.04); tr.rotation.set(0, 0, Math.PI);
  }

  // collar + belt
  if (!s.top.trim && s.top.sleeve !== "none") {
    const col = mk(new THREE.TorusGeometry(F ? 0.06 : 0.075, 0.012, 10, 28), s.top.jacket ? mat(s.top.color, 0.6) : shirtM, spine);
    col.position.y = 0.572; col.rotation.x = Math.PI / 2; col.scale.set(1, 0.85, 1);
  }
  if (s.bottom.type === "pants" || s.bottom.type === "shorts") {
    const belt = mk(new THREE.TorusGeometry((F ? 0.13 : 0.153) * wide, 0.012, 10, 36), mat(0x15110e, 0.5), hips);
    belt.position.y = 0.205; belt.rotation.x = Math.PI / 2; belt.scale.set(1, F ? 0.64 : 0.7, 1);
    const bk = mk(new THREE.BoxGeometry(0.03, 0.022, 0.006), mat(0xd9b24c, 0.25, 1), hips); bk.position.set(0, 0.205, (F ? 0.082 : 0.108));
  }
  // lower garment
  const legsAreSkin = s.bottom.type === "skirt" || s.bottom.type === "sampot";
  if (s.bottom.type === "skirt" || s.bottom.type === "sampot") {
    const long = s.bottom.type === "sampot";
    const hem = long ? -0.8 : -0.3;
    const sk = mk(lathe(long
      ? [[0, 0.24], [0.125 * wide, 0.22], [0.17, 0.05], [0.19, -0.1], [0.2, -0.4], [0.2, -0.66], [0.215, hem], [0, hem - 0.001]]
      : [[0, 0.24], [0.125 * wide, 0.22], [0.185, 0.04], [0.235, -0.12], [0.265, hem], [0, hem - 0.001]], 40), bottomM, hips);
    sk.scale.z = long ? 0.78 : 0.9;
    if (s.bottom.trim) {
      const band = mk(new THREE.TorusGeometry(0.2, 0.012, 8, 40), mat(s.bottom.trim, 0.3, 1), hips);
      band.rotation.x = Math.PI / 2; band.position.y = hem + 0.03; band.scale.set(1, 0.78, 1);
      const belt = mk(new THREE.TorusGeometry(0.128 * wide, 0.014, 8, 40), mat(s.bottom.trim, 0.3, 1), hips);
      belt.rotation.x = Math.PI / 2; belt.position.y = 0.225; belt.scale.set(1, 0.7, 1);
    }
  }

  // neck + head
  const neck = mk(new THREE.CylinderGeometry(F ? 0.042 : 0.054, F ? 0.05 : 0.064, 0.11, 24), skin, spine); neck.position.y = 0.6;
  const head = new THREE.Group(); head.position.y = 0.655; spine.add(head);
  const hy = 0.105;
  const skull = mk(headGeo(F), skin, head);
  skull.scale.set(F ? 0.088 : 0.099, 0.127, F ? 0.097 : 0.105); skull.position.y = hy + 0.002;
  for (const sd of [-1, 1]) {
    const ear = mk(new THREE.SphereGeometry(0.02, 12, 10), skin, head); ear.scale.set(0.5, 1, 0.8); ear.position.set(sd * (F ? 0.093 : 0.1), hy - 0.005, -0.004);
  }
  const eyeZ = F ? 0.087 : 0.093;
  const eyeCol = s.eyeColor ?? 0x2a1b12;
  for (const sd of [-1, 1]) {
    const ew = mk(new THREE.SphereGeometry(0.0185, 16, 12), mat(0xfdfdfd, 0.2), head); ew.scale.set(1.15, 0.85, 0.5); ew.position.set(sd * 0.038, hy + 0.012, eyeZ + 0.004);
    const ir = mk(new THREE.SphereGeometry(0.0115, 16, 12), mat(eyeCol, 0.15), head); ir.scale.set(1, 1, 0.5); ir.position.set(sd * 0.038, hy + 0.012, eyeZ + 0.0125);
    const hl = mk(new THREE.SphereGeometry(0.0035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), head); hl.position.set(sd * 0.0345, hy + 0.0165, eyeZ + 0.0185);
    const lid = mk(new THREE.TorusGeometry(0.019, 0.0021, 6, 16, Math.PI), mat(0x1a100c, 0.5), head);
    lid.position.set(sd * 0.038, hy + 0.0135, eyeZ + 0.008); lid.scale.set(1.1, F ? 0.9 : 0.7, 1);
    const br = mk(new THREE.CapsuleGeometry(0.0033, 0.034, 4, 8), hairM, head);
    br.rotation.z = Math.PI / 2 + sd * (F ? -0.15 : -0.08); br.position.set(sd * 0.04, hy + 0.044, eyeZ - 0.002 + (F ? 0.002 : 0));
    const ck = mk(new THREE.CircleGeometry(0.02, 16), new THREE.MeshBasicMaterial({ color: 0xff7d86, transparent: true, opacity: F ? 0.18 : 0.08, depthWrite: false }), head);
    ck.position.set(sd * 0.058, hy - 0.028, 0.0905); ck.rotation.y = sd * 0.5;
  }
  const nose = mk(new THREE.SphereGeometry(0.0145, 14, 10), mat(darkSkin.getHex(), 0.55), head); nose.scale.set(0.95, 1.1, 1.1); nose.position.set(0, hy - 0.018, F ? 0.1 : 0.106);
  const lip = mat(s.lip ?? (F ? 0xc8576a : 0xa8584e), 0.35);
  const mouth = mk(new THREE.TorusGeometry(0.017, 0.0034, 8, 18, Math.PI), lip, head);
  mouth.rotation.z = Math.PI; mouth.position.set(0, hy - 0.054, F ? 0.092 : 0.098); mouth.scale.set(1, 0.6, 1);
  const lowLip = mk(new THREE.SphereGeometry(0.012, 12, 8), lip, head); lowLip.scale.set(1.3, 0.38, 0.5); lowLip.position.set(0, hy - 0.063, F ? 0.092 : 0.099);

  // hair
  const hairCap = (sx: number, sy: number, sz: number, ty = 0) => {
    const cap = mk(new THREE.SphereGeometry(1, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.42), hairM, head);
    cap.scale.set(sx, sy, sz); cap.position.set(0, hy + 0.004 + ty, -0.008); cap.rotation.x = -0.2;
    const bk = mk(new THREE.SphereGeometry(1, 32, 22), hairM, head); bk.scale.set(hx - 0.003, 0.118, hzz * 0.86); bk.position.set(0, hy + 0.012 + ty, -0.02); return cap;
  };
  const hx = F ? 0.1 : 0.108, hzz = F ? 0.108 : 0.114;
  switch (s.hair) {
    case "long": {
      hairCap(hx, 0.134, hzz);
      const back = mk(new THREE.CapsuleGeometry(0.1, 0.34, 8, 24), hairM, head); back.scale.set(1, 1, 0.62); back.position.set(0, hy - 0.2, -0.045);
      for (const sd of [-1, 1]) { const lk = mk(new THREE.CapsuleGeometry(0.028, 0.2, 6, 12), hairM, head); lk.position.set(sd * 0.094, hy - 0.1, 0.0); }
      break; }
    case "bob": {
      hairCap(hx + 0.002, 0.136, hzz);
      const b = mk(new THREE.SphereGeometry(1, 32, 20), hairM, head); b.scale.set(hx + 0.012, 0.115, hzz - 0.008); b.position.set(0, hy - 0.05, -0.022);
      break; }
    case "bun": {
      hairCap(hx, 0.134, hzz);
      const bun = mk(new THREE.SphereGeometry(0.05, 20, 16), hairM, head); bun.position.set(0, hy + 0.115, -0.065);
      if (s.hairPin) { const pin = mk(new THREE.TorusGeometry(0.058, 0.007, 8, 28), mat(s.hairPin, 0.25, 1), head); pin.position.set(0, hy + 0.115, -0.065); pin.rotation.x = Math.PI / 2; }
      break; }
    case "ponytail": {
      hairCap(hx, 0.134, hzz);
      const tail = mk(new THREE.CapsuleGeometry(0.032, 0.3, 6, 14), hairM, head); tail.position.set(0, hy - 0.06, -0.125); tail.rotation.x = 0.28;
      const tie = mk(new THREE.TorusGeometry(0.03, 0.006, 6, 14), mat(0xe25a8a, 0.4), head); tie.position.set(0, hy + 0.05, -0.108); tie.rotation.x = 0.28 + Math.PI / 2;
      break; }
    case "short": {
      hairCap(hx + 0.001, 0.14, hzz + 0.001, 0.003);
      const qf = mk(new THREE.SphereGeometry(1, 28, 18), hairM, head); qf.scale.set(0.085, 0.045, 0.075); qf.position.set(0.006, hy + 0.108, 0.045); qf.rotation.x = -0.3; qf.rotation.z = -0.12;
      for (const sd of [-1, 1]) { const sb = mk(new THREE.CapsuleGeometry(0.009, 0.03, 4, 8), hairM, head); sb.position.set(sd * 0.093, hy - 0.012, 0.03); }
      break; }
    case "buzz": { hairCap(hx, 0.133, hzz); break; }
    default: break;
  }

  // arms
  const armParts: Record<string, THREE.Group> = {};
  const ua = 0.29, fa = 0.26;
  const sleeveLong = s.top.sleeve === "long", sleeveShort = s.top.sleeve === "short";
  const armTop = s.top.jacket ? mat(s.top.jacket, 0.8) : shirtM;
  for (const sd of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sd * sw, 0.5, 0); spine.add(sh);
    const upper = mk(limbGeo(ua, F ? 0.041 : 0.056 * wide, F ? 0.034 : 0.05 * wide, F ? 0.03 : 0.04 * wide), (sleeveLong || sleeveShort) ? armTop : skin, sh);
    if (s.top.sleeve === "none") { const cap = mk(new THREE.SphereGeometry(F ? 0.04 : 0.05, 16, 12), skin, sh); cap.position.y = 0; }
    else { const cap = mk(new THREE.SphereGeometry(F ? 0.04 : 0.058 * wide, 20, 14), armTop, sh); cap.position.y = -0.008; cap.scale.set(1, 1.1, 1); }
    const el = new THREE.Group(); el.position.y = -ua; sh.add(el);
    const fore = mk(limbGeo(fa, F ? 0.032 : 0.04 * wide, F ? 0.028 : 0.034, F ? 0.021 : 0.027), sleeveLong ? armTop : skin, el);
    const wr = new THREE.Group(); wr.position.y = -fa; el.add(wr);
    const hand = mk(new THREE.SphereGeometry(1, 20, 14), skin, wr); hand.scale.set(F ? 0.029 : 0.036, 0.04, 0.017); hand.position.y = -0.036;
    for (let k = 0; k < 4; k++) {
      const fg = mk(new THREE.CapsuleGeometry(F ? 0.0065 : 0.0078, F ? 0.036 : 0.04, 4, 8), skin, wr);
      fg.position.set((k - 1.5) * (F ? 0.0125 : 0.0155), -0.082 - (k === 1 || k === 2 ? 0.005 : 0), 0.0); fg.rotation.x = 0.12;
    }
    const thumb = mk(new THREE.CapsuleGeometry(0.008, 0.03, 4, 8), skin, wr); thumb.position.set(sd * -0.027, -0.04, 0.012); thumb.rotation.z = sd * 0.5;
    armParts[sd < 0 ? "R" : "L"] = sh; armParts[(sd < 0 ? "r" : "l") + "fore"] = el;
    void upper; void fore;
  }

  // legs
  const legParts: Record<string, THREE.Group> = {};
  const legPants = bottomM;
  const shorts = s.bottom.type === "shorts";
  for (const sd of [-1, 1]) {
    const hp = new THREE.Group(); hp.position.set(sd * hipW, 0, 0); hips.add(hp);
    const th = mk(limbGeo(thigh, F ? 0.083 : 0.092 * wide, F ? 0.068 : 0.074 * wide, 0.054), (shorts || legsAreSkin) ? skin : legPants, hp);
    if (shorts) { mk(limbGeo(thigh * 0.5, (F ? 0.088 : 0.09 * wide), (F ? 0.078 : 0.08 * wide), (F ? 0.07 : 0.074 * wide)), bottomM, hp); }
    const kn = new THREE.Group(); kn.position.y = -thigh; hp.add(kn);
    const sh = mk(limbGeo(shin, 0.054, F ? 0.047 : 0.052, 0.032), legsAreSkin || shorts ? skin : bottomM, kn);
    const an = new THREE.Group(); an.position.y = -shin; kn.add(an);
    const shoeM = mat(s.shoes, 0.5);
    const shoe = mk(new THREE.CapsuleGeometry(0.043, 0.13, 8, 16), shoeM, an); shoe.rotation.x = Math.PI / 2; shoe.scale.set(1, 1, 0.62); shoe.position.set(0, -0.028, 0.05);
    const sole = mk(new THREE.BoxGeometry(0.085, 0.014, 0.23), mat(0xf4f4f4, 0.6), an); sole.position.set(0, -0.062, 0.045);
    legParts[sd < 0 ? "R" : "L"] = hp; legParts[sd < 0 ? "rshin" : "lshin"] = kn;
    void th; void sh; void ankle;
  }

  // accessories
  if (s.necklace) { const n = mk(new THREE.TorusGeometry(0.062, 0.006, 8, 28), mat(s.necklace, 0.25, 1), spine); n.position.y = 0.55; n.rotation.x = Math.PI / 2 - 0.35; n.scale.set(1, 0.9, 1); }
  if (s.glasses) {
    const gm = mat(0x111111, 0.3, 0.6);
    for (const sd of [-1, 1]) { const r = mk(new THREE.TorusGeometry(0.026, 0.0026, 8, 24), gm, head); r.position.set(sd * 0.04, hy + 0.012, eyeZ + 0.018); }
    const br = mk(new THREE.BoxGeometry(0.022, 0.003, 0.003), gm, head); br.position.set(0, hy + 0.016, eyeZ + 0.02);
  }
  if (s.backpack) {
    const bp = mk(new THREE.CapsuleGeometry(0.1, 0.18, 8, 16), mat(s.backpack, 0.7), spine); bp.scale.set(1.1, 1, 0.55); bp.position.set(0, 0.3, -0.15);
    const flap = mk(new THREE.BoxGeometry(0.15, 0.05, 0.02), mat(0x111111, 0.6), spine); flap.position.set(0, 0.38, -0.2);
  }

  root.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox!; m.castShadow = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z) > 0.12; m.receiveShadow = false; });
  const k = (s.height ?? 1.75) / 1.75; root.scale.setScalar(k);
  root.userData.rig = {
    spine, head, hips, armL: armParts.L, armR: armParts.R, foreL: armParts.lfore, foreR: armParts.rfore,
    legL: legParts.L, legR: legParts.R, shinL: legParts.lshin, shinR: legParts.rshin, baseY: 0, spec: s,
  };
  return root;
}

export function randomPerson(seed = 1, gender?: Gender): PersonSpec {
  let x = seed * 9301 + 49297; const r = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length)];
  const g: Gender = gender ?? (r() < 0.5 ? "f" : "m");
  const tones = Object.values(SKIN_TONES);
  const cols = [0xe11d2e, 0x2d6cdf, 0x2b8f5a, 0xf59e0b, 0x7c3aed, 0x0ea5e9, 0xffffff, 0x111827, 0xff8fb3];
  return {
    name: `Random ${g === "f" ? "Woman" : "Man"} ${seed}`, gender: g, height: g === "f" ? 1.6 + r() * 0.15 : 1.7 + r() * 0.15,
    skin: pick(tones), hair: g === "f" ? pick(["long", "bob", "bun", "ponytail"] as const) : pick(["short", "buzz", "bald"] as const),
    hairColor: pick([0x120d0b, 0x2b1b12, 0x5a3a22, 0x8b6a3a, 0xcfa76a]),
    top: { color: pick(cols), sleeve: pick(["short", "long", "none"] as const) },
    bottom: { type: g === "f" ? pick(["pants", "skirt", "shorts"] as const) : pick(["pants", "shorts"] as const), color: pick([0x23283a, 0x394150, 0x3b6fb6, 0x5b4636, 0x111111]) },
    shoes: pick([0x111111, 0xffffff, 0x8b5a2b, 0xe11d2e]), glasses: r() < 0.25, build: 0.95 + r() * 0.15,
  };
}

/** Call every frame. t in seconds. */
export function animatePerson(p: THREE.Object3D, motion: Motion, t: number): void {
  const R = p.userData.rig; if (!R) return;
  const reset = () => {
    R.armL.rotation.set(0, 0, 0.08); R.armR.rotation.set(0, 0, -0.08);
    R.foreL.rotation.set(-0.12, 0, 0); R.foreR.rotation.set(-0.12, 0, 0);
    R.legL.rotation.set(0, 0, 0); R.legR.rotation.set(0, 0, 0); R.shinL.rotation.set(0, 0, 0); R.shinR.rotation.set(0, 0, 0);
    R.spine.rotation.set(0, 0, 0); R.hips.position.y = 0.87; R.hips.rotation.set(0, 0, 0); R.head.rotation.set(0, 0, 0);
  };
  reset();
  if (motion === "pose") { R.armL.rotation.z = 0.15; R.armR.rotation.z = -0.15; R.legL.rotation.z = -0.04; R.legR.rotation.z = 0.04; return; }
  if (motion === "idle") {
    const b = Math.sin(t * 1.8);
    R.spine.scale.set(1 + b * 0.006, 1 + b * 0.008, 1 + b * 0.006);
    R.hips.rotation.z = Math.sin(t * 0.7) * 0.012; R.spine.rotation.z = -Math.sin(t * 0.7) * 0.015;
    R.head.rotation.y = Math.sin(t * 0.5) * 0.18; R.head.rotation.x = Math.sin(t * 0.9) * 0.03;
    R.armL.rotation.z += b * 0.01; R.armR.rotation.z -= b * 0.01;
    return;
  }
  if (motion === "walk") {
    const ph = t * 5.2, s = Math.sin(ph), c = Math.cos(ph);
    R.legL.rotation.x = -s * 0.6; R.legR.rotation.x = s * 0.6;
    R.shinL.rotation.x = Math.max(0, c) * 0.9 * (s > -0.2 ? 0.6 : 1) + 0.05; R.shinR.rotation.x = Math.max(0, -c) * 0.9 * (s < 0.2 ? 0.6 : 1) + 0.05;
    R.armL.rotation.x = s * 0.5; R.armR.rotation.x = -s * 0.5;
    R.foreL.rotation.x = -0.25 - Math.max(0, -s) * 0.5; R.foreR.rotation.x = -0.25 - Math.max(0, s) * 0.5;
    R.hips.position.y = 0.87 + Math.abs(Math.cos(ph)) * 0.022 - 0.015;
    R.hips.rotation.y = s * 0.09; R.spine.rotation.y = -s * 0.12; R.spine.rotation.x = 0.03;
    R.head.rotation.y = s * 0.04;
    return;
  }
  if (motion === "wave") {
    R.armR.rotation.z = -2.55; R.armR.rotation.x = 0; R.foreR.rotation.z = -0.25 + Math.sin(t * 8) * 0.5; R.foreR.rotation.x = 0;
    R.head.rotation.z = -0.06; R.head.rotation.y = 0.12;
    R.spine.rotation.z = 0.02 + Math.sin(t * 1.8) * 0.01;
    R.armL.rotation.z = 0.1;
  }
}

export function disposePerson(o: THREE.Object3D): void {
  o.traverse((c) => {
    const m = c as THREE.Mesh; if (!m.isMesh) return; m.geometry.dispose();
    const ms = Array.isArray(m.material) ? m.material : [m.material]; ms.forEach((x) => x.dispose());
  });
}
