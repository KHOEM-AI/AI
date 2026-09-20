import { useEffect, useRef, useState } from "react";
import App from "./App";

type Seg = { x1: number; y1: number; x2: number; y2: number; c: string; w: number; t: number };
const COLORS = ["#ffffff", "#38bdf8", "#ff5fa2", "#ffd93b", "#a78bfa", "#34d399", "#ff5f5f"];
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
