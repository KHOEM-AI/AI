import { useEffect, useRef, useState } from "react";
import khoemLogo from "../assets/khoem-ai-logo.webp";
import { uploadMedia } from "../api/client";
import SoundLibrary from "../components/SoundLibrary";
import "./studio.css";

// KHOEM-AI Creative Studio: Home, Audio editor (library, record, AI sound tools, quick/pro
// controls, timeline, export), Video preview and the sound Library. Calls IQ-AI through /iqai.

type Fx = { vol: number; bass: number; mid: number; treble: number; speed: number; comp: boolean };
type Sel = { a: number; b: number };
type Chain = {
  input: AudioNode;
  bass: BiquadFilterNode;
  mid: BiquadFilterNode;
  treble: BiquadFilterNode;
  comp: DynamicsCompressorNode;
  gain: GainNode;
  analyser: AnalyserNode;
};

const FX0: Fx = { vol: 1, bass: 0, mid: 0, treble: 0, speed: 1, comp: false };
const FX_KEY = "khoem.studio.audio.fx";

function loadFx(): Fx {
  try {
    const raw = localStorage.getItem(FX_KEY);
    if (raw) return { ...FX0, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return FX0;
}

function buildChain(ctx: BaseAudioContext, fx: Fx): Chain {
  const bass = ctx.createBiquadFilter();
  bass.type = "lowshelf";
  bass.frequency.value = 120;
  const mid = ctx.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = 1000;
  mid.Q.value = 0.8;
  const treble = ctx.createBiquadFilter();
  treble.type = "highshelf";
  treble.frequency.value = 6000;
  const comp = ctx.createDynamicsCompressor();
  const gain = ctx.createGain();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 128;
  bass.connect(mid);
  mid.connect(treble);
  treble.connect(comp);
  comp.connect(gain);
  gain.connect(ctx.destination);
  gain.connect(analyser);
  const chain = { input: bass, bass, mid, treble, comp, gain, analyser };
  applyFx(chain, fx);
  return chain;
}

function applyFx(c: Chain, fx: Fx) {
  c.bass.gain.value = fx.bass;
  c.mid.gain.value = fx.mid;
  c.treble.gain.value = fx.treble;
  c.comp.threshold.value = fx.comp ? -26 : 0;
  c.comp.ratio.value = fx.comp ? 4 : 1;
  c.gain.gain.value = fx.vol;
}

function encodeWav(b: AudioBuffer): ArrayBuffer {
  const ch = b.numberOfChannels;
  const n = b.length;
  const rate = b.sampleRate;
  const view = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); view.setUint32(4, 36 + n * ch * 2, true); str(8, "WAVE");
  str(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, ch, true); view.setUint32(24, rate, true);
  view.setUint32(28, rate * ch * 2, true); view.setUint16(32, ch * 2, true); view.setUint16(34, 16, true);
  str(36, "data"); view.setUint32(40, n * ch * 2, true);
  const data = Array.from({ length: ch }, (_, c) => b.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      o += 2;
    }
  }
  return view.buffer as ArrayBuffer;
}

function peaksOf(b: AudioBuffer, bins = 900): number[] {
  const out: number[] = new Array(bins).fill(0);
  const step = Math.max(1, Math.floor(b.length / bins));
  for (let c = 0; c < b.numberOfChannels; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < bins; i++) {
      let m = 0;
      const end = Math.min(b.length, (i + 1) * step);
      for (let j = i * step; j < end; j += 8) { const v = Math.abs(d[j]); if (v > m) m = v; }
      if (m > out[i]) out[i] = m;
    }
  }
  const top = Math.max(0.0001, ...out);
  return out.map((v) => v / top);
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
function fmt(t: number) {
  const s = Math.max(0, t);
  const m = Math.floor(s / 60);
  return String(m).padStart(2, "0") + ":" + (s % 60).toFixed(1).padStart(4, "0");
}

