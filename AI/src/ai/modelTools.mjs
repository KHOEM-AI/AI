// Pure helpers for the 3D model viewer (no three.js here, so they can be tested without WebGL).

export const GLB_MAGIC = 0x46546c67; // "glTF", little endian

// True when the bytes start like a binary glTF (.glb) file. A dev server that does not find a file often
// answers with an HTML page and status 200, so the status code alone cannot tell a model from a miss.
export function isGlb(bytes) {
  if (!bytes) return false;
  const u8 = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  if (!(u8 instanceof Uint8Array) || u8.length < 12) return false;
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  return dv.getUint32(0, true) === GLB_MAGIC;
}

const NOT_BODY = /glass|window|windshield|tire|tyre|wheel|rim|light|led|lamp|neon|chrome|interior|seat|rubber|brake|plate|mirror|black|carbon/i;
const BODY = /body|paint|carpaint|car_paint|shell|exterior|chassis|hood|bonnet/i;

// materials: [{ name, area }]  ->  name of the material that most likely is the car paint, or null.
export function guessBodyMaterial(materials) {
  const list = (materials || []).filter((m) => m && typeof m.name === 'string');
  if (!list.length) return null;
  const byArea = (a, b) => (b.area || 0) - (a.area || 0);
  const named = list.filter((m) => BODY.test(m.name)).sort(byArea);
  if (named.length) return named[0].name;
  const rest = list.filter((m) => !NOT_BODY.test(m.name)).sort(byArea);
  if (rest.length) return rest[0].name;
  return [...list].sort(byArea)[0].name;
}

const LED = /led|neon|glow|emissive|headlight|taillight|head_light|tail_light|lamp|beam|light(?!ing)/i;
export const isLedName = (name) => typeof name === 'string' && LED.test(name) && !/glass|lens_cover/i.test(name);

// The "369" LED system of the KHOEM-AI poster.
export const LED_MODES = {
  blue: { n: 3, hex: '#2f7bff', label: 'Blue Energy' },
  purple: { n: 6, hex: '#a855f7', label: 'Purple AI' },
  red: { n: 9, hex: '#ff2b2b', label: 'Red Combat' },
};

// Names that look like a wheel. Callers keep only the top-most matches so a rim inside a wheel does not spin twice.
export const isWheelName = (name) => typeof name === 'string' && /wheel|tyre|tire/i.test(name);

// Camera positions around a model of the given radius. The model faces +Z (the glTF convention).
export const CAMERA_PRESETS = ['threeQuarter', 'front', 'side', 'rear', 'top'];
export function cameraPreset(name, distance) {
  const d = Number(distance);
  if (!Number.isFinite(d) || d <= 0) throw new Error('distance must be a positive number');
  const v = {
    threeQuarter: [0.75, 0.35, 0.75],
    front: [0, 0.2, 1],
    side: [1, 0.15, 0],
    rear: [0, 0.2, -1],
    top: [0, 1, 0.001],
  }[name];
  if (!v) throw new Error(`unknown camera preset: ${name}`);
  const len = Math.hypot(...v);
  return v.map((c) => (c / len) * d);
}

// Distance at which a sphere of `radius` fits the vertical field of view (degrees), with a little air around it.
export function fitDistance(radius, fovDeg) {
  const r = Number(radius);
  const f = Number(fovDeg);
  if (!(r > 0) || !(f > 0 && f < 180)) throw new Error('radius and fov must be positive');
  return (r / Math.sin((f * Math.PI) / 360)) * 1.15;
}

// Angle (radians) of a turntable that makes one full turn every periodSec.
export function turntableAngle(elapsedSec, periodSec) {
  if (!(periodSec > 0)) throw new Error('periodSec must be positive');
  const t = (((elapsedSec % periodSec) + periodSec) % periodSec) / periodSec;
  return t * Math.PI * 2;
}

// Clips that are one-shot movements (a door opening) rather than loops.
export const isOneShotClip = (name) => typeof name === 'string' && /door|open|hood|bonnet|trunk|boot|close/i.test(name);
