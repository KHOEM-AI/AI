import Ico from "./UiIcon";
import { useEffect, useRef, useState } from "react";
import { iqaiCancelJob, iqaiContentUrl, listMedia } from "../api/client";
import { runJob } from "../api/runJob";

// Finish a video that is already in the library: add narration / music (video.mix) and subtitles
// (video.subtitle). Each step is a background job; its result is a new library item that you can
// use as the source of the next step (chaining).

const input: React.CSSProperties = { borderRadius: 8, padding: 8, fontSize: 15, marginRight: 6, marginBottom: 6 };
const btn: React.CSSProperties = { padding: "8px 14px", borderRadius: 8, border: "none", background: "#4f7cff", color: "#fff", fontSize: 15, marginRight: 8, marginTop: 4 };
const soft: React.CSSProperties = { ...btn, background: "rgba(255,255,255,0.14)" };
const card: React.CSSProperties = { background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 10, marginTop: 10 };

type Item = { id: string; type?: string; filename?: string; size?: number };
type Cue = { start: number; end: number; text: string };

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const label = (m: Item) => `${m.filename || m.id.slice(0, 8)}${m.size ? ` · ${(m.size / 1048576).toFixed(1)} MB` : ""}`;

export default function FinishTab() {
  const [items, setItems] = useState<Item[]>([]);
  const [src, setSrc] = useState("");
  const [narr, setNarr] = useState("");
  const [music, setMusic] = useState("");
  const [narrVol, setNarrVol] = useState(1);
  const [musicVol, setMusicVol] = useState(0.25);
  const [duck, setDuck] = useState(true);
  const [keepOriginal, setKeepOriginal] = useState(false);
  const [cueMode, setCueMode] = useState<"lines" | "srt">("lines");
  const [lines, setLines] = useState("");
  const [lineSec, setLineSec] = useState(3);
  const [srt, setSrt] = useState("");
  const [fontSize, setFontSize] = useState(40);
  const [color, setColor] = useState("#ffffff");
  const [position, setPosition] = useState("bottom");
  const [busy, setBusy] = useState(false);
  const [what, setWhat] = useState("");
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [result, setResult] = useState("");
  const aliveRef = useRef(true);
  const stopRef = useRef(false);

  async function refresh() {
    try { setItems((await listMedia()) as unknown as Item[]); } catch (e) { setErr(msg(e)); }
  }
  useEffect(() => { aliveRef.current = true; void refresh(); return () => { aliveRef.current = false; }; }, []);

  const videos = items.filter((m) => m.type === "video");
  const audios = items.filter((m) => m.type === "audio");

  async function run(type: string, params: Record<string, unknown>, title: string) {
    setBusy(true); setErr(""); setOk(""); setResult(""); setProgress(0); setJobId(""); setWhat(title);
    stopRef.current = false;
    try {
      const job = await runJob(type, params, {
        onId: (id) => { if (aliveRef.current) setJobId(id); },
        onProgress: (p) => { if (aliveRef.current) setProgress(p); },
        stop: () => stopRef.current,
      });
      if (!aliveRef.current) return;
      if (job.status === "failed") throw new Error(job.error ? job.error.message : "Job failed");
      if (job.status === "cancelled") setOk("បានបោះបង់ · Cancelled");
      if (job.status === "done" && job.result) {
        setResult(job.result.mediaId);
        setOk("ចប់ហើយ · Done (រក្សាទុកក្នុងបណ្ណាល័យ · saved in the library)");
        void refresh();
      }
    } catch (e) { if (aliveRef.current) setErr(msg(e)); }
    if (aliveRef.current) { setBusy(false); setJobId(""); setWhat(""); }
  }

  const mixReady = !!src && (!!narr || !!music);
  function mix() {
    const params: Record<string, unknown> = {
      mediaId: src, narrationVolume: narrVol, musicVolume: musicVol, duck, originalVolume: keepOriginal ? 1 : 0,
    };
    if (narr) params.narrationId = narr;
    if (music) params.musicId = music;
    void run("video.mix", params, "កំពុងលាយសំឡេង · Mixing audio...");
  }

  function buildCues(): Cue[] {
    return lines.split("\n").map((t) => t.trim()).filter(Boolean)
      .map((text, i) => ({ start: i * lineSec, end: (i + 1) * lineSec, text }));
  }
  const subReady = !!src && (cueMode === "srt" ? srt.trim().length > 0 : buildCues().length > 0);
  function subtitle() {
    const params: Record<string, unknown> = { mediaId: src, fontSize, color, position };
    if (cueMode === "srt") params.srt = srt; else params.cues = buildCues();
    void run("video.subtitle", params, "កំពុងដាក់ចំណងជើងរង · Adding subtitles...");
  }

  async function cancel() {
    stopRef.current = true;
    if (jobId) { try { await iqaiCancelJob(jobId); } catch (e) { setErr(msg(e)); } }
  }

  const pct = Math.round(progress * 100);
  const pick = (value: string, set: (v: string) => void, list: Item[], none: string) => (
    <select style={{ ...input, maxWidth: "100%" }} value={value} onChange={(e) => set(e.target.value)}>
      <option value="">{none}</option>
      {list.map((m) => <option key={m.id} value={m.id}>{label(m)}</option>)}
    </select>
  );

  return (
    <div style={{ marginTop: 8 }}>
      <div style={card}>
        <div>១. ជ្រើសវីដេអូ · Choose a video from the library ({videos.length})</div>
        {pick(src, setSrc, videos, "— ជ្រើស · choose —")}
        <button style={soft} onClick={() => void refresh()}><Ico n="refresh" only /></button>
        {videos.length === 0 && <div style={{ opacity: 0.8, fontSize: 13 }}>មិនទាន់មានវីដេអូ · No video yet. Make one in Story, or upload it in the Library.</div>}
        {src && <video controls src={iqaiContentUrl(src)} style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, display: "block", marginTop: 6 }} />}
      </div>

      <div style={card}>
        <div>២. សំឡេង · Audio (narration / music)</div>
        <div>សំឡេងអាន · Narration {pick(narr, setNarr, audios, "— គ្មាន · none —")}</div>
        <div>តន្ត្រី · Music {pick(music, setMusic, audios, "— គ្មាន · none —")}</div>
        <div>
          <label>អាន · Narr. vol <input style={{ ...input, width: 60 }} type="number" step="0.1" min={0} max={4} value={narrVol}
            onChange={(e) => setNarrVol(Math.max(0, Math.min(4, Number(e.target.value) || 0)))} /></label>
          <label>តន្ត្រី · Music vol <input style={{ ...input, width: 60 }} type="number" step="0.05" min={0} max={4} value={musicVol}
            onChange={(e) => setMusicVol(Math.max(0, Math.min(4, Number(e.target.value) || 0)))} /></label>
        </div>
        <label><input type="checkbox" checked={duck} onChange={(e) => setDuck(e.target.checked)} /> បន្ថយតន្ត្រីពេលអាន · Lower music while speaking</label>{" "}
        <label><input type="checkbox" checked={keepOriginal} onChange={(e) => setKeepOriginal(e.target.checked)} /> រក្សាសំឡេងដើម · Keep original sound</label>
        <div><button style={btn} disabled={busy || !mixReady} onClick={mix}>▶ លាយសំឡេង · Mix</button></div>
      </div>

      <div style={card}>
        <div>៣. ចំណងជើងរង · Subtitles</div>
        <button style={cueMode === "lines" ? btn : soft} onClick={() => setCueMode("lines")}>បន្ទាត់ · Lines</button>
        <button style={cueMode === "srt" ? btn : soft} onClick={() => setCueMode("srt")}>SRT</button>
        {cueMode === "lines" ? (
          <>
            <textarea style={{ ...input, width: "95%", minHeight: 90, display: "block" }} value={lines}
              placeholder={"មួយបន្ទាត់ = មួយចំណងជើង · one line = one subtitle"} onChange={(e) => setLines(e.target.value)} />
            <label>វិនាទី/បន្ទាត់ · Seconds per line <input style={{ ...input, width: 60 }} type="number" min={1} max={30} value={lineSec}
              onChange={(e) => setLineSec(Math.max(1, Math.min(30, Number(e.target.value) || 3)))} /></label>
          </>
        ) : (
          <textarea style={{ ...input, width: "95%", minHeight: 120, display: "block" }} value={srt}
            placeholder={"1\n00:00:00,000 --> 00:00:03,000\nសួស្តី"} onChange={(e) => setSrt(e.target.value)} />
        )}
        <div>
          <label>អក្សរ · Size <input style={{ ...input, width: 60 }} type="number" min={12} max={120} value={fontSize}
            onChange={(e) => setFontSize(Math.max(12, Math.min(120, Number(e.target.value) || 40)))} /></label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />{" "}
          <select style={input} value={position} onChange={(e) => setPosition(e.target.value)}>
            <option value="bottom">ក្រោម · bottom</option>
            <option value="middle">កណ្តាល · middle</option>
            <option value="top">លើ · top</option>
          </select>
        </div>
        <button style={btn} disabled={busy || !subReady} onClick={subtitle}>▶ ដាក់ចំណងជើងរង · Add subtitles</button>
      </div>

      {busy && (
        <div style={{ marginTop: 8 }}>
          <div>{what} {jobId && `${pct}%`}</div>
          {jobId && (
            <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.14)", overflow: "hidden", marginTop: 4 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "#4f7cff", transition: "width 0.4s" }} />
            </div>
          )}
          {jobId && <button style={soft} onClick={() => void cancel()}>■ បោះបង់ · Cancel</button>}
        </div>
      )}
      {err && <div style={{ color: "#ff8a8a", marginTop: 6 }}><Ico n="warn" />{err}</div>}
      {ok && <div style={{ color: "#8affb0", marginTop: 6 }}>{ok}</div>}
      {result && (
        <div style={{ marginTop: 8 }}>
          <video controls src={iqaiContentUrl(result)} style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 8 }} />
          <div>
            <button style={btn} onClick={() => setSrc(result)}><Ico n="refresh" />ប្រើជាប្រភពបន្ទាប់ · Use as the next source</button>
            <a href={iqaiContentUrl(result)} download="khoem-finished.mp4" style={{ ...soft, textDecoration: "none", display: "inline-block" }}><Ico n="download" />ទាញយក</a>
          </div>
        </div>
      )}
    </div>
  );
}