/* ---------- waveform / timeline ---------- */
function Wave(p: {
  peaks: number[]; head: number; sel: Sel | null; height: number;
  onSeek: (f: number) => void; onSelect: (s: Sel | null) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x0: number; moved: boolean } | null>(null);
  const [w, setW] = useState(600);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || 600));
    ro.observe(el);
    setW(el.clientWidth || 600);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.floor(w * dpr);
    cv.height = Math.floor(p.height * dpr);
    const g = cv.getContext("2d");
    if (!g) return;
    g.scale(dpr, dpr);
    g.clearRect(0, 0, w, p.height);
    const accent = getComputedStyle(cv).getPropertyValue("--ks-accent").trim() || "#7c6cff";
    const n = p.peaks.length;
    const bw = w / Math.max(1, n);
    for (let i = 0; i < n; i++) {
      const f = i / n;
      const inSel = p.sel && f >= p.sel.a && f <= p.sel.b;
      g.fillStyle = inSel ? accent : "#7d7d89";
      const h = Math.max(1.5, p.peaks[i] * p.height * 0.9);
      g.fillRect(i * bw, (p.height - h) / 2, Math.max(1, bw - 0.6), h);
    }
    if (p.sel) {
      g.fillStyle = "rgba(124,108,255,0.16)";
      g.fillRect(p.sel.a * w, 0, (p.sel.b - p.sel.a) * w, p.height);
    }
    g.fillStyle = "#ffffff";
    g.fillRect(Math.min(w - 2, p.head * w), 0, 2, p.height);
  }, [p.peaks, p.head, p.sel, p.height, w]);

  const frac = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return clamp01((e.clientX - r.left) / Math.max(1, r.width));
  };

  return (
    <canvas
      ref={ref}
      className="ks-wave"
      style={{ width: "100%", height: p.height }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x0: frac(e), moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const f = frac(e);
        if (Math.abs(f - d.x0) * w > 4) {
          d.moved = true;
          p.onSelect({ a: Math.min(f, d.x0), b: Math.max(f, d.x0) });
        }
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        if (d && !d.moved) { p.onSelect(null); p.onSeek(frac(e)); }
      }}
    />
  );
}

function Bars(p: { analyser: () => AnalyserNode | null; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    let id = 0;
    const draw = () => {
      g.clearRect(0, 0, cv.width, cv.height);
      const an = p.active ? p.analyser() : null;
      const bins = 32;
      const data = new Uint8Array(an ? an.frequencyBinCount : 0);
      if (an) an.getByteFrequencyData(data);
      const bw = cv.width / bins;
      for (let i = 0; i < bins; i++) {
        const v = an && data.length ? data[Math.floor((i * data.length) / bins)] / 255 : 0;
        const h = Math.max(3, v * cv.height);
        g.fillStyle = "#7c6cff";
        g.fillRect(i * bw + 2, cv.height - h, bw - 4, h);
      }
      if (p.active) id = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.active]);
  return <canvas ref={ref} className="ks-bars" width={320} height={90} />;
}

function Slider(p: {
  label: string; min: number; max: number; step: number; value: number; unit?: string;
  onChange: (v: number) => void; onCommit: () => void;
}) {
  const dec = p.step < 0.1 ? 2 : p.step < 1 ? 1 : 0;
  return (
    <label className="ks-slider">
      <span>{p.label}</span>
      <input
        type="range" min={p.min} max={p.max} step={p.step} value={p.value}
        onChange={(e) => p.onChange(Number(e.target.value))}
        onPointerUp={p.onCommit} onKeyUp={p.onCommit}
      />
      <output>{p.value.toFixed(dec)}{p.unit ?? ""}</output>
    </label>
  );
}

/* ---------- IQ-AI helper + offline render ---------- */
async function api(path: string, init?: RequestInit): Promise<Response> {
  const r = await fetch("/iqai" + path, init);
  if (!r.ok) {
    const j = await r.json().catch(() => null);
    const e = j?.error;
    throw new Error((typeof e === "string" ? e : e?.message ?? e?.code) ?? "HTTP " + r.status);
  }
  return r;
}

async function renderBuffer(b: AudioBuffer, f: Fx, lo: number, hi: number): Promise<AudioBuffer> {
  const len = Math.max(1, Math.ceil(((hi - lo) / f.speed) * b.sampleRate));
  const off = new OfflineAudioContext(b.numberOfChannels, len, b.sampleRate);
  const chain = buildChain(off, f);
  const src = off.createBufferSource();
  src.buffer = b;
  src.playbackRate.value = f.speed;
  src.connect(chain.input);
  src.start(0, lo, hi - lo);
  return off.startRendering();
}

