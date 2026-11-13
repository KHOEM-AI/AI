import { useEffect, useRef, useState } from "react";
import MenuGlyph from "./MenuGlyph";
import {
  iqaiInspectAudio,
  iqaiInspectImage,
  iqaiInspectVideo,
} from "../api/client";
import SoundLibrary from "./SoundLibrary";

// Edit an existing video (trim, resize, speed, mute, thumbnail, extract audio).
// Uses the same IQ-AI / ffmpeg endpoints as the old Video tab in AvStudio.

const MAX_EDIT_BYTES = 50 * 1024 * 1024; // IQ-AI limit

const input: React.CSSProperties = { borderRadius: 8, padding: 8, fontSize: 15, marginRight: 6, marginBottom: 6 };
const btn: React.CSSProperties = { padding: "8px 14px", borderRadius: 8, border: "none", background: "#4f7cff", color: "#fff", fontSize: 15, marginRight: 8, marginTop: 4 };
const link: React.CSSProperties = { ...btn, textDecoration: "none", display: "inline-block" };

const errText = (e: unknown): string => (e instanceof Error ? e.message : String(e));

async function api(path: string, init?: RequestInit): Promise<Response> {
  const r = await fetch(`/iqai${path}`, init);
  if (!r.ok) {
    const j = await r.json().catch(() => null);
    const e = j?.error;
    throw new Error((typeof e === "string" ? e : e?.message ?? e?.code) ?? `HTTP ${r.status}`);
  }
  return r;
}

