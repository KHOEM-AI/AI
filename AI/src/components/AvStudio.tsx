import { useCallback, useEffect, useRef, useState } from "react";
import SoundLibrary from "./SoundLibrary";

// KHOEM AI Audio · Video · Creative Studio. Calls IQ-AI via the Vite proxy (/iqai).
type Tab = "audio" | "video" | "library" | "ai";
interface Item { id: string; name: string }
const S0 = { vol: 1, bass: 0, mid: 0, treble: 0, speed: 1, a: 0, b: 1 };
type S = typeof S0;
const PRESETS = ["ghost", "demon", "alien", "underwater", "male", "female"];

async function api(path: string, init?: RequestInit) {
  const r = await fetch(`/iqai${path}`, init);
  if (!r.ok) {
    const j = await r.json().catch(() => null);
    const e = j?.error;
    throw new Error((typeof e === "string" ? e : e?.message ?? e?.code) ?? `HTTP ${r.status}`);
  }
  return r;
}

function chain(ctx: BaseAudioContext, s: S) {
  const gain = ctx.createGain(); gain.gain.value = s.vol;
  const bass = ctx.createBiquadFilter(); bass.type = "lowshelf"; bass.frequency.value = 120; bass.gain.value = s.bass;
  const mid = ctx.createBiquadFilter(); mid.type = "peaking"; mid.frequency.value = 1000; mid.Q.value = 1; mid.gain.value = s.mid;
  const treble = ctx.createBiquadFilter(); treble.type = "highshelf"; treble.frequency.value = 6000; treble.gain.value = s.treble;
  gain.connect(bass); bass.connect(mid); mid.connect(treble);
  return { gain, bass, mid, treble };
}

function encodeWav(buf: AudioBuffer): ArrayBuffer {
  const ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
  const out = new ArrayBuffer(44 + len * ch * 2);
  const v = new DataView(out);
  const w = (o: number, t: string) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  w(0, "RIFF"); v.setUint32(4, 36 + len * ch * 2, true); w(8, "WAVE"); w(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true);
  v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, len * ch * 2, true);
  const d = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) {
    const x = Math.max(-1, Math.min(1, d[c][i]));
    v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true); o += 2;
  }
  return out;
}

async function renderWav(b: AudioBuffer, st: S): Promise<ArrayBuffer> {
  const secs = ((st.b - st.a) * b.duration) / st.speed;
  const oc = new OfflineAudioContext(b.numberOfChannels, Math.max(1, Math.ceil(secs * b.sampleRate)), b.sampleRate);
  const n = chain(oc, st); n.treble.connect(oc.destination);
  const src = oc.createBufferSource(); src.buffer = b; src.playbackRate.value = st.speed; src.connect(n.gain);
  src.start(0, st.a * b.duration, (st.b - st.a) * b.duration);
  return encodeWav(await oc.startRendering());
}

function peaksOf(b: AudioBuffer, w = 600) {
  const d = b.getChannelData(0), step = Math.floor(d.length / w) || 1, out = new Float32Array(w);
  for (let i = 0; i < w; i++) {
    let m = 0;
    for (let j = i * step; j < (i + 1) * step && j < d.length; j += Math.max(1, step >> 6)) m = Math.max(m, Math.abs(d[j]));
    out[i] = m;
  }
  return out;
}

const box: React.CSSProperties = { background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 12, marginBottom: 12 };
const btn: React.CSSProperties = { padding: "8px 14px", borderRadius: 8, border: "none", background: "#4f7cff", color: "#fff", marginRight: 6, marginBottom: 6, fontSize: 15 };
const inp: React.CSSProperties = { borderRadius: 8, padding: 8, fontSize: 15, marginRight: 6, marginBottom: 6 };

function Slider(p: { label: string; min: number; max: number; step: number; value: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>
      {p.label}: {p.value}{p.unit ?? ""}
      <input type="range" min={p.min} max={p.max} step={p.step} value={p.value}
        onChange={(e) => p.onChange(Number(e.target.value))} style={{ width: "100%" }} />
    </label>
  );
}

