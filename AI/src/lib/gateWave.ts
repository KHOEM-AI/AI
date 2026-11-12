// Gate "wave signal": three stripes (green, purple, sky blue) that run
// left -> right across the whole screen like a heart-monitor trace.
// Pure drawing code, no React, so it can be tested on its own.

export const WAVE_COLORS = {
  night: ["#22c55e", "#a78bfa", "#38bdf8"],
  day: ["#16a34a", "#7c3aed", "#0284c7"],
};

const bump = (t: number, c: number, w: number, a: number): number =>
  a * Math.exp(-Math.pow((t - c) / w, 2) / 2);

// One heartbeat, t = 0..1 inside the beat. Result is -1..1 (up is positive).
function beat(t: number): number {
  return (
    bump(t, 0.12, 0.035, 0.12) + // P
    bump(t, 0.34, 0.012, -0.18) + // Q
    bump(t, 0.38, 0.014, 1) + // R (tall spike)
    bump(t, 0.42, 0.014, -0.3) + // S
    bump(t, 0.68, 0.06, 0.22) // T
  );
}

const BEAT_PX = 150;
const SCALE = [1, 0.72, 0.5];
const WIDTH = [2.6, 2.1, 1.7];
const SHIFT = [0, 0.16, 0.32]; // each stripe is a little behind the first

export const waveBaseY = (h: number): number => h * 0.58;

export function drawWave(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: number,
  theme: "day" | "night",
): void {
  ctx.clearRect(0, 0, w, h);
  const colors = WAVE_COLORS[theme];
  const baseY = waveBaseY(h);
  const amp = Math.min(64, h * 0.09);
  const endX = Math.max(0, Math.min(1, p)) * w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < 3; i++) {
    const y0 = baseY + (i - 1) * 6;
    ctx.strokeStyle = colors[i];
    ctx.shadowColor = colors[i];
    ctx.shadowBlur = theme === "night" ? 8 : 3;
    ctx.lineWidth = WIDTH[i];
    ctx.beginPath();
    let lastY = y0;
    for (let x = 0; x <= endX; x += 1) {
      const t = (x / BEAT_PX + SHIFT[i]) % 1;
      lastY = y0 - amp * SCALE[i] * beat(t);
      if (x === 0) ctx.moveTo(x, lastY);
      else ctx.lineTo(x, lastY);
    }
    ctx.stroke();
    if (endX > 0) {
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(endX, lastY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}
