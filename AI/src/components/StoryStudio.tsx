import { useEffect, useRef, useState } from "react";

// Story video maker: photos + captions + your own voice recordings -> one MP4 (offline, IQ-AI /videos/story).
// No external AI service. It animates the photos you give it (zoom / pan / fade) and mixes your voice and music.
type Effect = "zoom-in" | "zoom-out" | "pan-left" | "pan-right" | "none";
interface Scene { key: number; image: File | null; voice: File | null; text: string; sec: string; effect: Effect }
const EFFECTS: Effect[] = ["zoom-in", "zoom-out", "pan-left", "pan-right", "none"];
const ASPECTS = ["9:16", "16:9", "1:1"] as const;

const box: React.CSSProperties = { background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 12, marginBottom: 12 };
const btn: React.CSSProperties = { padding: "8px 14px", borderRadius: 8, border: "none", background: "#4f7cff", color: "#fff", marginRight: 6, marginBottom: 6, fontSize: 15 };
const inp: React.CSSProperties = { borderRadius: 8, padding: 8, fontSize: 15, marginRight: 6, marginBottom: 6 };

async function call(path: string, init?: RequestInit) {
  const r = await fetch(`/iqai${path}`, init);
  if (!r.ok) {
    const j = await r.json().catch(() => null);
    const e = j?.error;
    throw new Error((typeof e === "string" ? e : e?.message ?? e?.code) ?? `HTTP ${r.status}`);
  }
  return r;
}
async function upload(f: File): Promise<string> {
  const r = await call("/media", { method: "POST", headers: { "Content-Type": f.type, "X-Filename": encodeURIComponent(f.name) }, body: f });
  return (await r.json()).data.id as string;
}

let nextKey = 1;
const blank = (): Scene => ({ key: nextKey++, image: null, voice: null, text: "", sec: "", effect: "zoom-in" });

