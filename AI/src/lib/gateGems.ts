// Gate: 6 shining diamonds follow the fire along its track, one after another (tails touching).
// Each diamond hits the Earth, bounces up and lights ONE letter of the name. The fire is the first letter.
type Ctx = CanvasRenderingContext2D;

export const HOLD_SECONDS = 12;
export const SCENE_END = 0.72;
const FIRE_LAND = 0.76 * SCENE_END * HOLD_SECONDS;
const FIRE_FLIGHT = 0.32 * SCENE_END * HOLD_SECONDS;
const GAP = 0.6;
const BOUNCE = 0.65;
const GEMS = 6;

export const NAME = ["K", "H", "O", "E", "M-", "A", "I"];
const landAt = (j: number): number => FIRE_LAND + GAP * (j + 1);
const launchAt = (j: number): number => landAt(j) - FIRE_FLIGHT;
const REVEAL: number[] = NAME.map((_, i) => (i === 0 ? FIRE_LAND + 0.15 : landAt(i - 1) + BOUNCE));
export const LOGO_IN = (FIRE_LAND - 0.3) / HOLD_SECONDS;

const PX = [1.08, 0.76, 0.49];
const PY = [0.0, 0.58, 0.8];
const NAME_DY = 100;
const FONT = "800 24px system-ui, sans-serif";
const SPACING = 3;

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const quad = (a: number[], t: number): number => (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * a[1] + t * t * a[2];

interface Pt { x: number; y: number }
interface GemAt extends Pt { s: number; a: number }

export function drawGems(ctx: Ctx, p: number, t: number, W: number, H: number): void {
  const ts = p * HOLD_SECONDS;
  const I: Pt = { x: PX[2] * W, y: PY[2] * H };

  ctx.save();
  ctx.font = FONT;
  const widths = NAME.map((s) => ctx.measureText(s).width + SPACING * s.length);
  ctx.restore();
  let x0 = W / 2 - widths.reduce((a, b) => a + b, 0) / 2;
  const slots: Pt[] = widths.map((w) => {
    const c = { x: x0 + (w - SPACING) / 2, y: H * 0.36 + NAME_DY };
    x0 += w;
    return c;
  });

  const gemAt = (j: number, s: number): GemAt | null => {
    const u = (s - launchAt(j)) / FIRE_FLIGHT;
    if (u < 0) return null;
    if (u <= 1) {
      const k = Math.pow(u, 1.3);
      return { x: quad(PX, k) * W, y: quad(PY, k) * H, s: 8 + 3 * u, a: clamp01(u / 0.08) };
    }
    const b = (s - landAt(j)) / BOUNCE;
    if (b > 1) return null;
    const T = slots[j + 1];
    const e = 1 - (1 - b) * (1 - b);
    const C: Pt = { x: lerp(I.x, T.x, 0.3), y: Math.min(I.y, T.y) - H * 0.12 };
    return {
      x: (1 - e) * (1 - e) * I.x + 2 * (1 - e) * e * C.x + e * e * T.x,
      y: (1 - e) * (1 - e) * I.y + 2 * (1 - e) * e * C.y + e * e * T.y,
      s: lerp(11, 6, e),
      a: 1,
    };
  };

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  for (let j = 0; j < GEMS; j++) {
    let prev = gemAt(j, ts);
    if (!prev) continue;
    for (let k = 1; k <= 30; k++) {
      const cur = gemAt(j, ts - k * 0.03);
      if (!cur) break;
      const f = 1 - k / 31;
      ctx.strokeStyle = "rgba(150,220,255," + (0.5 * f * prev.a).toFixed(3) + ")";
      ctx.lineWidth = 1 + 4.5 * f * f;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(cur.x, cur.y);
      ctx.stroke();
      prev = cur;
    }
  }

  for (let j = 0; j < GEMS; j++) {
    const sl = ts - landAt(j);
    if (sl < 0 || sl > 0.7) continue;
    const k = sl / 0.7;
    const g = ctx.createRadialGradient(I.x, I.y, 0, I.x, I.y, 36 * (0.4 + k));
    g.addColorStop(0, "rgba(220,245,255," + (0.7 * (1 - k) * (1 - k)).toFixed(3) + ")");
    g.addColorStop(1, "rgba(120,200,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(I.x, I.y, 36 * (0.4 + k), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(210,240,255," + (0.6 * (1 - k)).toFixed(3) + ")";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(I.x, I.y, 8 + 46 * k, 3 + 13 * k, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 1; i < NAME.length; i++) {
    const sa = ts - REVEAL[i];
    if (sa < 0 || sa > 0.4) continue;
    const k = sa / 0.4;
    const r = 12 + 34 * k;
    const g = ctx.createRadialGradient(slots[i].x, slots[i].y, 0, slots[i].x, slots[i].y, r);
    g.addColorStop(0, "rgba(200,240,255," + (0.8 * (1 - k)).toFixed(3) + ")");
    g.addColorStop(1, "rgba(80,180,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(slots[i].x, slots[i].y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  for (let j = 0; j < GEMS; j++) {
    const d = gemAt(j, ts);
    if (!d || d.a <= 0.01) continue;
    const s = d.s;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.globalAlpha = d.a;
    ctx.globalCompositeOperation = "lighter";
    const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 3.6);
    gl.addColorStop(0, "rgba(190,235,255,0.55)");
    gl.addColorStop(1, "rgba(90,180,255,0)");
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(0, 0, s * 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.rotate(Math.sin(t * 3 + j * 1.7) * 0.22);
    const body = ctx.createLinearGradient(-s, -s, s, s);
    body.addColorStop(0, "#f4feff");
    body.addColorStop(0.5, "#8fdcff");
    body.addColorStop(1, "#2f8fe0");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-0.55 * s, -0.6 * s);
    ctx.lineTo(0.55 * s, -0.6 * s);
    ctx.lineTo(s, -0.1 * s);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, -0.1 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-s, -0.1 * s); ctx.lineTo(s, -0.1 * s);
    ctx.moveTo(-0.55 * s, -0.6 * s); ctx.lineTo(-0.25 * s, -0.1 * s);
    ctx.moveTo(0.55 * s, -0.6 * s); ctx.lineTo(0.25 * s, -0.1 * s);
    ctx.moveTo(-0.25 * s, -0.1 * s); ctx.lineTo(0, s);
    ctx.moveTo(0.25 * s, -0.1 * s); ctx.lineTo(0, s);
    ctx.stroke();
    ctx.restore();
    const L = s * (1.8 + 0.9 * Math.sin(t * 9 + j * 2.1));
    ctx.save();
    ctx.translate(d.x, d.y - s * 0.3);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = d.a * 0.8;
    ctx.strokeStyle = "rgba(235,250,255,0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-L, 0); ctx.lineTo(L, 0);
    ctx.moveTo(0, -L); ctx.lineTo(0, L);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.font = FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < NAME.length; i++) {
    if (ts < REVEAL[i]) continue;
    const k = clamp01((ts - REVEAL[i]) / 0.45);
    const sc = k < 0.6 ? lerp(0.4, 1.25, k / 0.6) : lerp(1.25, 1, (k - 0.6) / 0.4);
    ctx.save();
    ctx.translate(slots[i].x, slots[i].y);
    ctx.scale(sc, sc);
    ctx.globalAlpha = clamp01(k * 3);
    ctx.shadowColor = "rgba(56,189,248,0.9)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#7dd3fc";
    ctx.fillText(NAME[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}
