import { useEffect, useRef, useState } from "react";
import MenuGlyph from "./MenuGlyph";
import SlideshowTab from "./SlideshowTab";
import StoryTab from "./StoryTab";
import VideoEditPanel from "./VideoEditPanel";
import AiAutoCreatePanel from "./AiAutoCreatePanel";
import { iqaiPhotoVideo, iqaiTextVideo, iqaiVideoOptions, uploadMedia } from "../api/client";

// Create video from text or from a photo (IQ-AI, ffmpeg, offline) and
// send the result to the library (MediaLibrary) for storage and sharing.

const box: React.CSSProperties = { background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 12, marginBottom: 12 };
const input: React.CSSProperties = { borderRadius: 8, padding: 8, fontSize: 15, marginRight: 6, marginBottom: 6 };
const btn: React.CSSProperties = { padding: "8px 14px", borderRadius: 8, border: "none", background: "#4f7cff", color: "#fff", fontSize: 15, marginRight: 8, marginTop: 4 };
const soft: React.CSSProperties = { ...btn, background: "rgba(255,255,255,0.14)" };

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function CreatePanel({ initialText = "" }: { initialText?: string }) {
  const [mode, setMode] = useState<"text" | "photo" | "slideshow" | "edit" | "auto" | "story">("text");
  const [text, setText] = useState(initialText);
  const [photo, setPhoto] = useState<File | null>(null);
  const [dur, setDur] = useState(5);
  const [bg, setBg] = useState("#000000");
  const [fg, setFg] = useState("#ffffff");
  const [effect, setEffect] = useState("zoom-in");
  const [sfx, setSfx] = useState("");
  const [effects, setEffects] = useState<string[]>(["zoom-in", "zoom-out"]);
  const [sfxTypes, setSfxTypes] = useState<string[]>([]);
  // Photo video: up to 120 s (seconds). Text video: typed in MINUTES, up to 1:30 (90 min).
  const maxDur = 120;
  const [durText, setDurText] = useState("5"); // "5" = 5 min, "30" = 30 min, "1:30" = 1 h 30 min
  const textMinutes = (() => {
    const m = /^(\d+):(\d{1,2})$/.exec(durText);
    const v = m ? Number(m[1]) * 60 + Number(m[2]) : Number(durText);
    return Number.isFinite(v) && v > 0 ? Math.min(90, v) : 5;
  })();
  const textSeconds = Math.max(1, Math.round(textMinutes * 60));
  const [video, setVideo] = useState<Blob | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const urlRef = useRef("");

  useEffect(() => {
    iqaiVideoOptions().then((o) => {
      if (o.effects.length) setEffects(o.effects);
      setSfxTypes(o.sfxTypes);
    }).catch(() => { /* defaults are fine; the real error shows when generating */ });
    return () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); };
  }, []);

  async function generate() {
    setBusy(true); setErr(""); setOk("");
    try {
      const blob = mode === "text"
        ? await iqaiTextVideo({ text, durationSec: textSeconds, bgColor: bg, textColor: fg, sfx: sfx || null })
        : await iqaiPhotoVideo(photo as File, effect, Math.min(dur, maxDur), sfx || null);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(blob);
      setVideo(blob); setUrl(urlRef.current);
    } catch (e) { setErr(msg(e)); }
    setBusy(false);
  }

  async function save() {
    if (!video) return;
    setBusy(true); setErr(""); setOk("");
    try {
      await uploadMedia(video, `video-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.mp4`);
      setOk("☁ បានរក្សាទុកក្នុងបណ្ណាល័យ (ផ្ទាំង Library) · Saved to library");
    } catch (e) { setErr(msg(e)); }
    setBusy(false);
  }

  const canGo = !busy && (mode === "text" ? text.trim().length > 0 : photo !== null);

  return (
    <div style={box}>
      <div style={{ marginBottom: 8 }}><span className="ks-inline-icon"><MenuGlyph name="film" /></span> បង្កើតវីដេអូ · Create video (offline, ffmpeg)</div>
      <button style={mode === "text" ? btn : soft} onClick={() => setMode("text")}><span className="ks-inline-icon"><MenuGlyph name="audit" /></span> ពីអត្ថបទ · Text</button>
      <button style={mode === "photo" ? btn : soft} onClick={() => setMode("photo")}><span className="ks-inline-icon"><MenuGlyph name="library" /></span> ពីរូបភាព · Photo</button>
      <button style={mode === "slideshow" ? btn : soft} onClick={() => setMode("slideshow")}>🎞 Slideshow</button>
      <button style={mode === "edit" ? btn : soft} onClick={() => setMode("edit")}>✂ កាត់ត · Edit</button>
      <button style={mode === "auto" ? btn : soft} onClick={() => setMode("auto")}>✨ AI Auto Create</button>
      <button style={mode === "story" ? btn : soft} onClick={() => setMode("story")}>🎬 រឿង · Story</button>
      {mode === "slideshow" && <SlideshowTab effects={effects} sfxTypes={sfxTypes} />}
      {mode === "edit" && <VideoEditPanel />}
      {mode === "auto" && <AiAutoCreatePanel />}
      {mode === "story" && <StoryTab effects={effects} sfxTypes={sfxTypes} />}
      <div style={{ marginTop: 8, display: mode === "slideshow" || mode === "edit" || mode === "auto" || mode === "story" ? "none" : undefined }}>
        {mode === "text" ? (
          <>
            <textarea
              style={{ ...input, width: "95%", minHeight: 80 }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="អត្ថបទ · Text (≤ 2000)"
            />
            <div>
              <label>ផ្ទៃ · BG <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} /></label>{" "}
              <label>អក្សរ · Text <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} /></label>
            </div>
          </>
        ) : (
          <>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            <div style={{ marginTop: 6 }}>
              <select style={input} value={effect} onChange={(e) => setEffect(e.target.value)}>
                {effects.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
          </>
        )}
        <div>
          <label>{mode === "text" ? (<>រយៈពេល · នាទី Minutes (1:30 = 1h30){" "}
            <input style={{ ...input, width: 90 }} type="text" inputMode="decimal" value={durText}
              onChange={(e) => setDurText(e.target.value.replace(/[^0-9.:]/g, "").slice(0, 7))} /></>) : (<>រយៈពេល · Seconds (1–{maxDur}){" "}
            <input style={{ ...input, width: 70 }} type="number" min={1} max={maxDur} value={dur}
              onChange={(e) => setDur(Math.min(maxDur, Math.max(1, Number(e.target.value) || 5)))} /></>)}
          </label>
          {sfxTypes.length > 0 && (
            <select style={input} value={sfx} onChange={(e) => setSfx(e.target.value)}>
              <option value="">🔇 គ្មានសំឡេង · No sound</option>
              {sfxTypes.map((x) => <option key={x} value={x}>🔊 {x}</option>)}
            </select>
          )}
        </div>
        <button style={btn} disabled={!canGo} onClick={() => void generate()}>▶ បង្កើត · Generate</button>
      </div>
      {busy && <div>កំពុងដំណើរការ... · Working...</div>}
      {err && <div style={{ color: "#ff8a8a" }}><span className="ks-inline-icon"><MenuGlyph name="safety" /></span> {err}</div>}
      {ok && <div style={{ color: "#8affb0" }}>{ok}</div>}
      {url && mode !== "slideshow" && mode !== "edit" && mode !== "auto" && mode !== "story" && (
        <div style={{ marginTop: 8 }}>
          <video controls src={url} style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 8 }} />
          <div>
            <button style={btn} disabled={busy} onClick={() => void save()}>☁ រក្សាទុក · Save to library</button>
            <a href={url} download="khoem-video.mp4" style={{ ...soft, textDecoration: "none", display: "inline-block" }}>⬇ ទាញយក</a>
          </div>
        </div>
      )}
    </div>
  );
}