type Sound = { id: string; name: string };
const PRESETS = ["ghost", "demon", "alien", "underwater", "male", "female"];

/* ---------- audio editor ---------- */
function AudioEditor({ onBack, active }: { onBack: () => void; active: boolean }) {
  const [name, setName] = useState("");
  const [dur, setDur] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [head, setHead] = useState(0);
  const [sel, setSel] = useState<Sel | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [recording, setRecording] = useState(false);
  const [fx, setFx] = useState<Fx>(loadFx);
  const [pro, setPro] = useState(false);
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [soundsErr, setSoundsErr] = useState("");
  const [sfxType, setSfxType] = useState("siren");
  const [ttsText, setTtsText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [, bump] = useState(0);

  const bufRef = useRef<AudioBuffer | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const chainRef = useRef<Chain | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const anchor = useRef({ t: 0, pos: 0 });
  const headRef = useRef(0);
  const fxRef = useRef(fx); fxRef.current = fx;
  const selRef = useRef(sel); selRef.current = sel;
  const loopRef = useRef(loop); loopRef.current = loop;
  const committed = useRef<Fx>(fx);
  const past = useRef<Fx[]>([]);
  const future = useRef<Fx[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const rec = useRef<MediaRecorder | null>(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const c = new AC();
      ctxRef.current = c;
      chainRef.current = buildChain(c, fxRef.current);
    }
    return ctxRef.current;
  };

  const stopSrc = () => {
    const s = srcRef.current;
    srcRef.current = null;
    if (s) {
      s.onended = null;
      try { s.stop(); } catch { /* already stopped */ }
      s.disconnect();
    }
  };

  const posNow = () => {
    const c = ctxRef.current;
    const b = bufRef.current;
    if (!b) return 0;
    if (!c || !srcRef.current) return headRef.current * b.duration;
    let p = anchor.current.pos + (c.currentTime - anchor.current.t) * fxRef.current.speed;
    const s = selRef.current;
    const lo = s ? s.a * b.duration : 0;
    const hi = s ? s.b * b.duration : b.duration;
    if (loopRef.current && hi > lo && p >= hi) p = lo + ((p - lo) % (hi - lo));
    return Math.min(p, b.duration);
  };

  const play = async () => {
    const b = bufRef.current;
    if (!b) return;
    const c = getCtx();
    await c.resume();
    stopSrc();
    const s = selRef.current;
    const lo = s ? s.a * b.duration : 0;
    const hi = s ? s.b * b.duration : b.duration;
    let start = headRef.current * b.duration;
    if (start < lo || start >= hi - 0.02) start = lo;
    const node = c.createBufferSource();
    node.buffer = b;
    node.playbackRate.value = fxRef.current.speed;
    node.connect(chainRef.current!.input);
    if (loopRef.current) { node.loop = true; node.loopStart = lo; node.loopEnd = hi; }
    node.onended = () => {
      if (srcRef.current !== node) return;
      srcRef.current = null;
      headRef.current = hi / b.duration;
      setHead(headRef.current);
      setPlaying(false);
    };
    anchor.current = { t: c.currentTime, pos: start };
    srcRef.current = node;
    if (loopRef.current) node.start(0, start); else node.start(0, start, hi - start);
    setPlaying(true);
  };

  const pause = () => {
    const b = bufRef.current;
    if (b && srcRef.current) { headRef.current = posNow() / b.duration; setHead(headRef.current); }
    stopSrc();
    setPlaying(false);
  };

  const stop = () => {
    stopSrc();
    setPlaying(false);
    headRef.current = selRef.current ? selRef.current.a : 0;
    setHead(headRef.current);
  };

  const seek = (f: number) => {
    headRef.current = f;
    setHead(f);
    if (srcRef.current) void play();
  };

  const setLive = (patch: Partial<Fx>) => {
    const next = { ...fxRef.current, ...patch };
    if (patch.speed !== undefined && srcRef.current && ctxRef.current) {
      anchor.current = { t: ctxRef.current.currentTime, pos: posNow() };
      srcRef.current.playbackRate.value = next.speed;
    }
    fxRef.current = next;
    setFx(next);
  };

  const commit = () => {
    if (JSON.stringify(committed.current) === JSON.stringify(fxRef.current)) return;
    past.current.push(committed.current);
    committed.current = fxRef.current;
    future.current = [];
    bump((n) => n + 1);
  };
  const undo = () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(committed.current);
    committed.current = prev;
    setLive({ ...prev });
    bump((n) => n + 1);
  };
  const redo = () => {
    const nxt = future.current.pop();
    if (!nxt) return;
    past.current.push(committed.current);
    committed.current = nxt;
    setLive({ ...nxt });
    bump((n) => n + 1);
  };
  const reset = () => { setLive({ ...FX0 }); commit(); };

  useEffect(() => {
    if (chainRef.current) applyFx(chainRef.current, fx);
    try { localStorage.setItem(FX_KEY, JSON.stringify(fx)); } catch { /* ignore */ }
  }, [fx]);

  useEffect(() => {
    if (!playing) return;
    let id = 0;
    const tick = () => {
      const b = bufRef.current;
      if (b) { headRef.current = posNow() / b.duration; setHead(headRef.current); }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => {
    if (!active) pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => () => {
    stopSrc();
    void ctxRef.current?.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api("/sounds?limit=200")
      .then((r) => r.json())
      .then((j) => setSounds((j.items ?? []) as Sound[]))
      .catch(() => setSoundsErr("មិនអាចទាញបញ្ជីបណ្ណាល័យបានទេ (ពិនិត្យ IQ-AI ច្រក 8799)"));
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg("");
    try { await fn(); } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };

  const openBuffer = async (data: ArrayBuffer, label: string) => {
    try {
      const b = await getCtx().decodeAudioData(data);
      stopSrc();
      setPlaying(false);
      bufRef.current = b;
      setName(label);
      setDur(b.duration);
      setPeaks(peaksOf(b));
      setSel(null);
      headRef.current = 0;
      setHead(0);
      setMsg("");
    } catch {
      setMsg("បើកឯកសារមិនបាន (ទ្រង់ទ្រាយមិនគាំទ្រ ឬខូច)");
    }
  };

  const openFile = (f: File | undefined) => {
    if (f) void run(async () => { await openBuffer(await f.arrayBuffer(), f.name); });
  };
  const pickSound = (s: Sound) => run(async () => {
    const r = await api("/sounds/" + encodeURIComponent(s.id) + "/content");
    await openBuffer(await r.arrayBuffer(), s.name);
  });

  const toggleRec = () => run(async () => {
    if (recording) { rec.current?.stop(); return; }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    mr.ondataavailable = (e) => chunks.push(e.data);
    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      void run(async () => { await openBuffer(await new Blob(chunks).arrayBuffer(), "ថតសំឡេង"); });
    };
    mr.start();
    rec.current = mr;
    setRecording(true);
  });

  const genSfx = () => run(async () => {
    const r = await api("/audio/sfx", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: sfxType, durationSec: 3 }) });
    await openBuffer(await r.arrayBuffer(), "SFX · " + sfxType);
  });
  const applyVoice = (preset: string) => run(async () => {
    const b = bufRef.current;
    if (!b) throw new Error("បើកសំឡេងមុន");
    const wav = encodeWav(await renderBuffer(b, FX0, 0, b.duration));
    const r = await api("/audio/voice?preset=" + preset, { method: "POST", body: wav });
    await openBuffer(await r.arrayBuffer(), name + " · " + preset);
  });
  const tts = () => run(async () => {
    const r = await fetch("/iqai/audio/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: ttsText }) });
    if (r.status === 501) throw new Error("មិនទាន់ភ្ជាប់ TTS provider (Not Configured)");
    if (!r.ok) throw new Error("HTTP " + r.status);
    await openBuffer(await r.arrayBuffer(), "TTS");
  });

  const doExport = (toIqai: boolean) => run(async () => {
    const b = bufRef.current;
    if (!b) return;
    const s = selRef.current;
    const wav = encodeWav(await renderBuffer(b, fxRef.current, s ? s.a * b.duration : 0, s ? s.b * b.duration : b.duration));
    const blob = new Blob([wav], { type: "audio/wav" });
    const fname = (name.replace(/\.[^.]+$/, "") || "khoem-audio") + "-khoem.wav";
    if (toIqai) {
      await uploadMedia(blob, fname);
      setMsg("រក្សាទុកក្នុង IQ-AI រួច");
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fname;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setMsg("នាំចេញរួច");
    }
  });

  const has = peaks.length > 0;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="ks-editor" style={{ display: active ? undefined : "none" }}>
      <header className="ks-top">
        <button className="ks-btn" onClick={onBack} aria-label="ត្រឡប់ក្រោយ">←</button>
        <strong className="ks-title">{name || "Audio Studio"}</strong>
        <div className="ks-seg" role="group" aria-label="របៀប">
          <button className={!pro ? "on" : ""} onClick={() => setPro(false)}>Quick</button>
          <button className={pro ? "on" : ""} onClick={() => setPro(true)}>Pro</button>
        </div>
        <button className="ks-btn" onClick={undo} disabled={!past.current.length} aria-label="Undo">↶</button>
        <button className="ks-btn" onClick={redo} disabled={!future.current.length} aria-label="Redo">↷</button>
      </header>

      <div className="ks-grid">
        <aside className="ks-panel ks-lib">
          <h3>ឯកសារសំឡេង</h3>
          <input ref={fileRef} type="file" accept="audio/*" hidden onChange={(e) => { openFile(e.target.files?.[0]); e.target.value = ""; }} />
          <button className="ks-btn ks-wide" onClick={() => fileRef.current?.click()} disabled={busy}>＋ បើកឯកសារ</button>
          <button className={"ks-btn ks-wide" + (recording ? " ks-rec" : "")} onClick={() => void toggleRec()} disabled={busy && !recording}>
            {recording ? "⏹ បញ្ឈប់ថត" : "⏺ ថតសំឡេង"}
          </button>

          <h4>បណ្ណាល័យ</h4>
          {soundsErr && <p className="ks-warn">{soundsErr}</p>}
          {!soundsErr && !sounds.length && <p className="ks-dim">មិនទាន់មានសំឡេង</p>}
          <ul>
            {sounds.map((s) => (
              <li key={s.id}><button onClick={() => void pickSound(s)} disabled={busy}>{s.name}</button></li>
            ))}
          </ul>

          <h4>សំឡេង AI</h4>
          <div className="ks-row">
            <input value={sfxType} onChange={(e) => setSfxType(e.target.value)} placeholder="siren…" aria-label="SFX type" />
            <button className="ks-btn" onClick={() => void genSfx()} disabled={busy || !sfxType.trim()}>SFX</button>
          </div>
          <div className="ks-chips">
            {PRESETS.map((p) => (
              <button key={p} className="ks-chip" onClick={() => void applyVoice(p)} disabled={!has || busy}>{p}</button>
            ))}
          </div>
          <div className="ks-row">
            <input value={ttsText} onChange={(e) => setTtsText(e.target.value)} placeholder="អត្ថបទ…" aria-label="Text to speech" />
            <button className="ks-btn" onClick={() => void tts()} disabled={busy || !ttsText.trim()}>TTS</button>
          </div>
        </aside>

        <section className="ks-panel ks-preview">
          <Bars analyser={() => chainRef.current?.analyser ?? null} active={playing} />
          <div className="ks-time">{fmt(head * dur)} <span>/ {fmt(dur)}</span></div>
          <div className="ks-transport">
            <button className="ks-btn" onClick={stop} disabled={!has} aria-label="Stop">■</button>
            <button className="ks-btn ks-play" onClick={() => (playing ? pause() : void play())} disabled={!has} aria-label="Play/Pause">{playing ? "❚❚" : "▶"}</button>
            <button
              className={"ks-btn" + (loop ? " on" : "")}
              onClick={() => { const v = !loop; loopRef.current = v; setLoop(v); if (srcRef.current) void play(); }}
              disabled={!has} aria-label="Loop"
            >⟲</button>
          </div>
          {!has && <p className="ks-dim">បើកឯកសារ ថត ឬជ្រើសពីបណ្ណាល័យ ដើម្បីចាប់ផ្តើម</p>}
          {msg && <p className="ks-msg" role="status">{msg}</p>}
        </section>

        <aside className="ks-panel ks-fx">
          <h3>កែសំឡេង</h3>
          <Slider label="Volume" min={0} max={2} step={0.05} value={fx.vol} onChange={(v) => setLive({ vol: v })} onCommit={commit} />
          <Slider label="Bass" min={-18} max={18} step={1} value={fx.bass} unit=" dB" onChange={(v) => setLive({ bass: v })} onCommit={commit} />
          <Slider label="Speed" min={0.5} max={2} step={0.05} value={fx.speed} unit="×" onChange={(v) => setLive({ speed: v })} onCommit={commit} />
          {pro && (
            <>
              <Slider label="Mid" min={-18} max={18} step={1} value={fx.mid} unit=" dB" onChange={(v) => setLive({ mid: v })} onCommit={commit} />
              <Slider label="Treble" min={-18} max={18} step={1} value={fx.treble} unit=" dB" onChange={(v) => setLive({ treble: v })} onCommit={commit} />
              <label className="ks-check">
                <input type="checkbox" checked={fx.comp} onChange={(e) => { setLive({ comp: e.target.checked }); commit(); }} />
                Compressor
              </label>
            </>
          )}
          <button className="ks-btn ks-wide" onClick={reset}>កំណត់ឡើងវិញ</button>
          <h3>នាំចេញ</h3>
          <p className="ks-dim">{sel ? "នាំចេញតែផ្នែកដែលបានជ្រើស" : "នាំចេញទាំងមូល"} · WAV</p>
          <button className="ks-btn ks-wide ks-primary" onClick={() => void doExport(false)} disabled={!has || busy}>⬇ ទាញយក</button>
          <button className="ks-btn ks-wide" onClick={() => void doExport(true)} disabled={!has || busy}>☁ រក្សាទុកក្នុង IQ-AI</button>
        </aside>
      </div>

      <footer className="ks-timeline">
        <div className="ks-ruler">{ticks.map((t) => <span key={t}>{fmt(t * dur)}</span>)}</div>
        <div className="ks-lane">
          <span className="ks-lane-label">Audio</span>
          <div className="ks-lane-wave">
            {has ? (
              <Wave peaks={peaks} head={head} sel={sel} height={72} onSeek={seek} onSelect={(s) => { setSel(s && s.b - s.a > 0.002 ? s : null); }} />
            ) : (
              <div className="ks-empty">គ្មានសំឡេង</div>
            )}
          </div>
        </div>
        <p className="ks-dim">ប៉ះដើម្បីរំលង · អូសដើម្បីជ្រើសផ្នែក{sel ? " · " + fmt(sel.a * dur) + " – " + fmt(sel.b * dur) : ""}</p>
      </footer>
    </div>
  );
}

