import { useEffect, useRef, useState } from "react";
import { iqaiCancelJob, iqaiContentUrl, iqaiJob, iqaiStartJob, iqaiVoices, listMedia, uploadMedia } from "../api/client";
import type { IqaiVoice } from "../api/client";
import { deleteProject, listProjects, newProjectId, saveProject } from "../api/storyProjects";
import type { StoryProject } from "../api/storyProjects";

// Story video as a background job: scenes (photo + optional caption, or a text card), each with its own
// length, fade transitions and one sound. The server renders it in the background (IQ-AI, ffmpeg, offline);
// this tab shows progress, can cancel, and plays the result when it is done.

const input: React.CSSProperties = { borderRadius: 8, padding: 8, fontSize: 15, marginRight: 6, marginBottom: 6 };
const btn: React.CSSProperties = { padding: "8px 14px", borderRadius: 8, border: "none", background: "#4f7cff", color: "#fff", fontSize: 15, marginRight: 8, marginTop: 4 };
const soft: React.CSSProperties = { ...btn, background: "rgba(255,255,255,0.14)" };
const small: React.CSSProperties = { ...soft, padding: "4px 10px", marginRight: 4, marginTop: 0 };
const card: React.CSSProperties = { background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: 8, marginTop: 8 };

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const MAX_SCENES = 30;
const MAX_TOTAL = 900; // seconds, same as the server
const SIZES: Record<string, [number, number]> = { "9:16": [720, 1280], "1:1": [720, 720], "16:9": [1280, 720] };
const POLL_MS = 1500;

