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

// ---- Earth: a real-looking sphere built once from noise (no photos) ----
function hash(x: number, y: number, sd: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(sd, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x: number, y: number, period: number, sd: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const i0 = ((x0 % period) + period) % period;
  const i1 = (i0 + 1) % period;
  const a = hash(i0, y0, sd);
  const b = hash(i1, y0, sd);
  const c = hash(i0, y0 + 1, sd);
  const d = hash(i1, y0 + 1, sd);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}
function fbm(u: number, v: number, base: number, oct: number, sd: number): number {
  let sum = 0;
  let amp = 1;
  let tot = 0;
  for (let o = 0; o < oct; o++) {
    const per = base * (1 << o);
    sum += amp * vnoise(u * per, v * per * 0.5, per, sd + o * 17);
    tot += amp;
    amp *= 0.5;
  }
  return sum / tot;
}
type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

function makeEarth(): HTMLCanvasElement {
  const MW = 640;
  const MH = 320;
  const height = new Float32Array(MW * MH);
  for (let j = 0; j < MH; j++) {
    for (let i = 0; i < MW; i++) height[j * MW + i] = fbm(i / MW, j / MH, 3, 6, 11);
  }
  // sea level so that about 30% of the planet is land
  let lo = 1;
  let hi = 0;
  for (let i = 0; i < height.length; i++) { if (height[i] < lo) lo = height[i]; if (height[i] > hi) hi = height[i]; }
  const bins = new Uint32Array(256);
  for (let i = 0; i < height.length; i++) bins[Math.min(255, Math.floor(((height[i] - lo) / (hi - lo)) * 256))]++;
  let acc = 0;
  let level = lo;
  for (let b = 0; b < 256; b++) {
    acc += bins[b];
    if (acc / height.length >= 0.7) { level = lo + ((b + 1) / 256) * (hi - lo); break; }
  }

  const shallow = hex("#2f86a0");
  const deep = hex("#06264d");
  const sand = hex("#b8a878");
  const greenA = hex("#2e4b27");
  const greenB = hex("#5a7a3b");
  const desA = hex("#b69b6c");
  const desB = hex("#9a7b50");
  const rockC = hex("#6d5b47");
  const snow = hex("#eef2f4");
  const ice = hex("#f0f5f8");
  const white: RGB = [255, 255, 255];

  const col = new Uint8Array(MW * MH * 3);
  const isLand = new Uint8Array(MW * MH);
  const lights = new Uint8Array(MW * MH);
  const cloud = new Uint8Array(MW * MH);
  for (let j = 0; j < MH; j++) {
    const v = j / MH;
    const al = Math.abs(0.5 - v) * 2; // 0 equator .. 1 pole
    for (let i = 0; i < MW; i++) {
      const u = i / MW;
      const k = j * MW + i;
      const h = height[k];
      let c: RGB;
      if (h < level) {
        const d = clamp01(((level - h) / (level - lo)) * 3);
        c = mix(shallow, deep, d);
      } else {
        const e = (h - level) / (hi - level);
        const m = fbm(u, v, 3, 4, 91);
        const band = smooth(0.12, 0.25, al) * (1 - smooth(0.45, 0.6, al));
        const dry = clamp01((0.55 - m) * 4) * (0.35 + 0.65 * band);
        const green = mix(greenA, greenB, clamp01(m * 1.4));
        const desert = mix(desA, desB, m);
        c = mix(green, desert, dry);
        c = mix(sand, c, smooth(0.0, 0.05, e));
        c = mix(c, rockC, smooth(0.4, 0.7, e));
        c = mix(c, snow, smooth(0.78, 0.92, e));
        isLand[k] = 1;
        if (e < 0.35 && al < 0.7 && vnoise(u * 300, v * 150, 300, 5) > 0.86) lights[k] = 1;
      }
      const edge = al + (vnoise(u * 40, v * 20, 40, 3) - 0.5) * 0.12;
      c = mix(c, ice, smooth(0.8, 0.88, edge));
      const cu = u + 0.08 * (fbm(u, v, 2, 3, 5) - 0.5);
      const cl = smooth(0.5, 0.7, fbm(cu, v, 5, 5, 33)) * 0.9;
      cloud[k] = Math.round(cl * 255);
      c = mix(c, white, cl);
      col[k * 3] = c[0];
      col[k * 3 + 1] = c[1];
      col[k * 3 + 2] = c[2];
    }
  }

  // View direction: pick the longitude with most land in view.
  const lat0 = 0.15;
  let best = 0;
  let bestLand = -1;
  for (let t = 0; t < 12; t++) {
    const lon = (t / 12) * Math.PI * 2;
    let n = 0;
    for (let q = 0; q < 200; q++) {
      const a = (q / 200) * Math.PI * 2;
      const rr = Math.sqrt((q * 7 % 200) / 200) * 0.9;
      const x = Math.cos(a) * rr;
      const ys = Math.sin(a) * rr;
      const z = Math.sqrt(Math.max(0, 1 - x * x - ys * ys));
      const yp = ys * Math.cos(lat0) + z * Math.sin(lat0);
      const zp = -ys * Math.sin(lat0) + z * Math.cos(lat0);
      const la = Math.asin(yp);
      const lg = Math.atan2(x, zp) + lon;
      const uu = (((lg / (Math.PI * 2) + 0.5) % 1) + 1) % 1;
      const vv = 0.5 - la / Math.PI;
      n += isLand[Math.min(MH - 1, Math.floor(vv * MH)) * MW + Math.min(MW - 1, Math.floor(uu * MW))];
    }
    if (n > bestLand) { bestLand = n; best = lon; }
  }

  const S = 640;
  const cv = document.createElement("canvas");
  cv.width = S;
  cv.height = S;
  const g = cv.getContext("2d")!;
  const img = g.createImageData(S, S);
  const Lx = -0.45;
  const Ly = 0.5;
  const Lz = 0.74;
  const Ln = Math.sqrt(Lx * Lx + Ly * Ly + Lz * Lz);
  const lx = Lx / Ln;
  const ly = Ly / Ln;
  const lz = Lz / Ln;
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const x = ((px + 0.5) / S) * 2 - 1;
      const ys = -(((py + 0.5) / S) * 2 - 1);
      const d2 = x * x + ys * ys;
      const o = (py * S + px) * 4;
      if (d2 >= 1) continue;
      const z = Math.sqrt(1 - d2);
      const yp = ys * Math.cos(lat0) + z * Math.sin(lat0);
      const zp = -ys * Math.sin(lat0) + z * Math.cos(lat0);
      const la = Math.asin(yp);
      const lg = Math.atan2(x, zp) + best;
      const uu = (((lg / (Math.PI * 2) + 0.5) % 1) + 1) % 1;
      const vv = 0.5 - la / Math.PI;
      const k = Math.min(MH - 1, Math.floor(vv * MH)) * MW + Math.min(MW - 1, Math.floor(uu * MW));
      const diff = Math.max(0, x * lx + ys * ly + z * lz);
      const shade = 0.07 + 0.93 * Math.pow(diff, 0.8);
      let r = col[k * 3] * shade;
      let gg = col[k * 3 + 1] * shade;
      let b = col[k * 3 + 2] * shade;
      const cl = cloud[k] / 255;
      if (!isLand[k]) {
        const dot = 2 * diff;
        const rz = dot * z - lz;
        const spec = Math.pow(Math.max(0, rz), 60) * 0.5 * (1 - cl);
        r += 255 * spec; gg += 255 * spec; b += 255 * spec;
      }
      if (lights[k] && diff < 0.1) {
        const f = (1 - diff / 0.1) * 0.85 * (1 - cl);
        r += 255 * f; gg += 190 * f; b += 110 * f;
      }
      const rim = Math.pow(1 - z, 2.6) * (0.25 + 0.75 * diff);
      r += 70 * rim; gg += 120 * rim; b += 200 * rim;
      img.data[o] = Math.min(255, r);
      img.data[o + 1] = Math.min(255, gg);
      img.data[o + 2] = Math.min(255, b);
      img.data[o + 3] = Math.round(255 * clamp01((1 - Math.sqrt(d2)) * S * 0.5));
    }
  }
  g.putImageData(img, 0, 0);
  return cv;
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
  const specks2: { x: number; y: number; r: number; c: string }[] = [];
  for (let i = 0; i < 260; i++) specks2.push({ x: R() * W, y: R(), r: 0.6 + R() * 1.6, c: R() < 0.5 ? "rgba(40,18,10,0.3)" : "rgba(210,130,90,0.22)" });

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

  const drawEarth = (ctx: Ctx, p: number): void => {
    const alpha = smooth(0.3, 0.36, p);
    if (alpha <= 0.01) return;
    const e = smooth(0.3, 0.55, p);
    const r = W * 1.05;
    const top = lerp(H * 1.1, H * 0.66, e);
    const cx = W / 2;
    const cy = top + r;
    ctx.save();
    ctx.globalAlpha = alpha;
    const atm = ctx.createRadialGradient(cx, cy, r * 0.97, cx, cy, r * 1.07);
    atm.addColorStop(0, "rgba(110,170,255,0.5)");
    atm.addColorStop(0.4, "rgba(110,170,255,0.22)");
    atm.addColorStop(1, "rgba(110,170,255,0)");
    ctx.fillStyle = atm;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(earthMap, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  };

  const drawMars = (ctx: Ctx, p: number): void => {
    const alpha = 1 - smooth(0.26, 0.32, p);
    if (alpha <= 0.01) return;
    const off = smooth(0.05, 0.28, p) * H * 0.6;
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
    for (const sp of specks2) {
      ctx.fillStyle = sp.c;
      ctx.fillRect(sp.x, base + 14 + sp.y * (H - base), sp.r, sp.r);
    }
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
    // Seven drops: K H O E M, then A and I together.
    // The last two meet at Earth's center before separating toward the logo.
    const drops = [
      { start: 0.10, end: 0.70, slot: 0 },
      { start: 0.135, end: 0.735, slot: 1 },
      { start: 0.17, end: 0.77, slot: 2 },
      { start: 0.205, end: 0.805, slot: 3 },
      { start: 0.24, end: 0.84, slot: 4 },
      { start: 0.27, end: 0.89, slot: 6 },
      { start: 0.27, end: 0.89, slot: 7 },
    ];

    const slotGap = Math.min(18, W * 0.052);
    const targetY = Math.min(H * 0.58, H * 0.36 + 105);
    const earthX = W * 0.5;
    const earthY = H * 0.66;

    const pointAt = (d: typeof drops[number], u: number): { x: number; y: number } => {
      const meet = 0.68;
      const finalX = W * 0.5 + (d.slot - 3.5) * slotGap;

      if (u <= meet) {
        const q = smooth(0, meet, u);
        const sx = W * 0.3;
        const sy = H * 0.80;
        const cx = W * (0.34 + d.slot * 0.025);
        const cy = H * 0.30;
        const v = 1 - q;
        return {
          x: v * v * sx + 2 * v * q * cx + q * q * earthX,
          y: v * v * sy + 2 * v * q * cy + q * q * earthY,
        };
      }

      // A and I share the same Earth meeting point, then move apart evenly.
      const q = smooth(meet, 1, u);
      return {
        x: lerp(earthX, finalX, q),
        y: lerp(earthY, targetY, q),
      };
    };

    for (const d of drops) {
      if (p < d.start || p > d.end) continue;

      const u = clamp01((p - d.start) / (d.end - d.start));
      const pos = pointAt(d, u);
      const fadeIn = smooth(0, 0.045, u);
      const fadeOut = 1 - smooth(0.91, 1, u);
      const alpha = fadeIn * fadeOut;
      if (alpha <= 0.01) continue;

      // Soft water trail, following the same curved route.
      for (let j = 12; j >= 1; j--) {
        const trailU = Math.max(0, u - j * 0.022);
        const trail = pointAt(d, trailU);
        const trailAlpha = alpha * (1 - j / 13) * 0.17;
        ctx.globalAlpha = trailAlpha;
        ctx.fillStyle = "#cfe8f7";
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, Math.max(1, 4.2 * (1 - j / 15)), 0, Math.PI * 2);
        ctx.fill();
      }

      const radius = 7.2 * (0.82 + Math.sin(u * Math.PI) * 0.25);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(pos.x, pos.y);
      dropPath(ctx, radius);

      const body = ctx.createRadialGradient(
        -radius * 0.3, -radius * 0.35, 0,
        0, 0, radius * 1.4,
      );
      body.addColorStop(0, "rgba(255,255,255,0.82)");
      body.addColorStop(0.42, "rgba(205,231,246,0.58)");
      body.addColorStop(1, "rgba(105,165,205,0.38)");
      ctx.fillStyle = body;
      ctx.fill();
      ctx.strokeStyle = "rgba(245,252,255,0.85)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.beginPath();
      ctx.ellipse(-radius * 0.32, -radius * 0.24, radius * 0.13, radius * 0.29, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Gentle contact shimmer when A and I meet at Earth.
    const impact = smooth(0.685, 0.705, p) * (1 - smooth(0.745, 0.775, p));
    if (impact > 0.01) {
      const pulse = 9 + impact * 23;
      ctx.save();
      ctx.globalAlpha = impact * 0.72;
      ctx.strokeStyle = "rgba(220,242,255,0.9)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(earthX, earthY, pulse, 0, Math.PI * 2);
      ctx.stroke();

      const glow = ctx.createRadialGradient(earthX, earthY, 0, earthX, earthY, 34);
      glow.addColorStop(0, "rgba(235,248,255,0.42)");
      glow.addColorStop(1, "rgba(130,190,230,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(earthX, earthY, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Small silver-blue flash where the hyphen appears after A and I separate.
    const dashFlash = smooth(0.915, 0.925, p) * (1 - smooth(0.96, 0.985, p));
    if (dashFlash > 0.01) {
      const x = W * 0.5;
      const y = targetY;
      ctx.save();
      ctx.globalAlpha = dashFlash * 0.85;
      ctx.strokeStyle = "rgba(225,244,255,0.95)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - 7, y);
      ctx.lineTo(x + 7, y);
      ctx.stroke();
      ctx.restore();
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
      drawEarth(ctx, p);
      drawMars(ctx, p);
      drawRocks(ctx, p);
      drawDrop(ctx, p);
    },
  };
}
