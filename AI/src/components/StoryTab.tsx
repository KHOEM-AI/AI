import { useEffect, useRef, useState } from "react";
import { iqaiStory, uploadMedia } from "../api/client";

// Story video: scenes (photo + optional caption, or a text card), each with its own length,
// fade transitions and one sound for the whole video (IQ-AI, ffmpeg, offline).

const input: React.CSSProperties = { borderRadius: 8, padding: 8, fontSize: 15, marginRight: 6, marginBottom: 6 };
const btn: React.CSSProperties = { padding: "8px 14px", borderRadius: 8, border: "none", background: "#4f7cff", color: "#fff", fontSize: 15, marginRight: 8, marginTop: 4 };
const soft: React.CSSProperties = { ...btn, background: "rgba(255,255,255,0.14)" };
const small: React.CSSProperties = { ...soft, padding: "4px 10px", marginRight: 4, marginTop: 0 };
const card: React.CSSProperties = { background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: 8, marginTop: 8 };

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const MAX_SCENES = 30;
const MAX_TOTAL = 900; // seconds, same as the server
const SIZES: Record<string, [number, number]> = { "9:16": [720, 1280], "1:1": [720, 720], "16:9": [1280, 720] };

type Scene = { key: number; file: File | null; text: string; sec: number };

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function StoryTab({ effects, sfxTypes }: { effects: string[]; sfxTypes: string[] }) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [defSec, setDefSec] = useState(5);
  const [transition, setTransition] = useState("fade");
  const [effect, setEffect] = useState("zoom-in");
  const [size, setSize] = useState("9:16");
  const [sfx, setSfx] = useState("");
  const [bg, setBg] = useState("#101030");
  const [fg, setFg] = useState("#ffffff");
  const [video, setVideo] = useState<Blob | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const urlRef = useRef("");
  const keyRef = useRef(0);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const total = scenes.reduce((n, s) => n + s.sec, 0);

  function addPhotos(list: FileList | null) {
    if (!list) return;
    const add = Array.from(list).map((file) => ({ key: ++keyRef.current, file, text: "", sec: defSec }));
    setScenes((s) => [...s, ...add].slice(0, MAX_SCENES));
  }
  const addText = () => setScenes((s) => [...s, { key: ++keyRef.current, file: null, text: "", sec: defSec }].slice(0, MAX_SCENES));
  const patch = (key: number, p: Partial<Scene>) => setScenes((s) => s.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const remove = (key: number) => setScenes((s) => s.filter((x) => x.key !== key));
  function move(i: number, d: number) {
    setScenes((s) => {
      const j = i + d;
      if (j < 0 || j >= s.length) return s;
      const c = s.slice();
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  }

  const missing = scenes.findIndex((s) => !s.file && !s.text.trim());

  async function generate() {
    setBusy(true); setErr(""); setOk("");
    try {
      const out: { imageId?: string; text?: string; seconds: number }[] = [];
      for (const s of scenes) {
        const item: { imageId?: string; text?: string; seconds: number } = { seconds: s.sec };
        if (s.file) item.imageId = (await uploadMedia(s.file, s.file.name)).id;
        if (s.text.trim()) item.text = s.text.trim();
        out.push(item);
      }
      const [width, height] = SIZES[size];
      const blob = await iqaiStory({
        scenes: out, width, height, effect, transition, bgColor: bg, textColor: fg, sfx: sfx || null,
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
      await uploadMedia(video, `story-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.mp4`);
      setOk("☁ បានរក្សាទុកក្នុងបណ្ណាល័យ · Saved to library");
    } catch (e) { setErr(msg(e)); }
    setBusy(false);
  }

  const effectList = [...effects.filter((x) => x !== "none"), "none"];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ opacity: 0.85, fontSize: 13 }}>
        ឈុត · Scenes {scenes.length}/{MAX_SCENES} · សរុប · Total {fmt(total)} {total > MAX_TOTAL && "⚠ > 15:00"}
      </div>
      <div>
        <label style={{ ...soft, display: "inline-block", cursor: "pointer" }}>
          🖼 + រូបភាព · Photos
          <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: "none" }}
            onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
        </label>
        <button style={soft} onClick={addText}>✍ + អក្សរ · Text card</button>
      </div>

      {scenes.map((s, i) => (
        <div key={s.key} style={card}>
          <div>
            {i + 1}. {s.file ? `🖼 ${s.file.name}` : "✍ អក្សរ · Text card"}{" "}
            <button style={small} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
            <button style={small} disabled={i === scenes.length - 1} onClick={() => move(i, 1)}>↓</button>
            <button style={small} onClick={() => remove(s.key)}>✕</button>
          </div>
          <textarea style={{ ...input, width: "95%", minHeight: 56 }} value={s.text} maxLength={600}
            placeholder={s.file ? "អក្សរក្រោមរូប · Caption (optional)" : "អត្ថបទ · Text"}
            onChange={(e) => patch(s.key, { text: e.target.value })} />
          <div>
            <label>វិនាទី · Seconds{" "}
              <input style={{ ...input, width: 70 }} type="number" min={1} max={60} value={s.sec}
                onChange={(e) => patch(s.key, { sec: Math.min(60, Math.max(1, Number(e.target.value) || 5)) })} /></label>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 8 }}>
        <label>វិនាទីលំនាំដើម · Default sec{" "}
          <input style={{ ...input, width: 60 }} type="number" min={1} max={60} value={defSec}
            onChange={(e) => setDefSec(Math.min(60, Math.max(1, Number(e.target.value) || 5)))} /></label>
        <select style={input} value={transition} onChange={(e) => setTransition(e.target.value)}>
          <option value="fade">ចេញចូលរលោង · Fade</option>
          <option value="none">គ្មាន · None</option>
        </select>
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
      <div>
        <label>ផ្ទៃអក្សរ · Card BG <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} /></label>{" "}
        <label>អក្សរ · Text <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} /></label>
      </div>

      <button style={btn} disabled={busy || scenes.length === 0 || missing >= 0 || total > MAX_TOTAL} onClick={() => void generate()}>
        ▶ បង្កើត · Generate
      </button>
      {missing >= 0 && <div style={{ color: "#ffd27a" }}>ឈុតទី {missing + 1} គ្មានរូប ឬអក្សរ · Scene {missing + 1} needs a photo or text</div>}
      {busy && <div>កំពុងដំណើរការ... (វីដេអូវែងប្រើពេលយូរ) · Working... long videos take a while</div>}
      {err && <div style={{ color: "#ff8a8a" }}>⚠ {err}</div>}
      {ok && <div style={{ color: "#8affb0" }}>{ok}</div>}
      {url && (
        <div style={{ marginTop: 8 }}>
          <video controls src={url} style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 8 }} />
          <div>
            <button style={btn} disabled={busy} onClick={() => void save()}>☁ រក្សាទុក · Save to library</button>
            <a href={url} download="khoem-story.mp4" style={{ ...soft, textDecoration: "none", display: "inline-block" }}>⬇ ទាញយក</a>
          </div>
        </div>
      )}
    </div>
  );
}