export default function AvStudio({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("audio");
  const [s, setS] = useState<S>(S0);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loop, setLoop] = useState(false);
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [sfxType, setSfxType] = useState("siren");
  const [ttsText, setTtsText] = useState("");
  const [vurl, setVurl] = useState("");
  const [vinfo, setVinfo] = useState("");

  const ctxRef = useRef<AudioContext | null>(null);
  const bufRef = useRef<AudioBuffer | null>(null);
  const peaks = useRef<Float32Array | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const nodes = useRef<(ReturnType<typeof chain> & { an: AnalyserNode }) | null>(null);
  const t0 = useRef({ t: 0, off: 0, rate: 1 });
  const posRef = useRef(0);
  const sRef = useRef<S>(S0);
  const loopRef = useRef(false);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const level = useRef<HTMLDivElement | null>(null);
  const mr = useRef<MediaRecorder | null>(null);

  const ac = () => (ctxRef.current ||= new AudioContext());
  const run = async (fn: () => Promise<void>) => {
    try { setMsg(""); await fn(); } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
  };
  const pos = () => {
    const c = ctxRef.current;
    if (!srcRef.current || !c) return posRef.current;
    const raw = t0.current.off + (c.currentTime - t0.current.t) * t0.current.rate;
    const bb = bufRef.current;
    if (srcRef.current.loop && bb) {
      const a = sRef.current.a * bb.duration, e = sRef.current.b * bb.duration;
      if (raw >= e && e > a) return a + ((raw - a) % (e - a));
    }
    return raw;
  };
  const stopSrc = () => {
    const x = srcRef.current; srcRef.current = null;
    try { x?.stop(); } catch { /* already stopped */ }
    x?.disconnect();
  };

  const setAudio = (b: AudioBuffer) => {
    stopSrc(); setPlaying(false);
    bufRef.current = b; peaks.current = peaksOf(b); posRef.current = 0;
    setS((x) => ({ ...x, a: 0, b: 1 })); setBuffer(b);
  };
  const decode = async (ab: ArrayBuffer) => setAudio(await ac().decodeAudioData(ab));

  const play = async () => {
    const b = bufRef.current; if (!b) return;
    const ctx = ac(); await ctx.resume(); stopSrc();
    const cur = sRef.current;
    const n = chain(ctx, cur);
    const an = ctx.createAnalyser(); an.fftSize = 1024;
    n.treble.connect(an); an.connect(ctx.destination);
    const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = cur.speed; src.connect(n.gain);
    const end = cur.b * b.duration;
    let off = posRef.current;
    if (off < cur.a * b.duration || off >= end) off = cur.a * b.duration;
    if (loopRef.current) {
      src.loop = true; src.loopStart = cur.a * b.duration; src.loopEnd = end;
      src.start(0, off);
    } else src.start(0, off, end - off);
    src.onended = () => {
      if (srcRef.current !== src) return;
      stopSrc(); posRef.current = sRef.current.a * b.duration; setPlaying(false);
    };
    srcRef.current = src; nodes.current = { ...n, an };
    t0.current = { t: ctx.currentTime, off, rate: cur.speed };
    setPlaying(true);
  };
  const pause = () => { posRef.current = pos(); stopSrc(); setPlaying(false); };
  const stop = () => { stopSrc(); posRef.current = sRef.current.a * (bufRef.current?.duration ?? 0); setPlaying(false); };
  const toggleLoop = () => {
    const v = !loopRef.current; loopRef.current = v; setLoop(v);
    if (srcRef.current) { posRef.current = pos(); void play(); }
  };

  // sliders drive the live audio graph
  useEffect(() => {
    const ctx = ctxRef.current, n = nodes.current;
    if (srcRef.current && ctx) {
      t0.current = { t: ctx.currentTime, off: pos(), rate: s.speed };
      srcRef.current.playbackRate.value = s.speed;
    }
    sRef.current = s;
    const ls = srcRef.current, lb = bufRef.current;
    if (ls && ls.loop && lb) { ls.loopStart = s.a * lb.duration; ls.loopEnd = s.b * lb.duration; }
    if (n) { n.gain.gain.value = s.vol; n.bass.gain.value = s.bass; n.mid.gain.value = s.mid; n.treble.gain.value = s.treble; }
  }, [s]);

  const draw = useCallback(() => {
    const c = canvas.current, b = bufRef.current, p = peaks.current;
    if (!c) return;
    const g = c.getContext("2d"); if (!g) return;
    g.clearRect(0, 0, c.width, c.height);
    if (!b || !p) return;
    const h = c.height, st = sRef.current;
    g.fillStyle = "#4f7cff";
    for (let i = 0; i < p.length; i++) {
      const x = (i / p.length) * c.width, bh = Math.max(1, p[i] * h);
      g.fillRect(x, (h - bh) / 2, Math.max(1, c.width / p.length - 0.5), bh);
    }
    g.fillStyle = "rgba(0,0,0,0.55)";
    g.fillRect(0, 0, st.a * c.width, h); g.fillRect(st.b * c.width, 0, c.width, h);
    g.fillStyle = "#ffd24f";
    g.fillRect((pos() / b.duration) * c.width, 0, 2, h);
    const an = nodes.current?.an;
    if (an && level.current) {
      const d = new Uint8Array(an.fftSize); an.getByteTimeDomainData(d);
      let sum = 0; for (const v of d) sum += ((v - 128) / 128) ** 2;
      level.current.style.width = `${Math.min(100, Math.sqrt(sum / d.length) * 250)}%`;
    }
  }, []);
  useEffect(() => {
    let id = 0;
    const loop = () => { draw(); id = requestAnimationFrame(loop); };
    if (playing) loop(); else draw();
    return () => cancelAnimationFrame(id);
  }, [playing, buffer, s.a, s.b, tab, draw]);

  useEffect(() => {
    api("/sounds?limit=200").then((r) => r.json()).then((j) => setItems(j.items as Item[])).catch(() => {});
    return () => { stopSrc(); void ctxRef.current?.close(); };
  }, []);
  useEffect(() => () => { if (vurl) URL.revokeObjectURL(vurl); }, [vurl]);

  const seek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const b = bufRef.current; if (!b) return;
    const r = e.currentTarget.getBoundingClientRect();
    posRef.current = ((e.clientX - r.left) / r.width) * b.duration;
    if (playing) void play(); else draw();
  };
  const upd = (k: keyof S) => (v: number) => setS((x) => ({ ...x, [k]: v }));

  const download = (ab: ArrayBuffer, name: string) => {
    const u = URL.createObjectURL(new Blob([ab], { type: "audio/wav" }));
    const a = document.createElement("a"); a.href = u; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(u), 5000);
  };
  const toggleRec = () => run(async () => {
    if (recording) { mr.current?.stop(); return; }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream), chunks: Blob[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop()); setRecording(false);
      void run(async () => decode(await new Blob(chunks).arrayBuffer()));
    };
    rec.start(); mr.current = rec; setRecording(true);
  });
  const pickLib = (id: string) => run(async () => {
    if (!id) return;
    decode(await (await api(`/sounds/${encodeURIComponent(id)}/content`)).arrayBuffer());
  });
  const pickFile = (f?: File) => f && run(async () => decode(await f.arrayBuffer()));

  const genSfx = () => run(async () => {
    const r = await api("/audio/sfx", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: sfxType, durationSec: 3 }) });
    await decode(await r.arrayBuffer());
  });
  const applyVoice = (preset: string) => run(async () => {
    const b = bufRef.current; if (!b) throw new Error("ជ្រើសសំឡេងក្នុង Audio Studio មុន");
    const r = await api(`/audio/voice?preset=${preset}`, { method: "POST", body: await renderWav(b, S0) });
    await decode(await r.arrayBuffer());
  });
  const tts = () => run(async () => {
    const r = await fetch("/iqai/audio/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: ttsText }) });
    if (r.status === 501) throw new Error("Not Configured · មិនទាន់ភ្ជាប់ TTS provider");
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    await decode(await r.arrayBuffer());
  });
  const pickVideo = (f?: File) => f && run(async () => {
    setVurl(URL.createObjectURL(f)); setVinfo("");
    const j = await (await api("/videos/inspect", { method: "POST", body: f })).json();
    setVinfo(JSON.stringify(j.data));
  });

  const tabs: [Tab, string][] = [["audio", "🎧 Audio"], ["video", "🎬 Video"], ["library", "📚 Library"], ["ai", "✨ AI"]];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "#0b0b10", color: "#fff", overflowY: "auto", padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <b>KHOEM AI · Audio · Video · Creative Studio</b>
        <button style={{ ...btn, background: "#444" }} onClick={onClose}>✕</button>
      </div>
      <div>{tabs.map(([k, l]) => (
        <button key={k} style={{ ...btn, background: tab === k ? "#4f7cff" : "#2a2a35" }} onClick={() => setTab(k)}>{l}</button>
      ))}</div>
      {msg && <div style={{ color: "#ff8a8a", marginBottom: 8 }}>⚠️ {msg}</div>}

      {tab === "audio" && (
        <div style={box}>
          <select style={inp} defaultValue="" onChange={(e) => void pickLib(e.target.value)}>
            <option value="">បណ្ណាល័យ · Library…</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <input style={inp} type="file" accept="audio/*" onChange={(e) => pickFile(e.target.files?.[0])} />
          <button style={{ ...btn, background: recording ? "#d33" : "#4f7cff" }} onClick={toggleRec}>{recording ? "⏹ បញ្ឈប់ថត" : "⏺ ថត · Record"}</button>
          <canvas ref={canvas} width={600} height={120} onClick={seek}
            style={{ width: "100%", height: 120, background: "#000", borderRadius: 8, display: "block", marginBottom: 6 }} />
          <div style={{ height: 6, background: "#222", borderRadius: 3, marginBottom: 8 }}>
            <div ref={level} style={{ height: 6, width: "0%", background: "#4fff9d", borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>
            {buffer ? `${buffer.duration.toFixed(2)} s · ${buffer.sampleRate} Hz · ${buffer.numberOfChannels} ch` : "មិនទាន់មានសំឡេង · No audio loaded"}
          </div>
          <button style={btn} onClick={() => void play()} disabled={!buffer}>▶ Play</button>
          <button style={btn} onClick={pause} disabled={!playing}>⏸ Pause</button>
          <button style={btn} onClick={stop} disabled={!buffer}>⏹ Stop</button>
          <button style={{ ...btn, background: loop ? "#2a9d5c" : "#2a2a35" }} onClick={toggleLoop} disabled={!buffer}>🔁 Loop{loop ? " ON" : ""}</button>
          <Slider label="Volume" min={0} max={2} step={0.05} value={s.vol} onChange={upd("vol")} />
          <Slider label="Bass" min={-18} max={18} step={1} value={s.bass} unit=" dB" onChange={upd("bass")} />
          <Slider label="Mid" min={-18} max={18} step={1} value={s.mid} unit=" dB" onChange={upd("mid")} />
          <Slider label="Treble" min={-18} max={18} step={1} value={s.treble} unit=" dB" onChange={upd("treble")} />
          <Slider label="Speed" min={0.5} max={2} step={0.05} value={s.speed} unit="×" onChange={upd("speed")} />
          <Slider label="កាត់ចាប់ផ្ដើម · Trim start" min={0} max={0.99} step={0.01} value={s.a} onChange={(v) => setS((x) => ({ ...x, a: Math.min(v, x.b - 0.01) }))} />
          <Slider label="កាត់ចុង · Trim end" min={0.01} max={1} step={0.01} value={s.b} onChange={(v) => setS((x) => ({ ...x, b: Math.max(v, x.a + 0.01) }))} />
          <button style={btn} disabled={!buffer} onClick={() => run(async () => { if (buffer) download(await renderWav(buffer, s), "khoem-audio.wav"); })}>⬇ Export WAV</button>
        </div>
      )}

      {tab === "video" && (
        <div style={box}>
          <input style={inp} type="file" accept="video/mp4,video/webm" onChange={(e) => pickVideo(e.target.files?.[0])} />
          {vurl && <video src={vurl} controls style={{ width: "100%", borderRadius: 8, marginBottom: 6 }} />}
          {vinfo && <div style={{ fontSize: 13, opacity: 0.8 }}>{vinfo}</div>}
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
            កាត់ត/Export វីដេអូ៖ Not Configured · មិនទាន់ភ្ជាប់ (ត្រូវការ ffmpeg នៅ server)។ ឥឡូវមើលជាមុន និងពិនិត្យព័ត៌មានបាន។
          </div>
        </div>
      )}

      {tab === "library" && <SoundLibrary />}

      {tab === "ai" && (
        <div style={box}>
          <div style={{ marginBottom: 6 }}>🔔 បង្កើតសំឡេងបែបផែន · SFX</div>
          <input style={inp} value={sfxType} onChange={(e) => setSfxType(e.target.value)} placeholder="type (siren…)" />
          <button style={btn} onClick={genSfx}>បង្កើត · Generate</button>
          <div style={{ margin: "10px 0 6px" }}>🗣 ប្តូរសំឡេង · Voice (ប្រើសំឡេងក្នុង Audio Studio)</div>
          {PRESETS.map((p) => <button key={p} style={btn} onClick={() => void applyVoice(p)}>{p}</button>)}
          <div style={{ margin: "10px 0 6px" }}>📝 អត្ថបទទៅសំឡេង · Text-to-Speech</div>
          <input style={{ ...inp, width: "70%" }} value={ttsText} onChange={(e) => setTtsText(e.target.value)} placeholder="អត្ថបទ…" />
          <button style={btn} onClick={tts} disabled={!ttsText.trim()}>បង្កើត</button>
          <div style={{ fontSize: 13, opacity: 0.7 }}>លទ្ធផលទាំងអស់ត្រូវបានផ្ទុកចូល Audio Studio។ រូបភាព/វីដេអូ AI៖ Not Configured។</div>
        </div>
      )}
    </div>
  );
}