/* ---------- video ---------- */
function VideoView({ onBack }: { onBack: () => void }) {
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<[string, string][]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const pick = async (f?: File) => {
    if (!f) return;
    setUrl(URL.createObjectURL(f));
    setInfo([]);
    setMsg("");
    setBusy(true);
    try {
      const j = await (await api("/videos/inspect", { method: "POST", body: f })).json();
      const d = (j?.data ?? j ?? {}) as Record<string, unknown>;
      setInfo(Object.entries(d).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v)] as [string, string]));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ks-editor">
      <header className="ks-top">
        <button className="ks-btn" onClick={onBack} aria-label="ត្រឡប់ក្រោយ">←</button>
        <strong className="ks-title">Video</strong>
      </header>
      <div className="ks-grid">
        <aside className="ks-panel ks-lib">
          <h3>ឯកសារវីដេអូ</h3>
          <input ref={fileRef} type="file" accept="video/mp4,video/webm" hidden onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
          <button className="ks-btn ks-wide" onClick={() => fileRef.current?.click()} disabled={busy}>＋ បើកវីដេអូ</button>
          <h4>ព័ត៌មាន</h4>
          {busy && <p className="ks-dim">កំពុងពិនិត្យ…</p>}
          {!busy && !info.length && <p className="ks-dim">គ្មានព័ត៌មាន</p>}
          <dl className="ks-info">
            {info.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
          </dl>
        </aside>
        <section className="ks-panel ks-preview">
          {url ? <video src={url} controls className="ks-video" /> : <p className="ks-dim">បើកវីដេអូ mp4 ឬ webm ដើម្បីមើលជាមុន</p>}
          {msg && <p className="ks-warn" role="status">{msg}</p>}
        </section>
        <aside className="ks-panel ks-fx">
          <h3>កាត់ត / នាំចេញ</h3>
          <p className="ks-dim">មិនទាន់ភ្ជាប់ (ត្រូវការ ffmpeg នៅ server)។ ឥឡូវនេះអាចមើលជាមុន និងពិនិត្យព័ត៌មានវីដេអូបាន។</p>
        </aside>
      </div>
    </div>
  );
}