export default function VideoEditPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [srcUrl, setSrcUrl] = useState("");
  const [info, setInfo] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [width, setWidth] = useState("");
  const [speed, setSpeed] = useState(1);
  const [mute, setMute] = useState(false);
  const [outUrl, setOutUrl] = useState("");
  const [outInfo, setOutInfo] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioExt, setAudioExt] = useState("wav");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [inspectInfo, setInspectInfo] = useState("");
  const [inspectBusy, setInspectBusy] = useState(false);
  const [inspectErr, setInspectErr] = useState("");
  const vref = useRef<HTMLVideoElement | null>(null);
  const urls = useRef<string[]>([]);

  const track = (blob: Blob): string => {
    const u = URL.createObjectURL(blob);
    urls.current.push(u);
    return u;
  };
  useEffect(() => () => { urls.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const run = async (fn: () => Promise<void>): Promise<void> => {
    setErr("");
    setBusy(true);
    try { await fn(); } catch (e) { setErr(errText(e)); }
    setBusy(false);
  };

  const runFileInfo = async (f?: File) => {
    if (!f) return;

    setInspectBusy(true);
    setInspectErr("");
    setInspectInfo("");

    try {
      let result: unknown;

      if (f.type.startsWith("audio/")) {
        result = await iqaiInspectAudio(f);
      } else if (f.type.startsWith("image/")) {
        result = await iqaiInspectImage(f);
      } else if (f.type.startsWith("video/")) {
        result = await iqaiInspectVideo(f);
      } else {
        throw new Error("ប្រភេទឯកសារមិនគាំទ្រ · ត្រូវការ Audio, Image ឬ Video");
      }

      setInspectInfo(JSON.stringify(result, null, 2));
    } catch (e) {
      setInspectErr(errText(e));
    } finally {
      setInspectBusy(false);
    }
  };

  const pick = (f?: File) => {
    if (!f) return;
    setFile(f);
    setOutUrl(""); setThumbUrl(""); setAudioUrl(""); setOutInfo(""); setInfo("");
    setSrcUrl(track(f));
    void run(async () => {
      const j = await (await api("/videos/inspect", { method: "POST", body: f })).json();
      setInfo(JSON.stringify(j.data));
    });
  };

  const need = (): File => {
    if (!file) throw new Error("ជ្រើសវីដេអូមុន · Pick a video first");
    if (file.size > MAX_EDIT_BYTES) throw new Error("វីដេអូធំជាង 50 MB · Video is larger than 50 MB");
    return file;
  };

  const edit = () => void run(async () => {
    const f = need();
    const qs = new URLSearchParams();
    if (start.trim()) qs.set("trimStart", start.trim());
    if (end.trim()) qs.set("trimEnd", end.trim());
    if (width.trim()) qs.set("width", width.trim());
    if (speed !== 1) qs.set("speed", String(speed));
    if (mute) qs.set("mute", "true");
    const r = await api(`/videos/edit?${qs}`, { method: "POST", body: f });
    setOutInfo(r.headers.get("X-Applied") ?? "");
    setOutUrl(track(await r.blob()));
  });

  const thumb = () => void run(async () => {
    const f = need();
    const at = (vref.current?.currentTime ?? 0).toFixed(2);
    const r = await api(`/videos/thumbnail?at=${at}&width=480`, { method: "POST", body: f });
    setThumbUrl(track(await r.blob()));
  });

  const extract = () => void run(async () => {
    const f = need();
    const r = await api("/videos/audio", { method: "POST", body: f });
    const blob = await r.blob();
    setAudioExt(/mpeg|mp3/i.test(blob.type) ? "mp3" : "wav");
    setAudioUrl(track(blob));
  });

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>
        កាត់ត/Export វីដេអូដែលមានស្រាប់ (ffmpeg មិនមែន AI model) · ≤ 50 MB
      </div>
      <input style={input} type="file" accept="video/mp4,video/webm" onChange={(e) => pick(e.target.files?.[0])} />
      {srcUrl && <video ref={vref} src={srcUrl} controls style={{ width: "100%", borderRadius: 8, marginBottom: 6 }} />}
      {info && <div style={{ fontSize: 13, opacity: 0.8 }}>{info}</div>}

      {file && (
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}><span className="ks-inline-icon"><MenuGlyph name="scissors" /></span> កែវីដេអូ · Edit video</div>
          <input style={{ ...input, width: 110 }} type="number" min={0} step={0.1} value={start}
            onChange={(e) => setStart(e.target.value)} placeholder="ចាប់ផ្ដើម s" />
          <input style={{ ...input, width: 110 }} type="number" min={0} step={0.1} value={end}
            onChange={(e) => setEnd(e.target.value)} placeholder="ចប់ s" />
          <input style={{ ...input, width: 110 }} type="number" min={160} max={1920} step={2} value={width}
            onChange={(e) => setWidth(e.target.value)} placeholder="ទទឹង px" />
          <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>
            ល្បឿន · Speed: {speed}×
            <input type="range" min={0.5} max={2} step={0.1} value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))} style={{ width: "100%" }} />
          </label>
          <label style={{ display: "block", fontSize: 14, marginBottom: 8 }}>
            <input type="checkbox" checked={mute} onChange={(e) => setMute(e.target.checked)} /> 🔇 បិទសំឡេង · Mute
          </label>
          <button style={btn} onClick={edit} disabled={busy}>✂ កែ → MP4</button>
          <button style={btn} onClick={thumb} disabled={busy}>🖼 Thumbnail (frame បច្ចុប្បន្ន)</button>
          <button style={btn} onClick={extract} disabled={busy}>🔊 ទាញសំឡេង</button>
        </div>
      )}

      <section style={{ marginTop: 18, padding: 12, border: "1px solid #8885", borderRadius: 10 }}>
        <div style={{ marginBottom: 8, fontWeight: 600 }}>
          📄 ព័ត៌មានឯកសារ · File info
        </div>
        <input
          style={input}
          type="file"
          accept="audio/*,image/*,video/*"
          disabled={inspectBusy}
          onChange={(e) => void runFileInfo(e.target.files?.[0])}
        />
        {inspectBusy && <div style={{ fontSize: 13 }}>កំពុងពិនិត្យឯកសារ…</div>}
        {inspectErr && <div style={{ color: "#ff8a8a" }}>{inspectErr}</div>}
        {inspectInfo && (
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12 }}>
            {inspectInfo}
          </pre>
        )}
      </section>

      <section style={{ marginTop: 18 }}>
        <div style={{ marginBottom: 8, fontWeight: 600 }}>
          🎵 បណ្ណាល័យសំឡេង · Sound Library
        </div>
        <SoundLibrary />
      </section>

      {busy && <div style={{ fontSize: 13, opacity: 0.8 }}>កំពុងដំណើរការ… · Working…</div>}
      {err && <div style={{ color: "#ff8a8a" }}>{err}</div>}
      {outUrl && <video src={outUrl} controls style={{ width: "100%", borderRadius: 8, margin: "6px 0" }} />}
      {outUrl && <a href={outUrl} download="khoem-edit.mp4" style={link}>⬇ Download MP4</a>}
      {outInfo && <div style={{ fontSize: 13, opacity: 0.8 }}>{outInfo}</div>}
      {thumbUrl && <img src={thumbUrl} alt="thumbnail" style={{ width: "100%", borderRadius: 8, margin: "6px 0" }} />}
      {thumbUrl && <a href={thumbUrl} download="khoem-thumb.jpg" style={link}>⬇ Download JPG</a>}
      {audioUrl && <audio src={audioUrl} controls style={{ width: "100%", margin: "6px 0" }} />}
      {audioUrl && <a href={audioUrl} download={"khoem-audio." + audioExt} style={link}>⬇ Download Audio</a>}
    </div>
  );
}