// file: a photo picked in this session; imageId: its library id once uploaded (or when opened from a project)
type Scene = { key: number; file: File | null; imageId: string; name: string; text: string; say: string; voice: string; sec: number };
type LibImage = { id: string; type?: string; filename?: string };

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function StoryTab({ effects, sfxTypes }: { effects: string[]; sfxTypes: string[] }) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [defSec, setDefSec] = useState(5);
  const [transition, setTransition] = useState("fade");
  const [effect, setEffect] = useState("zoom-in");
  const [size, setSize] = useState("9:16");
  const [sfx, setSfx] = useState("");
  const [bg, setBg] = useState("#101030");
  const [fg, setFg] = useState("#ffffff");
  const [projects, setProjects] = useState<StoryProject[]>(() => listProjects());
  const [voices, setVoices] = useState<IqaiVoice[]>([]);
  const [defVoice, setDefVoice] = useState("");
  const [libImages, setLibImages] = useState<LibImage[]>([]);
  const [libPick, setLibPick] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [video, setVideo] = useState<Blob | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(""); // what the user sees while busy
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const urlRef = useRef("");
  const keyRef = useRef(0);
  const aliveRef = useRef(true);
  const cancelRef = useRef(false);

  async function refreshLibrary() {
    try { setLibImages(((await listMedia()) as unknown as LibImage[]).filter((m) => m.type === "image")); } catch { /* the list is optional */ }
  }

  useEffect(() => {
    aliveRef.current = true;
    iqaiVoices().then((v) => { if (aliveRef.current) setVoices(v); }).catch(() => { /* voices are optional; the job reports a real problem */ });
    void refreshLibrary();
    return () => { aliveRef.current = false; if (urlRef.current) URL.revokeObjectURL(urlRef.current); };
  }, []);

  const total = scenes.reduce((n, s) => n + s.sec, 0);

  function addPhotos(list: FileList | null) {
    if (!list) return;
    const add = Array.from(list).map((file) => ({ key: ++keyRef.current, file, imageId: "", name: file.name, text: "", say: "", voice: "", sec: defSec }));
    setScenes((s) => [...s, ...add].slice(0, MAX_SCENES));
  }
  const addText = () => setScenes((s) => [...s, { key: ++keyRef.current, file: null, imageId: "", name: "", text: "", say: "", voice: "", sec: defSec }].slice(0, MAX_SCENES));
  function addFromLibrary() {
    const m = libImages.find((x) => x.id === libPick);
    if (!m) return;
    setScenes((s) => [...s, { key: ++keyRef.current, file: null, imageId: m.id, name: m.filename || m.id.slice(0, 8), text: "", say: "", voice: "", sec: defSec }].slice(0, MAX_SCENES));
    setLibPick("");
  }
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

  const hasPhoto = (s: Scene) => !!s.file || !!s.imageId;
  const missing = scenes.findIndex((s) => !hasPhoto(s) && !s.text.trim());

  // Upload the photos that are not in the library yet; remember their ids so nothing is uploaded twice.
  async function ensureUploaded(): Promise<Scene[]> {
    const done: Scene[] = [];
    for (const s of scenes) {
      if (s.file && !s.imageId) done.push({ ...s, imageId: (await uploadMedia(s.file, s.file.name)).id });
      else done.push(s);
    }
    setScenes(done);
    return done;
  }

  const settingsNow = () => ({ defSec, transition, effect, size, sfx, bg, fg, voice: defVoice });

  async function saveCurrent() {
    setBusy(true); setErr(""); setOk(""); setPhase("កំពុងរក្សាទុក · Saving...");
    try {
      const list = await ensureUploaded();
      const name = projectName.trim() || `រឿង ${new Date().toLocaleString()}`;
      const id = projectId || newProjectId();
      saveProject({
        id, name, savedAt: new Date().toISOString(), settings: settingsNow(),
        scenes: list.map((s) => ({ imageId: s.imageId, name: s.name, text: s.text, sec: s.sec, say: s.say, voice: s.voice })),
      });
      setProjectId(id); setProjectName(name); setProjects(listProjects());
      setOk(`💾 បានរក្សាទុកគម្រោង · Saved project "${name}"`);
    } catch (e) { setErr(msg(e)); }
    setBusy(false); setPhase("");
  }

  function openProject(id: string) {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setScenes(p.scenes.map((s) => ({ key: ++keyRef.current, file: null, imageId: s.imageId, name: s.name, text: s.text, say: s.say || "", voice: s.voice || "", sec: s.sec })));
    const st = p.settings;
    setDefSec(st.defSec); setTransition(st.transition); setEffect(st.effect); setSize(SIZES[st.size] ? st.size : "9:16");
    setSfx(st.sfx); setBg(st.bg); setFg(st.fg); setDefVoice(st.voice || "");
    setProjectId(p.id); setProjectName(p.name); setErr(""); setOk(`📂 បានបើក · Opened "${p.name}"`);
  }

  function removeProject() {
    if (!projectId) return;
    try { deleteProject(projectId); } catch (e) { setErr(msg(e)); return; }
    setProjects(listProjects()); setProjectId(""); setProjectName(""); setOk("🗑 បានលុបគម្រោង · Project deleted");
  }

  function newProject() { setScenes([]); setProjectId(""); setProjectName(""); setOk(""); setErr(""); }

  async function generate() {
    setBusy(true); setErr(""); setOk(""); setProgress(0); setJobId("");
    cancelRef.current = false;
    try {
      setPhase("កំពុងបញ្ចូលរូប · Uploading photos...");
      const list = await ensureUploaded();
      const out: { imageId?: string; text?: string; seconds: number; say?: string; voice?: string }[] = [];
      for (const s of list) {
        const item: { imageId?: string; text?: string; seconds: number; say?: string; voice?: string } = { seconds: s.sec };
        if (s.imageId) item.imageId = s.imageId;
        if (s.text.trim()) item.text = s.text.trim();
        if (s.say.trim()) { item.say = s.say.trim(); if (s.voice) item.voice = s.voice; }
        out.push(item);
      }
      const [width, height] = SIZES[size];
      setPhase("កំពុងបង្កើតវីដេអូ · Rendering...");
      let job = await iqaiStartJob("video.story", {
        scenes: out, width, height, effect, transition, bgColor: bg, textColor: fg, sfx: sfx || undefined, voice: defVoice || undefined,
      });
      setJobId(job.id);
      while (aliveRef.current && (job.status === "queued" || job.status === "running")) {
        await sleep(POLL_MS);
        job = await iqaiJob(job.id);
        if (aliveRef.current) setProgress(job.progress);
      }
      if (!aliveRef.current) return;
      if (job.status === "cancelled" || cancelRef.current) { setOk("បានបោះបង់ · Cancelled"); }
      else if (job.status === "failed") { throw new Error(job.error ? job.error.message : "Job failed"); }
      else if (job.status === "done" && job.result) {
        const r = await fetch(iqaiContentUrl(job.result.mediaId));
        if (!r.ok) throw new Error(`Could not load the video (${r.status})`);
        const blob = await r.blob();
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = URL.createObjectURL(blob);
        setVideo(blob); setUrl(urlRef.current);
        setOk("✅ ចប់ហើយ · Done (រក្សាទុកក្នុងបណ្ណាល័យរួចហើយ · already saved in the library)");
      }
    } catch (e) { if (aliveRef.current) setErr(msg(e)); }
    if (aliveRef.current) { setBusy(false); setPhase(""); setJobId(""); }
  }

  async function cancel() {
    cancelRef.current = true;
    if (jobId) { try { await iqaiCancelJob(jobId); } catch (e) { setErr(msg(e)); } }
  }

  const effectList = [...effects.filter((x) => x !== "none"), "none"];
  const pct = Math.round(progress * 100);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={card}>
        <div>📁 គម្រោង · Project</div>
        <input style={{ ...input, width: "60%" }} value={projectName} maxLength={80}
          placeholder="ឈ្មោះគម្រោង · Project name" onChange={(e) => setProjectName(e.target.value)} />
        <button style={btn} disabled={busy || scenes.length === 0 || missing >= 0} onClick={() => void saveCurrent()}>💾 រក្សាទុក · Save</button>
        <div>
          <select style={{ ...input, maxWidth: "70%" }} value={projectId} onChange={(e) => (e.target.value ? openProject(e.target.value) : newProject())}>
            <option value="">{projects.length ? "📂 បើកគម្រោង · Open a project..." : "មិនទាន់មានគម្រោង · No projects yet"}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.scenes.length})</option>)}
          </select>
          <button style={small} disabled={busy} onClick={newProject}>＋ ថ្មី · New</button>
          <button style={small} disabled={busy || !projectId} onClick={removeProject}>🗑</button>
        </div>
      </div>
      <div style={{ opacity: 0.85, fontSize: 13, marginTop: 8 }}>
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
      <div>
        <select style={{ ...input, maxWidth: "65%" }} value={libPick} onChange={(e) => setLibPick(e.target.value)}>
          <option value="">{libImages.length ? "📚 រូបពី Library · From library..." : "Library គ្មានរូប · no photos in the library"}</option>
          {libImages.map((m) => <option key={m.id} value={m.id}>{m.filename || m.id.slice(0, 8)}</option>)}
        </select>
        <button style={soft} disabled={!libPick} onClick={addFromLibrary}>＋</button>
        <button style={small} onClick={() => void refreshLibrary()}>↻</button>
      </div>

      {scenes.map((s, i) => (
        <div key={s.key} style={card}>
          <div>
            {i + 1}. {hasPhoto(s) ? `🖼 ${s.name || s.imageId.slice(0, 8)}` : "✍ អក្សរ · Text card"}{" "}
            <button style={small} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
            <button style={small} disabled={i === scenes.length - 1} onClick={() => move(i, 1)}>↓</button>
            <button style={small} onClick={() => remove(s.key)}>✕</button>
          </div>
          {s.imageId && <img src={iqaiContentUrl(s.imageId)} alt="" style={{ height: 48, borderRadius: 6, display: "block", marginTop: 4 }} />}
          <textarea style={{ ...input, width: "95%", minHeight: 56 }} value={s.text} maxLength={600}
            placeholder={hasPhoto(s) ? "អក្សរក្រោមរូប · Caption (optional)" : "អត្ថបទ · Text"}
            onChange={(e) => patch(s.key, { text: e.target.value })} />
          <textarea style={{ ...input, width: "95%", minHeight: 44 }} value={s.say} maxLength={1000}
            placeholder="🗣 សំឡេងអាន · Spoken narration (optional)"
            onChange={(e) => patch(s.key, { say: e.target.value })} />
          {s.say.trim() && voices.length > 0 && (
            <select style={input} value={s.voice} onChange={(e) => patch(s.key, { voice: e.target.value })}>
              <option value="">🗣 សំឡេងលំនាំដើម · default voice</option>
              {voices.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          )}
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
        {voices.length > 0 && (
          <select style={input} value={defVoice} onChange={(e) => setDefVoice(e.target.value)}>
            <option value="">🗣 សំឡេងអាន · Narrator voice (male)</option>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        )}
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
      {busy && jobId && <button style={soft} onClick={() => void cancel()}>■ បោះបង់ · Cancel</button>}
      {missing >= 0 && <div style={{ color: "#ffd27a" }}>ឈុតទី {missing + 1} គ្មានរូប ឬអក្សរ · Scene {missing + 1} needs a photo or text</div>}
      {busy && (
        <div style={{ marginTop: 6 }}>
          <div>{phase} {jobId && `${pct}%`}</div>
          {jobId && (
            <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.14)", overflow: "hidden", marginTop: 4 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "#4f7cff", transition: "width 0.4s" }} />
            </div>
          )}
        </div>
      )}
      {err && <div style={{ color: "#ff8a8a" }}>⚠ {err}</div>}
      {ok && <div style={{ color: "#8affb0" }}>{ok}</div>}
      {url && (
        <div style={{ marginTop: 8 }}>
          <video controls src={url} style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 8 }} />
          <div>
            <a href={url} download="khoem-story.mp4" style={{ ...soft, textDecoration: "none", display: "inline-block" }}>⬇ ទាញយក</a>
          </div>
        </div>
      )}
      {video && <div style={{ opacity: 0.7, fontSize: 12 }}>{(video.size / 1048576).toFixed(1)} MB</div>}
    </div>
  );
}