/* ---------- shell ---------- */
type View = "home" | "audio" | "video" | "library";
const AUDIO_WORDS = /សំឡេង|ភ្លេង|ថត|audio|sound|music|bass|volume|mp3|wav|voice|tts|sfx/i;
const VIDEO_WORDS = /វីដេអូ|video|mp4|webm/i;
const LIB_WORDS = /បណ្ណាល័យ|library/i;

export default function KhoemStudio({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<View>("home");
  const [prompt, setPrompt] = useState("");
  const [note, setNote] = useState("");

  const submit = () => {
    const t = prompt.trim();
    if (!t) return;
    setNote("");
    if (LIB_WORDS.test(t)) setView("library");
    else if (VIDEO_WORDS.test(t)) setView("video");
    else if (AUDIO_WORDS.test(t)) setView("audio");
    else setNote("សូមជ្រើសកាតខាងក្រោម។ ការបង្កើតរូបភាព/វីដេអូដោយ AI មិនទាន់ភ្ជាប់ provider ទេ។");
  };

  const cards: { icon: string; title: string; sub: string; go: () => void }[] = [
    { icon: "🎚", title: "កែសំឡេង", sub: "Voice · Music · Effects", go: () => setView("audio") },
    { icon: "✨", title: "សំឡេង AI", sub: "SFX · Voice · Text-to-Speech", go: () => setView("audio") },
    { icon: "🎬", title: "វីដេអូ", sub: "Preview · Info", go: () => setView("video") },
    { icon: "📚", title: "បណ្ណាល័យសំឡេង", sub: "Library", go: () => setView("library") },
  ];
  const nav: { v: View; icon: string; label: string }[] = [
    { v: "home", icon: "🏠", label: "Home" },
    { v: "audio", icon: "🎚", label: "Audio" },
    { v: "video", icon: "🎬", label: "Video" },
    { v: "library", icon: "📚", label: "Library" },
  ];

  return (
    <div className="ks-root" role="dialog" aria-label="KHOEM-AI Creative Studio">
      <nav className="ks-side">
        <img src={khoemLogo} alt="KHOEM-AI" className="ks-logo" />
        {nav.map((n) => (
          <button key={n.v} className={view === n.v ? "on" : ""} onClick={() => setView(n.v)}>
            <span>{n.icon}</span><em>{n.label}</em>
          </button>
        ))}
        <button className="ks-close" onClick={onClose}><span>✕</span><em>បិទ</em></button>
      </nav>

      <main className="ks-main">
        {view === "home" && (
          <div className="ks-home">
            <h1>KHOEM-AI <small>Creative Studio</small></h1>
            <h2>តើបងចង់បង្កើតអ្វីថ្ងៃនេះ?</h2>
            <div className="ks-prompt">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                placeholder="ប្រាប់អ្វីដែលចង់បាន…"
              />
              <button className="ks-btn ks-primary" onClick={submit}>ចាប់ផ្តើម</button>
            </div>
            {note && <p className="ks-msg" role="status">{note}</p>}
            <div className="ks-cards">
              {cards.map((c) => (
                <button key={c.title} className="ks-card" onClick={c.go}>
                  <span className="ks-card-icon">{c.icon}</span>
                  <strong>{c.title}</strong>
                  <small>{c.sub}</small>
                </button>
              ))}
            </div>
          </div>
        )}
        <AudioEditor active={view === "audio"} onBack={() => setView("home")} />
        {view === "video" && <VideoView onBack={() => setView("home")} />}
        {view === "library" && (
          <div className="ks-editor">
            <header className="ks-top">
              <button className="ks-btn" onClick={() => setView("home")} aria-label="ត្រឡប់ក្រោយ">←</button>
              <strong className="ks-title">បណ្ណាល័យសំឡេង</strong>
            </header>
            <div className="ks-libpage"><SoundLibrary /></div>
          </div>
        )}
      </main>
    </div>
  );
}
