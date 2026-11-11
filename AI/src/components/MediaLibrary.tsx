import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteMedia,
  iqaiContentUrl,
  iqaiInspectImage,
  iqaiInspectVideo,
  iqaiMergeVideos,
  listMedia,
  uploadMedia,
} from "../api/client";
import type { IqaiMedia } from "../api/client";

// Storage + distribution page of the Creative Studio.
// Stores images / audio / video in IQ-AI (/iqai/media) and lets the user
// preview, download, share and delete them. Sounds live in <SoundLibrary/>.

const box: React.CSSProperties = { background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 12, marginBottom: 12, boxSizing: "border-box", maxWidth: "100%" };
const btn: React.CSSProperties = { padding: "6px 12px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", marginRight: 8, marginTop: 4 };
const TYPES: [string, string][] = [["", "ទាំងអស់ · All"], ["image", "🖼 រូបភាព"], ["audio", "🎧 សំឡេង"], ["video", "🎬 វីដេអូ"]];

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function MediaLibrary() {
  const [items, setItems] = useState<IqaiMedia[]>([]);
  const [type, setType] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  // merge: ids of the videos picked, in the order they were picked
  const [picked, setPicked] = useState<string[]>([]);
  const [merged, setMerged] = useState<Blob | null>(null);
  const [mergedUrl, setMergedUrl] = useState("");
  const mergedRef = useRef("");

  useEffect(() => () => { if (mergedRef.current) URL.revokeObjectURL(mergedRef.current); }, []);

  const load = useCallback(async () => {
    setBusy(true); setErr("");
    try { setItems(await listMedia()); } catch (e) { setErr(msg(e)); }
    setBusy(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setBusy(true); setErr(""); setInfo("");
    try {
      if (f.type.startsWith("image/")) {
        const i = await iqaiInspectImage(f);
        setInfo(`🖼 ${i.format.toUpperCase()} · ${i.width}×${i.height}`);
      } else if (f.type.startsWith("video/")) {
        const v = await iqaiInspectVideo(f);
        setInfo(`🎬 ${v.format.toUpperCase()} · ${v.width}×${v.height} · ${v.durationSec.toFixed(1)}s`);
      }
    } catch { /* inspect is informational only; upload still validates */ }
    try { await uploadMedia(f, f.name); await load(); }
    catch (e) { setErr(msg(e)); }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function remove(m: IqaiMedia) {
    if (!window.confirm(`លុប "${m.filename}"?`)) return;
    setBusy(true); setErr("");
    try { await deleteMedia(m.id); setItems((p) => p.filter((x) => x.id !== m.id)); setPicked((p) => p.filter((x) => x !== m.id)); }
    catch (e) { setErr(msg(e)); }
    setBusy(false);
  }

  const togglePick = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function mergePicked() {
    setBusy(true); setErr(""); setInfo("");
    try {
      const blob = await iqaiMergeVideos(picked);
      if (mergedRef.current) URL.revokeObjectURL(mergedRef.current);
      mergedRef.current = URL.createObjectURL(blob);
      setMerged(blob); setMergedUrl(mergedRef.current);
    } catch (e) { setErr(msg(e)); }
    setBusy(false);
  }

  async function saveMerged() {
    if (!merged) return;
    setBusy(true); setErr(""); setInfo("");
    try {
      await uploadMedia(merged, `film-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.mp4`);
      setInfo("☁ បានរក្សាទុកវីដេអូដែលភ្ជាប់ · Merged video saved");
      setMerged(null); setMergedUrl(""); setPicked([]);
      await load();
    } catch (e) { setErr(msg(e)); }
    setBusy(false);
  }

  async function share(m: IqaiMedia) {
    setErr(""); setInfo("");
    try {
      const url = new URL(iqaiContentUrl(m.id), window.location.origin).href;
      if (navigator.share) {
        try {
          const blob = await (await fetch(iqaiContentUrl(m.id))).blob();
          const file = new File([blob], m.filename, { type: m.mime });
          if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: m.filename }); return; }
        } catch (e) { if ((e as Error).name === "AbortError") return; }
      }
      await navigator.clipboard.writeText(url);
      setInfo("📋 ចម្លងតំណរួចហើយ (ប្រើបានតែលើបណ្ដាញដូចគ្នា) · Link copied (same network only)");
    } catch (e) { setErr(msg(e)); }
  }

  const shown = items.filter((m) => !type || m.type === type);
  const url = (m: IqaiMedia) => iqaiContentUrl(m.id);

  return (
    <div style={box}>
      <div style={{ marginBottom: 6 }}>🗂 ទុកទិន្នន័យ & ចែកចាយ · Library & Share ({shown.length})</div>
      <input ref={fileRef} type="file" accept="image/*,audio/*,video/*" onChange={(e) => void onFile(e.target.files?.[0])} />
      <select style={{ marginLeft: 6, borderRadius: 8, padding: 6 }} value={type} onChange={(e) => setType(e.target.value)}>
        {TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      <button style={btn} onClick={() => void load()}>↻</button>
      {picked.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <button style={{ ...btn, background: "#4f7cff" }} disabled={busy || picked.length < 2} onClick={() => void mergePicked()}>
            🎞 ភ្ជាប់ · Merge ({picked.length})
          </button>
          <button style={btn} onClick={() => { setPicked([]); }}>✖ សម្អាត · Clear</button>
          {picked.length < 2 && <span style={{ fontSize: 13, opacity: 0.8 }}>ជ្រើសយ៉ាងតិច 2 វីដេអូ · Pick at least 2 videos</span>}
        </div>
      )}
      {mergedUrl && (
        <div style={{ marginTop: 8 }}>
          <video controls src={mergedUrl} style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 8 }} />
          <div>
            <button style={{ ...btn, background: "#4f7cff" }} disabled={busy} onClick={() => void saveMerged()}>☁ រក្សាទុក · Save merged</button>
            <a href={mergedUrl} download="khoem-film.mp4" style={{ ...btn, textDecoration: "none", display: "inline-block" }}>⬇ ទាញយក</a>
          </div>
        </div>
      )}
      {busy && <div>កំពុងដំណើរការ... · Working...</div>}
      {info && <div style={{ fontSize: 13, opacity: 0.85 }}>{info}</div>}
      {err && <div style={{ color: "#ff8a8a" }}>⚠️ {err}</div>}
      {!busy && !err && shown.length === 0 && <div>មិនមានឯកសារ · Nothing stored yet</div>}
      {shown.map((m) => (
        <div key={m.id} style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "8px 0" }}>
          <div style={{ fontSize: 15 }}>{m.filename}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{m.type} · {m.mime} · {Math.max(1, Math.round(m.size / 1024))} KB</div>
          {m.type === "image" && <img src={url(m)} alt={m.filename} style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 8, marginTop: 4 }} />}
          {m.type === "audio" && <audio controls src={url(m)} style={{ width: "100%", marginTop: 4 }} />}
          {m.type === "video" && <video controls src={url(m)} style={{ maxWidth: "100%", maxHeight: 220, marginTop: 4 }} />}
          <div>
            <a href={url(m)} download={m.filename} style={{ ...btn, textDecoration: "none", display: "inline-block" }}>⬇ ទាញយក</a>
            <button style={btn} onClick={() => void share(m)}>📤 ចែកចាយ</button>
            {m.type === "video" && (
              <button style={picked.includes(m.id) ? { ...btn, background: "#4f7cff" } : btn} onClick={() => togglePick(m.id)}>
                {picked.includes(m.id) ? `✔ ${picked.indexOf(m.id) + 1}` : "＋ ភ្ជាប់"}
              </button>
            )}
            <button style={{ ...btn, background: "rgba(255,80,80,0.35)" }} onClick={() => void remove(m)}>🗑 លុប</button>
          </div>
        </div>
      ))}
    </div>
  );
}
