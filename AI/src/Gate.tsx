import { useEffect, useRef, useState } from "react";
import App from "./App";

type Seg = { x1: number; y1: number; x2: number; y2: number; c: string; w: number };
const COLORS = ["#ffffff", "#38bdf8", "#ff5fa2", "#ffd93b", "#a78bfa", "#34d399", "#ff5f5f"];
const Q = Math.PI / 4;
const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)];

function build(w: number, h: number): Seg[] {
  const segs: Seg[] = [];
  const grow = (x: number, y: number, a: number, len: number, d: number, c: string) => {
    if (d > 4) return;
    const steps = d === 0 ? 14 : 3 + Math.floor(Math.random() * 4);
    let cx = x, cy = y, ca = a;
    for (let i = 0; i < steps; i++) {
      const l = len * (0.7 + Math.random() * 0.5);
      const nx = cx + Math.cos(ca) * l;
      const ny = cy + Math.sin(ca) * l;
      if (nx < -20 || nx > w + 20 || ny < -20 || ny > h + 20) break;
      segs.push({ x1: cx, y1: cy, x2: nx, y2: ny, c, w: Math.max(1, 2.6 - d * 0.4) });
      cx = nx; cy = ny;
      if (Math.random() < 0.25) ca += Math.random() < 0.5 ? -Q : Q;
      if (Math.random() < 0.3)
        grow(cx, cy, ca + (Math.random() < 0.5 ? -Q : Q), len * 0.7, d + 1, pick());
    }
  };
  const rows = 16;
  for (let i = 0; i < rows; i++) {
    const y = ((i + 0.5) * h) / rows;
    grow(w / 2, y, 0, w / 12, 0, pick());
    grow(w / 2, y, Math.PI, w / 12, 0, pick());
  }
  return segs.sort((p, q) => Math.abs(p.x1 - w / 2) - Math.abs(q.x1 - w / 2));
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
      ctx.shadowBlur = 8;
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
        <circle cx="100" cy="50" r="24" fill="none" stroke="#ff5fa2" strokeWidth="3" />
        <circle cx="100" cy="50" r="10" fill="#ffd93b" />
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
