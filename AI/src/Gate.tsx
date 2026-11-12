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
const HOLD_MS = 15000;
const GATE_LETTERS: ReadonlyArray<readonly [string, number]> = [
  ["K", 0.70],
  ["H", 0.735],
  ["O", 0.77],
  ["E", 0.805],
  ["M", 0.84],
  ["-", 0.925],
  ["A", 0.89],
  ["I", 0.89],
];


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

  // Prepare IQ-AI neural speech during the hold; play when the logo letters appear.
  const voicePlayed = useRef(false);
  const voiceRequest = useRef(0);
  const audioContext = useRef<AudioContext | null>(null);
  const audioBuffer = useRef<AudioBuffer | null>(null);
  const audioSource = useRef<AudioBufferSourceNode | null>(null);

  const playBrandVoice = () => {
    const context = audioContext.current;
    const buffer = audioBuffer.current;
    if (voicePlayed.current || !context || !buffer || context.state !== "running") return;

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.onended = () => {
      if (audioSource.current === source) audioSource.current = null;
    };
    audioSource.current = source;
    voicePlayed.current = true;
    source.start(0);
  };

  const cancelBrandVoice = () => {
    voiceRequest.current += 1;
    try { audioSource.current?.stop(); } catch { /* already stopped */ }
    audioSource.current = null;
    audioBuffer.current = null;
    const context = audioContext.current;
    audioContext.current = null;
    if (context && context.state !== "closed") void context.close();
  };

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
      voiceRequest.current += 1;
      try { audioSource.current?.stop(); } catch { /* already stopped */ }
      if (audioContext.current && audioContext.current.state !== "closed") {
        void audioContext.current.close();
      }
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

    // Speak as the KHOEM-AI letters begin to appear.
    if (p >= 0.70) playBrandVoice();

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
    cancelBrandVoice();
    voicePlayed.current = false;
    start.current = performance.now();

    // Unlock audio during the user's pointer gesture, then prepare the neural voice.
    const AudioContextCtor = window.AudioContext;
    if (AudioContextCtor) {
      const context = new AudioContextCtor();
      audioContext.current = context;
      const requestId = voiceRequest.current;

      void context.resume().catch(() => {});

      const ttsUrl = import.meta.env.DEV
        ? "/iqai/audio/tts"
        : "/api/iq-ai/audio/tts";

      void fetch(ttsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Khoem AI", lang: "en" }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("IQ-AI TTS HTTP " + response.status);
          return response.arrayBuffer();
        })
        .then((data) => context.decodeAudioData(data))
        .then((buffer) => {
          if (requestId !== voiceRequest.current || start.current === null) return;
          audioBuffer.current = buffer;
          if ((performance.now() - start.current) / HOLD_MS >= 0.70) {
            playBrandVoice();
          }
        })
        .catch((error) => {
          if (requestId === voiceRequest.current) {
            console.warn("[KHOEM-AI Gate] IQ-AI voice unavailable:", error);
          }
        });
    }

    raf.current = requestAnimationFrame(tick);
  };

  const up = () => {
    if (ok || doneRef.current) return;
    start.current = null;
    cancelAnimationFrame(raf.current);

    cancelBrandVoice();

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
      <div className={"gate__name" + (pct >= 0.68 ? " is-on" : "")}>
        <span className="gate__name-main" aria-label="KHOEM-AI">
          {GATE_LETTERS.map(([letter, at], index) => (
            <span
              key={index}
              className="gate__letter"
              style={{
                opacity: pct >= at ? 1 : 0,
                transform: pct >= at ? "translateY(0) scale(1)" : "translateY(12px) scale(.7)",
              }}
            >
              {letter}
            </span>
          ))}
        </span>
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
