import { useState } from "react";
import { iqaiInspectAudio, iqaiInspectImage, iqaiInspectVideo } from "../api/client";
import SoundLibrary from "./SoundLibrary";

// File info (audio / image / video) and the sound library, moved here from the Emotion page.
const box: React.CSSProperties = { background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 12, marginBottom: 12 };

export default function MediaTools() {
  const [fileInfo, setFileInfo] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

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
    <div style={{ marginTop: 12 }}>
      <div style={box}>
        <div style={{ marginBottom: 6 }}>ព័ត៌មានឯកសារ · File info (សំឡេង Audio WAV · រូបភាព Image · វីដេអូ Video)</div>
        <input type="file" accept="audio/*,image/*,video/*" disabled={busy} onChange={(e) => runFile(e.target.files?.[0])} />
        {fileInfo && <pre style={{ marginTop: 8, fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{fileInfo}</pre>}
        {busy && <div>កំពុងដំណើរការ... · Working...</div>}
        {err && <div style={{ color: "#ff8a8a" }}>{err}</div>}
      </div>
      <SoundLibrary />
    </div>
  );
}
