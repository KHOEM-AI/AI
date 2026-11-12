import khoemLogo from "./assets/khoem-ai-logo.webp";
import { useEffect, useRef, useState } from "react";
import App from "./App";
import GatePoem from "./components/GatePoem";
import { drawWave } from "./lib/gateWave";

const readFlag = (k: string): boolean => {
  try { return sessionStorage.getItem("khoem." + k) === "1"; } catch { return false; }
};
const writeFlag = (k: string): void => {
  try { sessionStorage.setItem("khoem." + k, "1"); } catch { /* storage may be disabled */ }
};

// The name pops up 1 second before the wave reaches the right edge (hold = 3 s).
const NAME_AT = 2 / 3;

export default function Gate() {
  const [ok, setOk] = useState(() => readFlag("gate.ok"));
  const [pct, setPct] = useState(0);
  const [poemDone, setPoemDone] = useState(() => readFlag("gate.poem"));
  const cv = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const start = useRef<number | null>(null);
  const raf = useRef(0);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    return () => window.clearTimeout(timer.current);
  }, []);

  const draw = (p: number) => {
    const c = cv.current;
    if (!c) return;
    const theme = document.documentElement.getAttribute("data-theme") === "day" ? "day" : "night";
    drawWave(c.getContext("2d")!, c.width, c.height, p, theme);
  };

  const tick = () => {
    if (start.current === null) return;
    // eslint-disable-next-line react-hooks/purity
    const p = Math.min(1, (performance.now() - start.current) / 3000);
    setPct(p);
    draw(p);
    if (p >= 1) {
      // Wave reached the right edge: short pause, then unlock.
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
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setPct(0);
  };

  if (ok && !poemDone) return <GatePoem onContinue={() => { setPoemDone(true); writeFlag("gate.poem"); }} />;
  if (ok) return <App />;

  return (
    <div className="gate">
      <canvas ref={cv} className="gate__canvas" />
      <img src={khoemLogo} alt="KHOEM-AI" className="gate__eye gate__logo" style={{ width: "180px", height: "auto" }} />
      <div className="gate__count">{Math.ceil(pct * 100)}</div>
      <div className={"gate__name" + (pct >= NAME_AT ? " is-on" : "")}>KHOEM-AI</div>
      <button
        className="gate__btn"
        onPointerDown={down}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        onContextMenu={(e) => e.preventDefault()}
      >
        HOLD FOR 3 SECONDS
      </button>
      <div className="gate__hint">Press and hold for 3 seconds to unlock the app</div>
    </div>
  );
}
