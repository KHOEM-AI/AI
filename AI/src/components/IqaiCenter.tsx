import { useState } from "react";
import {
  iqaiAnalyzeEmotion,
  iqaiInspectAudio,
  iqaiInspectImage,
  iqaiInspectVideo,
} from "../api/client";
import type { IqaiEmotion } from "../api/client";

const EMO: Record<string, string> = {
  joy: "😊 សប្បាយ",
  sadness: "😢 សោកសៅ",
  anger: "😠 ខឹង",
  fear: "😨 ខ្លាច",
  love: "❤️ ស្រឡាញ់",
  surprise: "😮 ភ្ញាក់ផ្អើល",
  neutral: "😐 ធម្មតា",
};

const box: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: 10,
  padding: 12,
  marginBottom: 12,
};
const btn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "#4f7cff",
  color: "#fff",
  fontSize: 15,
};

export default function IqaiCenter({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [emo, setEmo] = useState<IqaiEmotion | null>(null);
  const [fileInfo, setFileInfo] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

  async function runEmotion() {
    if (!text.trim()) return;
    setBusy(true); setErr(""); setEmo(null);
    try { setEmo(await iqaiAnalyzeEmotion(text)); }
    catch (e) { setErr(msg(e)); }
    setBusy(false);
  }

  async function runFile(file: File | undefined) {
    if (!file) return;
    setBusy(true); setErr(""); setFileInfo("");
    try {
      let info: unknown;
      if (file.type.startsWith("audio/")) info = await iqaiInspectAudio(file);
      else if (file.type.startsWith("image/")) info = await iqaiInspectImage(file);
      else if (file.type.startsWith("video/")) info = await iqaiInspectVideo(file);
      else throw new Error("ប្រភេទឯកសារមិនគាំទ្រ (ត្រូវការ សំឡេង រូបភាព ឬ វីដេអូ)");
      setFileInfo(JSON.stringify(info, null, 2));
    } catch (e) { setErr(msg(e)); }
    setBusy(false);
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, overflow: "auto" }}
      onClick={onClose}
    >
      <div
        style={{ maxWidth: 520, margin: "20px auto", background: "#1a1a1f", color: "#eee", borderRadius: 12, padding: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <b style={{ fontSize: 18 }}>🎭 IQ-AI Center</b>
          <button style={{ ...btn, background: "#444" }} onClick={onClose}>បិទ</button>
        </div>

        <div style={box}>
          <div style={{ marginBottom: 6 }}>សញ្ញាអារម្មណ៍ (អត្ថបទខ្មែរ)</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            style={{ width: "100%", boxSizing: "border-box", borderRadius: 8, padding: 8, fontSize: 15 }}
            placeholder="សរសេរអត្ថបទនៅទីនេះ..."
          />
          <button style={{ ...btn, marginTop: 8 }} disabled={busy} onClick={runEmotion}>វិភាគ</button>
          {emo && (
            <div style={{ marginTop: 8, fontSize: 16 }}>
              {EMO[emo.emotion] || emo.emotion} · {Math.round(emo.confidence * 100)}%
            </div>
          )}
        </div>

        <div style={box}>
          <div style={{ marginBottom: 6 }}>ព័ត៌មានឯកសារ (សំឡេង WAV · រូបភាព · វីដេអូ)</div>
          <input
            type="file"
            accept="audio/*,image/*,video/*"
            disabled={busy}
            onChange={(e) => runFile(e.target.files?.[0])}
          />
          {fileInfo && (
            <pre style={{ marginTop: 8, fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{fileInfo}</pre>
          )}
        </div>

        {busy && <div>កំពុងដំណើរការ...</div>}
        {err && <div style={{ color: "#ff8a8a" }}>⚠️ {err}</div>}
      </div>
    </div>
  );
}
