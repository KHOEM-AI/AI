import { useEffect, useRef, useState } from "react";
import { iqaiSlideshow, uploadMedia } from "../api/client";

// Slideshow: several photos + a caption under each + sound -> one mp4 (IQ-AI, ffmpeg, offline).

const input: React.CSSProperties = { borderRadius: 8, padding: 8, fontSize: 15, marginRight: 6, marginBottom: 6 };
const btn: React.CSSProperties = { padding: "8px 14px", borderRadius: 8, border: "none", background: "#4f7cff", color: "#fff", fontSize: 15, marginRight: 8, marginTop: 4 };
const soft: React.CSSProperties = { ...btn, background: "rgba(255,255,255,0.14)" };
const small: React.CSSProperties = { ...soft, padding: "4px 10px", marginRight: 4, marginTop: 0 };

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const MAX_SLIDES = 20;
const SIZES: Record<string, [number, number]> = {
  "9:16": [720, 1280],
  "1:1": [720, 720],
  "16:9": [1280, 720],
};

type Slide = { key: number; file: File; caption: string };

export default function SlideshowTab({ effects, sfxTypes }: { effects: string[]; sfxTypes: string[] }) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [sec, setSec] = useState(3);
  const [effect, setEffect] = useState("zoom-in");
  const [size, setSize] = useState("9:16");
  const [sfx, setSfx] = useState("");
  const [video, setVideo] = useState<Blob | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const urlRef = useRef("");
  const keyRef = useRef(0);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const add = Array.from(list).map((file) => ({ key: ++keyRef.current, file, caption: "" }));
    setSlides((s) => [...s, ...add].slice(0, MAX_SLIDES));
  }
  const setCaption = (key: number, caption: string) =>
    setSlides((s) => s.map((x) => (x.key === key ? { ...x, caption } : x)));
  const remove = (key: number) => setSlides((s) => s.filter((x) => x.key !== key));
  function move(i: number, d: number) {
    setSlides((s) => {
      const j = i + d;
      if (j < 0 || j >= s.length) return s;
      const c = s.slice();
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  }

  async function generate() {
    setBusy(true); setErr(""); setOk("");
    try {
      const ids: string[] = [];
      for (const s of slides) ids.push((await uploadMedia(s.file, s.file.name)).id);
      const [width, height] = SIZES[size];
      const blob = await iqaiSlideshow({
        ids,
        captions: slides.map((s) => s.caption.trim()),
        secondsPerSlide: sec,
        effect,
        width,
        height,
        sfx: sfx || null,
      });
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
      await uploadMedia(video, `slideshow-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.mp4`);
      setOk("☁ បានរក្សាទុកក្នុងបណ្ណាល័យ · Saved to library");
    } catch (e) { setErr(msg(e)); }
    setBusy(false);
  }

  const effectList = [...effects.filter((x) => x !== "none"), "none"];

  return (
    <div style={{ marginTop: 8 }}>
      <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
        រូបភាព · Photos {slides.length}/{MAX_SLIDES}
      </div>
      {slides.map((s, i) => (
        <div key={s.key} style={{ marginTop: 6 }}>
          <div>
            {i + 1}. {s.file.name}{" "}
            <button style={small} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
            <button style={small} disabled={i === slides.length - 1} onClick={() => move(i, 1)}>↓</button>
            <button style={small} onClick={() => remove(s.key)}>✕</button>
          </div>
          <input style={{ ...input, width: "95%" }} value={s.caption} maxLength={300}
            placeholder="អក្សរក្រោមរូប · Caption (optional)"
            onChange={(e) => setCaption(s.key, e.target.value)} />
        </div>
      ))}
      <div style={{ marginTop: 6 }}>
        <label>វិនាទី/រូប · Seconds{" "}
          <input style={{ ...input, width: 60 }} type="number" min={1} max={15} value={sec}
            onChange={(e) => setSec(Math.min(15, Math.max(1, Number(e.target.value) || 3)))} /></label>
        <select style={input} value={effect} onChange={(e) => setEffect(e.target.value)}>
          {effectList.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select style={input} value={size} onChange={(e) => setSize(e.target.value)}>
          {Object.keys(SIZES).map((k) => <option key={k} value={k}>{k} ({SIZES[k][0]}×{SIZES[k][1]})</option>)}
        </select>
        {sfxTypes.length > 0 && (
          <select style={input} value={sfx} onChange={(e) => setSfx(e.target.value)}>
            <option value="">🔇 គ្មានសំឡេង · No sound</option>
            {sfxTypes.map((x) => <option key={x} value={x}>🔊 {x}</option>)}
          </select>
        )}
      </div>
      <button style={btn} disabled={busy || slides.length === 0} onClick={() => void generate()}>▶ បង្កើត · Generate</button>
      {busy && <div>កំពុងដំណើរការ... · Working...</div>}
      {err && <div style={{ color: "#ff8a8a" }}>⚠ {err}</div>}
      {ok && <div style={{ color: "#8affb0" }}>{ok}</div>}
      {url && (
        <div style={{ marginTop: 8 }}>
          <video controls src={url} style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 8 }} />
          <div>
            <button style={btn} disabled={busy} onClick={() => void save()}>☁ រក្សាទុក · Save to library</button>
            <a href={url} download="khoem-slideshow.mp4" style={{ ...soft, textDecoration: "none", display: "inline-block" }}>⬇ ទាញយក</a>
          </div>
        </div>
      )}
    </div>
  );
}
