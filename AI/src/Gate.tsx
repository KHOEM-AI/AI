import khoemLogo from "./assets/khoem-ai-logo.webp";
import { useEffect, useRef, useState } from "react";
import App from "./App";
import GatePoem from "./components/GatePoem";
import { createScene, type Scene } from "./lib/gateScene";

const readFlag = (k: string): boolean => {
  try { return sessionStorage.getItem("khoem." + k) === "1"; } catch { return false; }
};
const writeFlag = (k: string): void => {
  try { sessionStorage.setItem("khoem." + k, "1"); } catch { /* storage may be disabled */ }
};

// Hold time, in milliseconds. The whole space scene plays over this time.
const HOLD_MS = 30000;
// The name pops up 1 second before the end.
const NAME_AT = 1 - 1000 / HOLD_MS;

export default function Gate() {
  const [ok, setOk] = useState(() => readFlag("gate.ok"));
  const [pct, setPct] = useState(0);
  const [poemDone, setPoemDone] = useState(() => readFlag("gate.poem"));
  const cv = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const start = useRef<number | null>(null);
  const raf = useRef(0);
  const scene = useRef<Scene | null>(null);
  const dpr = useRef(1);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const d = Math.min(2, window.devicePixelRatio || 1);
    dpr.current = d;
    c.width = Math.round(window.innerWidth * d);
    c.height = Math.round(window.innerHeight * d);
    // Build the scene a moment after mount so the gate appears instantly.
    const build = window.setTimeout(() => {
      scene.current = createScene(window.innerWidth, window.innerHeight);
    }, 60);
    return () => {
      window.clearTimeout(build);
      window.clearTimeout(timer.current);
    };
  }, []);

  const draw = (p: number, now: number) => {
    const c = cv.current;
    if (!c || !scene.current) return;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr.current, 0, 0, dpr.current, 0, 0);
    scene.current.draw(ctx, p, now / 1000);
  };

  const tick = () => {
    if (start.current === null) return;
    // eslint-disable-next-line react-hooks/purity
    const now = performance.now();
    const p = Math.min(1, (now - start.current) / HOLD_MS);
    setPct(p);
    draw(p, now);
    if (p >= 1) {
      // Scene finished: short pause, then unlock.
      start.current = null;
      doneRef.current = true;
      timer.current = window.setTimeout(() => { setOk(true); writeFlag("gate.ok"); }, 400);
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  const down = () => {
    if (start.current !== null || doneRef.current) return;
    start.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };

  const up = () => {
    if (ok || doneRef.current) return;
    start.current = null;
    cancelAnimationFrame(raf.current);
    const c = cv.current;
    if (c) {
      const ctx = c.getContext("2d")!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
    }
    setPct(0);
  };

  if (ok && !poemDone) return <GatePoem onContinue={() => { setPoemDone(true); writeFlag("gate.poem"); }} />;
  if (ok) return <App />;

  // Logo is shown while waiting, hides while the scene plays, and comes back at the end.
  const logoOpacity =
    pct === 0 ? 1 : pct < 0.05 ? 1 - pct / 0.05 : pct < 0.78 ? 0 : Math.min(1, (pct - 0.78) / 0.12);

  return (
    <div className={"gate" + (pct > 0 ? " is-holding" : "")}>
      <canvas ref={cv} className="gate__canvas" />
      <img src={khoemLogo} alt="KHOEM-AI" className="gate__eye gate__logo" style={{ width: "180px", height: "auto", opacity: logoOpacity }} />
      <div className="gate__count">{Math.ceil(pct * 100)}</div>
      <div className={"gate__name" + (pct >= NAME_AT ? " is-on" : "")}>
        <span className="gate__name-main">KHOEM-AI</span>
        <span className="gate__name-sub">KHOEM SOKSIVUTHA</span>
      </div>
      <button
        className="gate__btn"
        onPointerDown={down}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        onContextMenu={(e) => e.preventDefault()}
      >
        HOLD FOR {HOLD_MS / 1000} SECONDS
      </button>
      <div className="gate__hint">Press and hold for {HOLD_MS / 1000} seconds to unlock the app</div>
    </div>
  );
}
