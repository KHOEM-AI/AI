// Natural-looking space scene for the unlock gate, drawn with plain canvas 2D.
// No real photos and no neon: rusty Mars, grey asteroids, blue Earth with
// white clouds, and a clear diamond-shaped water drop.
// Everything is a pure function of progress p (0..1) plus a clock for twinkle,
// so there is no state to reset when the user lets go.

type Ctx = CanvasRenderingContext2D;

export interface Scene {
  draw: (ctx: Ctx, p: number, t: number) => void;
}

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const smooth = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface Star { x: number; y: number; r: number; a: number; sp: number; ph: number; c: string; depth: number }
interface Rock { x: number; y: number; size: number; rot: number; spin: number; sp: number; ph: number; pts: number[]; tone: string; craters: number[][] }
interface Speck { x: number; y: number; r: number; sp: number; a: number }
interface Key { p: number; x: number; y: number; r: number; a: number }

// Where the water drop is over time (x, y as fraction of the screen).
const DROP: Key[] = [
  { p: 0.0, x: 0.3, y: 0.86, r: 4, a: 0 },
  { p: 0.06, x: 0.3, y: 0.79, r: 9, a: 1 },
  { p: 0.18, x: 0.55, y: 0.55, r: 11, a: 1 },
  { p: 0.34, x: 0.75, y: 0.3, r: 11, a: 1 },
  { p: 0.5, x: 0.42, y: 0.26, r: 10, a: 1 },
  { p: 0.64, x: 0.5, y: 0.38, r: 9, a: 1 },
  { p: 0.8, x: 0.5, y: 0.5, r: 7, a: 1 },
  { p: 0.87, x: 0.5, y: 0.53, r: 3, a: 0 },
];

function dropAt(p: number): Key {
  if (p <= DROP[0].p) return DROP[0];
  for (let i = 1; i < DROP.length; i++) {
    const a = DROP[i - 1];
    const b = DROP[i];
    if (p <= b.p) {
      const t = smooth(a.p, b.p, p);
      return { p, x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), r: lerp(a.r, b.r, t), a: lerp(a.a, b.a, t) };
    }
  }
  return DROP[DROP.length - 1];
}

