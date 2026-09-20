import { useEffect, useRef, useState } from "react";
import App from "./App";

type Seg = { x1: number; y1: number; x2: number; y2: number; c: string; w: number; t: number };
const COLORS = ["#ef4444", "#dc2626", "#f87171", "#4ade80", "#2dd4bf", "#38bdf8", "#a78bfa", "#f9a8d4", "#fbbf24"];
const Q = Math.PI / 4;
const N = 168;
const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)];

function build(w: number, h: number): Seg[] {
  const segs: Seg[] = [];
  const cx0 = w / 2, cy0 = h / 2;
  for (let i = 0; i < N; i++) {
    const right = i % 2 === 0;
    const c = pick();
    const spread = (Math.floor(i / 2) / (N / 2 - 1)) * 2 - 1;
    let a = (right ? 0 : Math.PI) + spread * (Math.PI / 2.2) * (right ? 1 : -1);
    a = Math.round(a / Q) * Q;
    let x = cx0, y = cy0;
    const step = Math.max(w, h) / 22;
    const order = i / N;
    let k = 0;
    while (k < 40) {
      const l = step * (0.7 + Math.random() * 0.6);
      const nx = x + Math.cos(a) * l;
      const ny = y + Math.sin(a) * l;
      if (nx < -20 || nx > w + 20 || ny < -20 || ny > h + 20) break;
      segs.push({ x1: x, y1: y, x2: nx, y2: ny, c, w: 1.6, t: order + k * 0.02 });
      x = nx; y = ny; k++;
      if (Math.random() < 0.3) a += Math.random() < 0.5 ? -Q : Q;
    }
  }
  return segs.sort((p, q) => p.t - q.t);
}

export default function Gate() {
  const [ok, setOk] = useState(false);
  const [pct, setPct] = useState(0);
  const cv = useRef<HTMLCanvasElement>(null);
  const segs = useRef<Seg[]>([]);
  const drawn = useRef(0);
  const start = useRef<number | null>(null);
  const raf = useRef(0);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    segs.current = build(c.width, c.height);
  }, []);

  const draw = (p: number) => {
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const n = Math.floor(p * segs.current.length);
    ctx.lineCap = "round";
    for (let i = drawn.current; i < n; i++) {
      const s = segs.current[i];
      ctx.strokeStyle = s.c;
      ctx.lineWidth = s.w;
      ctx.shadowColor = s.c;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
    }
    drawn.current = n;
  };

  const tick = () => {
    if (start.current === null) return;
    const p = Math.min(1, (performance.now() - start.current) / 10000);
    setPct(p);
    draw(p);
    if (p >= 1) { start.current = null; setOk(true); return; }
    raf.current = requestAnimationFrame(tick);
  };

  const down = () => {
    if (start.current !== null) return;
    start.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };

  const up = () => {
    if (ok) return;
    start.current = null;
    cancelAnimationFrame(raf.current);
    const c = cv.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    drawn.current = 0;
    setPct(0);
  };

  if (ok) return <App />;

  return (
    <div className="gate">
      <canvas ref={cv} className="gate__canvas" />
      <svg className="gate__eye gate__heart" viewBox="0 0 220 240" style={{ animationDuration: (1.1 - pct * 0.5) + "s" }}>
        <defs>
          <radialGradient id="hg" cx="38%" cy="30%" r="80%">
            <stop offset="0" stopColor="#f87171" />
            <stop offset="0.5" stopColor="#b91c1c" />
            <stop offset="1" stopColor="#450a0a" />
          </radialGradient>
          <linearGradient id="vein" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#60a5fa" />
            <stop offset="1" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>
        <path d="M78 70 C74 40 84 14 98 8 C108 6 110 20 104 30 C100 44 100 58 100 72Z" fill="url(#vein)" stroke="#93c5fd" strokeWidth="1.5" />
        <path d="M118 66 C116 34 130 8 158 10 C176 12 186 28 172 38 C156 34 142 44 138 70Z" fill="#dc2626" stroke="#fecaca" strokeWidth="1.5" />
        <path d="M138 68 C150 52 176 52 184 70 C188 84 176 92 164 88 C152 84 140 78 138 68Z" fill="#7f1d1d" stroke="#fca5a5" strokeWidth="1.2" />
        <path d="M110 232 C60 200 26 150 30 106 C32 82 50 66 76 66 C94 66 106 76 116 88 C130 70 158 62 180 78 C204 96 196 140 172 176 C154 202 132 220 110 232Z" fill="url(#hg)" stroke="#fecdd3" strokeWidth="2" />
        <path d="M60 96 C50 112 52 132 62 146" fill="none" stroke="#fee2e2" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
        <path d="M112 90 C104 130 106 180 112 226" fill="none" stroke="#7f1d1d" strokeWidth="4" opacity="0.7" />
        <path d="M84 96 C90 130 96 160 108 196 M148 100 C142 140 132 176 118 206 M130 92 C134 118 138 140 140 160" fill="none" stroke="#ef4444" strokeWidth="3" opacity="0.85" />
        <path d="M70 130 C64 150 70 170 84 186" fill="none" stroke="#fbbf24" strokeWidth="3" opacity="0.5" />
      </svg>
      <div className="gate__count">{Math.ceil(pct * 100)}</div>
      <button
        className="gate__btn"
        onPointerDown={down}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        onContextMenu={(e) => e.preventDefault()}
      >
        ចុចឱ្យជាប់ ១០ វិនាទី
      </button>
    </div>
  );
}
