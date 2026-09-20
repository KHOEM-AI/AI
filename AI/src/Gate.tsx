import { useEffect, useRef, useState } from "react";
import App from "./App";

type Seg = { x1: number; y1: number; x2: number; y2: number; c: string; w: number; d: number };
const COLORS = ["#38bdf8", "#22c55e", "#a855f7", "#14b8a6", "#3b82f6"];
const Q = Math.PI / 4;

function build(w: number, h: number): Seg[] {
  const segs: Seg[] = [];
  const grow = (x: number, y: number, a: number, len: number, d: number, c: string) => {
    if (d > 5 || len < 9) return;
    const steps = 3 + Math.floor(Math.random() * 3);
    let cx = x, cy = y, ca = a;
    for (let i = 0; i < steps; i++) {
      const l = len * (0.6 + Math.random() * 0.5);
      const nx = cx + Math.cos(ca) * l;
      const ny = cy + Math.sin(ca) * l;
      segs.push({ x1: cx, y1: cy, x2: nx, y2: ny, c, w: Math.max(1, 3.2 - d * 0.5), d });
      cx = nx; cy = ny;
      if (Math.random() < 0.5) ca += (Math.random() < 0.5 ? -Q : Q);
      if (Math.random() < 0.45)
        grow(cx, cy, ca + (Math.random() < 0.5 ? -Q : Q), len * 0.75, d + 1, COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
  };
  for (let i = 0; i < 12; i++) {
    grow(w / 2, h / 2, i * Q * (8 / 12) * 1.5 - i * 0 + Math.round((i * 2 * Math.PI) / 12 / Q) * Q - i * 0, Math.min(w, h) / 6, 0, COLORS[i % COLORS.length]);
  }
  return segs.sort((p, q) => p.d - q.d);
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
      ctx.shadowBlur = 6;
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
      <svg className="gate__eye" viewBox="0 0 200 100">
        <path d="M10 50 Q100 -10 190 50 Q100 110 10 50Z" fill="none" stroke="#38bdf8" strokeWidth="3" />
        <circle cx="100" cy="50" r="24" fill="none" stroke="#22c55e" strokeWidth="3" />
        <circle cx="100" cy="50" r="10" fill="#38bdf8" />
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