function makeEarth(): HTMLCanvasElement {
  const W = 1024;
  const H = 512;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const R = rng(7);
  const sea = g.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, "#0a3560");
  sea.addColorStop(0.5, "#1b62a0");
  sea.addColorStop(1, "#0a3560");
  g.fillStyle = sea;
  g.fillRect(0, 0, W, H);
  const land = ["#4b6c3b", "#6b7d46", "#8c7a52", "#3f5f3a", "#7a8a50"];
  for (let i = 0; i < 13; i++) {
    const cx = R() * W;
    const cy = 90 + R() * (H - 180);
    const rad = 35 + R() * 60;
    const n = 14;
    const pts: number[][] = [];
    for (let k = 0; k < n; k++) {
      const an = (k / n) * Math.PI * 2;
      const rr = rad * (0.55 + R() * 0.7);
      pts.push([Math.cos(an) * rr * 1.3, Math.sin(an) * rr * 0.8]);
    }
    const col = land[Math.floor(R() * land.length)];
    for (const off of [0, -W]) {
      g.beginPath();
      pts.forEach((q, k) => (k === 0 ? g.moveTo(cx + off + q[0], cy + q[1]) : g.lineTo(cx + off + q[0], cy + q[1])));
      g.closePath();
      g.fillStyle = col;
      g.globalAlpha = 0.95;
      g.fill();
    }
  }
  g.globalAlpha = 0.85;
  g.fillStyle = "#eef3f7";
  g.fillRect(0, 0, W, 26);
  g.fillRect(0, H - 30, W, 30);
  g.globalAlpha = 1;
  for (let i = 0; i < 46; i++) {
    const cx = R() * W;
    const cy = 30 + R() * (H - 60);
    const n = 3 + Math.floor(R() * 4);
    for (let k = 0; k < n; k++) {
      const x = cx + (R() - 0.5) * 70;
      const y = cy + (R() - 0.5) * 18;
      const rad = 14 + R() * 30;
      for (const off of [0, -W]) {
        const gr = g.createRadialGradient(x + off, y, 0, x + off, y, rad);
        gr.addColorStop(0, "rgba(255,255,255,0.55)");
        gr.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = gr;
        g.beginPath();
        g.arc(x + off, y, rad, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  return c;
}

export function createScene(W: number, H: number): Scene {
  const R = rng(20261112);

  const starColors = ["#ffffff", "#fff4d6", "#dbe6ff", "#ffe9c4"];
  const stars: Star[] = [];
  for (let i = 0; i < 170; i++) {
    stars.push({
      x: R(), y: R() * 0.95, r: 0.4 + R() * 0.9, a: 0.35 + R() * 0.6,
      sp: 0.4 + R() * 1.6, ph: R() * 6.28, c: starColors[Math.floor(R() * starColors.length)],
      depth: 0.1 + R() * 0.9,
    });
  }

  const tones = ["#7a6e60", "#6b6258", "#8a7c6a", "#5d554c"];
  const rocks: Rock[] = [];
  for (let i = 0; i < 14; i++) {
    const n = 8 + Math.floor(R() * 4);
    const pts: number[] = [];
    for (let k = 0; k < n; k++) pts.push(0.65 + R() * 0.5);
    const craters: number[][] = [];
    for (let k = 0; k < 3; k++) craters.push([(R() - 0.5) * 0.9, (R() - 0.5) * 0.9, 0.12 + R() * 0.16]);
    rocks.push({
      x: R() * 1.4, y: 0.08 + R() * 0.8, size: 5 + R() * 20, rot: R() * 6.28,
      spin: (R() - 0.5) * 0.8, sp: 0.35 + R() * 0.7, ph: R() * 6.28, pts,
      tone: tones[Math.floor(R() * tones.length)], craters,
    });
  }
  const specks: Speck[] = [];
  for (let i = 0; i < 70; i++) specks.push({ x: R() * 1.4, y: R(), r: 0.5 + R() * 1.1, sp: 0.3 + R() * 0.8, a: 0.3 + R() * 0.4 });

  // Mars ground
  const ridge: number[] = [];
  for (let x = 0; x <= W + 12; x += 12) ridge.push(R() * 10);
  const marsRocks: { x: number; w: number; h: number; pts: number[] }[] = [];
  for (let i = 0; i < 9; i++) {
    const pts: number[] = [];
    for (let k = 0; k < 7; k++) pts.push(0.7 + R() * 0.5);
    marsRocks.push({ x: R() * W, w: 22 + R() * 40, h: 12 + R() * 26, pts });
  }

  const earthMap = makeEarth();

  const drawStars = (ctx: Ctx, p: number, t: number): void => {
    for (const s of stars) {
      const x = (((s.x * W - p * W * 0.6 * s.depth) % W) + W) % W;
      const a = s.a * (0.78 + 0.22 * Math.sin(t * s.sp + s.ph));
      ctx.globalAlpha = a;
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(x, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const drawEarth = (ctx: Ctx, p: number, t: number): void => {
    const e = smooth(0.38, 0.62, p);
    const alpha = smooth(0.38, 0.45, p) * (1 - 0.7 * smooth(0.84, 0.97, p));
    if (alpha <= 0.01) return;
    const cx = W / 2;
    const cy = lerp(H * 1.55, H * 0.62, e);
    const r = lerp(W * 0.45, W * 0.72, e);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    const shift = (t * 6) % 512;
    ctx.drawImage(earthMap, shift, 0, 512, 512, cx - r, cy - r, r * 2, r * 2);
    const lx = cx - r * 0.4;
    const ly = cy - r * 0.45;
    const shade = ctx.createRadialGradient(lx, ly, r * 0.2, lx, ly, r * 1.7);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(0.55, "rgba(0,0,10,0.15)");
    shade.addColorStop(1, "rgba(0,0,12,0.85)");
    ctx.fillStyle = shade;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = alpha;
    const atm = ctx.createRadialGradient(cx, cy, r * 0.94, cx, cy, r * 1.09);
    atm.addColorStop(0, "rgba(120,180,255,0)");
    atm.addColorStop(0.35, "rgba(120,180,255,0.38)");
    atm.addColorStop(1, "rgba(120,180,255,0)");
    ctx.fillStyle = atm;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawMars = (ctx: Ctx, p: number): void => {
    const alpha = 1 - smooth(0.28, 0.34, p);
    if (alpha <= 0.01) return;
    const off = smooth(0.05, 0.3, p) * H * 0.55;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(0, off);
    const base = H * 0.84;
    const haze = ctx.createLinearGradient(0, base - H * 0.1, 0, base);
    haze.addColorStop(0, "rgba(150,85,58,0)");
    haze.addColorStop(1, "rgba(150,85,58,0.28)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, base - H * 0.1, W, H * 0.1);
    const ground = ctx.createLinearGradient(0, base - 10, 0, H);
    ground.addColorStop(0, "#9b5232");
    ground.addColorStop(1, "#3a1c12");
    ctx.fillStyle = ground;
    ctx.beginPath();
    ctx.moveTo(0, H + 40);
    ridge.forEach((v, i) => ctx.lineTo(i * 12, base + Math.sin(i * 0.5) * 8 + v));
    ctx.lineTo(W + 12, H + 40);
    ctx.closePath();
    ctx.fill();
    const draw = (x: number, w: number, h: number, pts: number[], col: string): void => {
      ctx.beginPath();
      pts.forEach((m, k) => {
        const an = Math.PI + (k / (pts.length - 1)) * Math.PI;
        const px = x + Math.cos(an) * w * m;
        const py = base + 10 + Math.sin(an) * h * m;
        if (k === 0) ctx.moveTo(px, py + h * 0.1);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = "rgba(235,160,110,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    for (const m of marsRocks) draw(m.x, m.w, m.h, m.pts, "#4a2f26");
    // the big rock the water drop comes out of
    draw(W * 0.3, 44, 40, [0.8, 1, 0.9, 1.05, 0.95, 1, 0.8], "#3d2720");
    ctx.strokeStyle = "rgba(10,5,3,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.3 - 4, base - 28);
    ctx.lineTo(W * 0.3 + 2, base - 10);
    ctx.stroke();
    ctx.restore();
  };

  const drawRocks = (ctx: Ctx, p: number): void => {
    const env = smooth(0.12, 0.24, p) * (1 - smooth(0.62, 0.74, p));
    if (env <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = env;
    const span = W * 1.4;
    for (const s of specks) {
      const x = ((((s.x * span - p * W * s.sp * 1.4) % span) + span) % span) - W * 0.2;
      ctx.fillStyle = "rgba(160,150,138," + s.a + ")";
      ctx.beginPath();
      ctx.arc(x, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const a of rocks) {
      const x = ((((a.x * span - p * W * a.sp * 1.4) % span) + span) % span) - W * 0.2;
      const y = a.y * H + Math.sin(p * 6 + a.ph) * 8;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a.rot + p * a.spin * 10);
      const sz = a.size;
      ctx.beginPath();
      a.pts.forEach((m, k) => {
        const an = (k / a.pts.length) * Math.PI * 2;
        const px = Math.cos(an) * sz * m;
        const py = Math.sin(an) * sz * m;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      const gr = ctx.createLinearGradient(-sz, -sz, sz, sz);
      gr.addColorStop(0, a.tone);
      gr.addColorStop(1, "#14110e");
      ctx.fillStyle = gr;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      for (const c of a.craters) {
        ctx.beginPath();
        ctx.ellipse(c[0] * sz, c[1] * sz, c[2] * sz, c[2] * sz * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  };

  const dropPath = (ctx: Ctx, r: number): void => {
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.6);
    ctx.bezierCurveTo(r * 0.5, -r * 0.7, r * 1.05, -r * 0.1, r * 0.95, r * 0.35);
    ctx.bezierCurveTo(r * 0.85, r * 0.95, r * 0.35, r * 1.2, 0, r * 1.2);
    ctx.bezierCurveTo(-r * 0.35, r * 1.2, -r * 0.85, r * 0.95, -r * 0.95, r * 0.35);
    ctx.bezierCurveTo(-r * 1.05, -r * 0.1, -r * 0.5, -r * 0.7, 0, -r * 1.6);
    ctx.closePath();
  };

  const drawDrop = (ctx: Ctx, p: number): void => {
    const k = dropAt(p);
    if (k.a <= 0.01) return;
    // faint trail
    for (let i = 1; i <= 22; i++) {
      const q = p - i * 0.0035;
      if (q < 0) break;
      const d = dropAt(q);
      ctx.globalAlpha = (1 - i / 22) * 0.22 * Math.min(k.a, d.a);
      ctx.fillStyle = "#cfe3f2";
      ctx.beginPath();
      ctx.arc(d.x * W, d.y * H, d.r * (1 - i / 30) * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = k.a;
    ctx.save();
    ctx.translate(k.x * W, k.y * H);
    dropPath(ctx, k.r);
    const body = ctx.createRadialGradient(-k.r * 0.3, -k.r * 0.2, 0, 0, 0, k.r * 1.3);
    body.addColorStop(0, "rgba(235,246,255,0.55)");
    body.addColorStop(0.7, "rgba(150,195,225,0.28)");
    body.addColorStop(1, "rgba(120,175,215,0.45)");
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.ellipse(-k.r * 0.35, -k.r * 0.15, k.r * 0.12, k.r * 0.3, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
    // light as it meets the atmosphere
    const f = smooth(0.78, 0.84, p) * (1 - smooth(0.84, 0.9, p));
    if (f > 0.01) {
      const x = k.x * W;
      const y = k.y * H;
      const gl = ctx.createRadialGradient(x, y, 0, x, y, 70);
      gl.addColorStop(0, "rgba(255,240,215," + 0.85 * f + ")");
      gl.addColorStop(0.4, "rgba(140,190,255," + 0.35 * f + ")");
      gl.addColorStop(1, "rgba(140,190,255,0)");
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(x, y, 70, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  return {
    draw(ctx, p, t) {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#000000");
      bg.addColorStop(1, "#03060d");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      drawStars(ctx, p, t);
      drawEarth(ctx, p, t);
      drawMars(ctx, p);
      drawRocks(ctx, p);
      drawDrop(ctx, p);
    },
  };
}