export default function StoryStudio() {
  const [scenes, setScenes] = useState<Scene[]>([blank()]);
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]>("9:16");
  const [music, setMusic] = useState("");          // "" = none, "sfx:<type>" = built-in loop, "file" = your own file
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicVol, setMusicVol] = useState(0.3);
  const [sfxTypes, setSfxTypes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState("");
  const urlRef = useRef("");

  useEffect(() => {
    call("/videos/effects").then((r) => r.json()).then((j) => setSfxTypes((j.data?.sfxTypes as string[]) ?? [])).catch(() => {});
    return () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); };
  }, []);

  const set = (key: number, patch: Partial<Scene>) => setScenes((all) => all.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const move = (i: number, d: number) => setScenes((all) => {
    const j = i + d; if (j < 0 || j >= all.length) return all;
    const c = all.slice(); [c[i], c[j]] = [c[j], c[i]]; return c;
  });

  const make = async () => {
    setMsg(""); setInfo(""); setBusy(true);
    const made: string[] = [];
    try {
      const body: Record<string, unknown> = { aspect, scenes: [] as unknown[] };
      const list: Record<string, unknown>[] = [];
      for (const [i, s] of scenes.entries()) {
        if (!s.image && !s.text.trim()) throw new Error(`ឈុត ${i + 1}: ត្រូវការរូប ឬអត្ថបទ · scene ${i + 1} needs a photo or text`);
        setMsg(`⏳ ផ្ទុកឡើងឈុត ${i + 1}/${scenes.length}…`);
        const o: Record<string, unknown> = { text: s.text, effect: s.image ? s.effect : "none" };
        if (s.image) { const id = await upload(s.image); made.push(id); o.imageId = id; }
        if (s.voice) { const id = await upload(s.voice); made.push(id); o.voiceId = id; }
        if (s.sec.trim()) o.durationSec = Number(s.sec);
        list.push(o);
      }
      body.scenes = list;
      if (music.startsWith("sfx:")) { body.music = { sfx: music.slice(4) }; body.musicVolume = musicVol; }
      else if (music === "file" && musicFile) { const id = await upload(musicFile); made.push(id); body.music = { mediaId: id }; body.musicVolume = musicVol; }
      setMsg("⏳ កំពុងបង្កើតវីដេអូ… (វីដេអូវែងអាចយូរជាច្រើននាទី · keep this page open)");
      const r = await call("/videos/story", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setInfo(r.headers.get("X-Applied") ?? "");
      const blob = await r.blob();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(blob);
      setUrl(urlRef.current); setMsg("");
    } catch (e) {
      setMsg("⚠️ " + (e instanceof Error ? e.message : String(e)));
    } finally {
      await Promise.all(made.map((id) => fetch(`/iqai/media/${id}`, { method: "DELETE" }).catch(() => {})));
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={box}>
        <div style={{ marginBottom: 6 }}>🎞 វីដេអូរឿង · Story video — រូប + អត្ថបទ + សំឡេងរបស់បង</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 8 }}>
          ដាក់រូបជាឈុតៗ សរសេរអត្ថបទ ហើយបញ្ចូលសំឡេងអានដែលបងថតរួច (wav · mp3 · ogg)។ បើមិនដាក់វិនាទី វាប្រើប្រវែងសំឡេង។
        </div>
        <select style={inp} value={aspect} onChange={(e) => setAspect(e.target.value as (typeof ASPECTS)[number])}>
          {ASPECTS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select style={inp} value={music} onChange={(e) => setMusic(e.target.value)}>
          <option value="">🔇 គ្មានសំឡេងផ្ទៃក្រោយ</option>
          {sfxTypes.map((t) => <option key={t} value={`sfx:${t}`}>🔊 {t}</option>)}
          <option value="file">🎵 ឯកសាររបស់បងផ្ទាល់</option>
        </select>
        {music === "file" && <input style={inp} type="file" accept="audio/wav,audio/mpeg,audio/ogg" onChange={(e) => setMusicFile(e.target.files?.[0] ?? null)} />}
        {music && (
          <label style={{ display: "block", fontSize: 14 }}>សំឡេងផ្ទៃក្រោយ · Music volume: {musicVol}
            <input type="range" min={0} max={1} step={0.05} value={musicVol} onChange={(e) => setMusicVol(Number(e.target.value))} style={{ width: "100%" }} />
          </label>
        )}
      </div>

      {scenes.map((s, i) => (
        <div key={s.key} style={box}>
          <div style={{ marginBottom: 6 }}>ឈុត {i + 1} · Scene {i + 1}</div>
          <label style={{ fontSize: 13 }}>🖼 រូប <input style={inp} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => set(s.key, { image: e.target.files?.[0] ?? null })} /></label>
          <label style={{ fontSize: 13 }}>🎙 សំឡេង <input style={inp} type="file" accept="audio/wav,audio/mpeg,audio/ogg" onChange={(e) => set(s.key, { voice: e.target.files?.[0] ?? null })} /></label>
          <textarea style={{ ...inp, width: "100%", minHeight: 60 }} value={s.text} onChange={(e) => set(s.key, { text: e.target.value })} placeholder="អត្ថបទបង្ហាញលើរូប (subtitle)…" />
          <input style={{ ...inp, width: 110 }} type="number" min={1} step={0.5} value={s.sec} onChange={(e) => set(s.key, { sec: e.target.value })} placeholder="វិនាទី (auto)" />
          <select style={inp} value={s.effect} onChange={(e) => set(s.key, { effect: e.target.value as Effect })} disabled={!s.image}>
            {EFFECTS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <div>
            <button style={{ ...btn, background: "#2a2a35" }} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button style={{ ...btn, background: "#2a2a35" }} onClick={() => move(i, 1)} disabled={i === scenes.length - 1}>↓</button>
            <button style={{ ...btn, background: "#7a2a2a" }} onClick={() => setScenes((all) => (all.length > 1 ? all.filter((x) => x.key !== s.key) : all))} disabled={scenes.length === 1}>🗑</button>
          </div>
        </div>
      ))}

      <button style={{ ...btn, background: "#2a2a35" }} onClick={() => setScenes((all) => [...all, blank()])} disabled={busy}>➕ បន្ថែមឈុត</button>
      <button style={btn} onClick={make} disabled={busy}>▶ បង្កើតវីដេអូ · Create</button>
      {msg && <div style={{ margin: "6px 0", color: msg.startsWith("⚠️") ? "#ff8a8a" : "#ddd" }}>{msg}</div>}
      {url && (
        <div style={box}>
          <video src={url} controls style={{ width: "100%", borderRadius: 8 }} />
          <a href={url} download="khoem-story.mp4" style={{ ...btn, display: "inline-block", textDecoration: "none", marginTop: 6 }}>⬇ Download MP4</a>
          {info && <div style={{ fontSize: 13, opacity: 0.8 }}>{info}</div>}
        </div>
      )}
    </div>
  );
}
