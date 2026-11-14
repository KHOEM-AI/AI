import Ico from "./UiIcon";
import { useEffect, useRef, useState } from "react";
import { iqaiSlideshow, iqaiTts, uploadMedia } from "../api/client";

const box: React.CSSProperties = {
  background: "rgba(79,124,255,0.09)",
  border: "1px solid rgba(79,124,255,0.3)",
  borderRadius: 10,
  padding: 12,
  marginTop: 10,
};
const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: 10,
  borderRadius: 8,
  marginTop: 6,
  marginBottom: 10,
};
const btn: React.CSSProperties = {
  padding: "10px 16px",
  border: 0,
  borderRadius: 8,
  background: "#4f7cff",
  color: "#fff",
  marginTop: 8,
};
const errorText = (e: unknown) =>
  e instanceof Error ? e.message : String(e);

function splitScenes(text: string, count: number): string[] {
  const clean = text.trim();
  const sentences = clean
    .split(/(?<=[.!?។។])\s+|\n+/u)
    .map((x) => x.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= 300) {
      chunks.push(sentence);
      continue;
    }

    let rest = sentence;
    while (rest.length > 300) {
      let cut = rest.lastIndexOf(" ", 300);
      if (cut < 120) cut = 300;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) chunks.push(rest);
  }

  if (chunks.length <= count) return chunks;

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const start = Math.floor((i * chunks.length) / count);
    const end = Math.floor(((i + 1) * chunks.length) / count);
    result.push(chunks.slice(start, end).join(" ").slice(0, 300));
  }
  return result;
}

function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    audio.preload = "metadata";

    const cleanup = () => {
      URL.revokeObjectURL(url);
      audio.removeAttribute("src");
      audio.load();
    };

    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      cleanup();
      if (Number.isFinite(duration) && duration > 0) resolve(duration);
      else reject(new Error("មិនអាចអានរយៈពេលសំឡេង WAV បានទេ"));
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error("មិនអាចអានឯកសារសំឡេង WAV បានទេ"));
    };
    audio.src = url;
  });
}

export default function AiAutoCreatePanel() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState<"km" | "en">("km");
  const [photos, setPhotos] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [video, setVideo] = useState<Blob | null>(null);
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const urlRef = useRef("");

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function generate() {
    if (!text.trim()) {
      setError("សូមបញ្ចូលអត្ថបទជាមុនសិន");
      return;
    }
    if (text.trim().length > 1000) {
      setError("អត្ថបទមិនអាចលើស 1,000 តួអក្សរទេ");
      return;
    }
    if (photos.length < 1 || photos.length > 20) {
      setError("សូមជ្រើសរើសរូបភាពពី 1 ដល់ 20 សន្លឹក");
      return;
    }

    setBusy(true);
    setError("");
    setStatus("កំពុងបង្កើតសំឡេង AI...");
    setSaved(false);

    try {
      const audioBlob = await iqaiTts(text.trim(), lang);

      setStatus("កំពុងវាស់រយៈពេលសំឡេង...");
      const audioDuration = await getAudioDuration(audioBlob);
      const secondsPerSlide = Math.ceil(audioDuration / photos.length);

      if (secondsPerSlide > 15) {
        throw new Error(
          `សំឡេងមានរយៈពេល ${Math.ceil(audioDuration)} វិនាទី។ សូមបន្ថែមរូបភាព ឬកាត់បន្ថយអត្ថបទ ដើម្បីឱ្យមួយរូបភាពមិនលើស 15 វិនាទី។`
        );
      }

      setStatus("កំពុងរក្សាទុកសំឡេង និងរូបភាព...");
      const audioMeta = await uploadMedia(audioBlob, "auto-narration.wav");

      const imageIds: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        setStatus(`កំពុងផ្ទុករូបភាព ${i + 1}/${photos.length}...`);
        const item = await uploadMedia(photos[i], photos[i].name);
        imageIds.push(item.id);
      }

      const captions = splitScenes(text, photos.length);

      setStatus("កំពុង Render វីដេអូ MP4...");
      const result = await iqaiSlideshow({
        ids: imageIds,
        captions,
        secondsPerSlide,
        effect: "zoom-in",
        audioId: audioMeta.id,
      });

      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(result);
      setVideo(result);
      setUrl(urlRef.current);
      setStatus("បង្កើតវីដេអូបានជោគជ័យ!");
    } catch (e) {
      setError(errorText(e));
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!video || busy) return;
    setBusy(true);
    setError("");
    setStatus("កំពុងរក្សាទុកក្នុង Library...");
    try {
      await uploadMedia(
        video,
        `ai-auto-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.mp4`
      );
      setSaved(true);
      setStatus("បានរក្សាទុកក្នុង Library រួចរាល់!");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={box}>
      <h3 style={{ marginTop: 0 }}><Ico n="auto" />AI Auto Create</h3>
      <p>បង្កើតវីដេអូពីអត្ថបទ រូបភាព សំឡេងនិយាយ និង Subtitle។</p>

      <label>ភាសាសំឡេង · Voice language</label>
      <select
        style={input}
        value={lang}
        disabled={busy}
        onChange={(e) => setLang(e.target.value as "km" | "en")}
      >
        <option value="km">🇰🇭 ខ្មែរ · Khmer</option>
        <option value="en">🇺🇸 English</option>
      </select>

      <label>អត្ថបទសាច់រឿង · Story / Narration (≤ 1,000)</label>
      <textarea
        style={{ ...input, minHeight: 120, resize: "vertical" }}
        value={text}
        maxLength={1000}
        disabled={busy}
        onChange={(e) => setText(e.target.value)}
        placeholder="សរសេររឿង ឬអត្ថបទដែលចង់ឱ្យ AI និយាយ..."
      />
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: -6 }}>
        {text.length}/1000
      </div>

      <label>រូបភាពសម្រាប់ Scene · Images (1–20)</label>
      <input
        style={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        disabled={busy}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          setPhotos(files.slice(0, 20));
          setError(files.length > 20 ? "អាចជ្រើសរើសបានត្រឹម 20 រូបភាពប៉ុណ្ណោះ" : "");
        }}
      />
      <div style={{ fontSize: 13, opacity: 0.75 }}>
        បានជ្រើសរើស {photos.length}/20 រូបភាព
      </div>

      <button
        style={{ ...btn, width: "100%" }}
        disabled={busy || !text.trim() || photos.length < 1 || photos.length > 20}
        onClick={() => void generate()}
      >
        <Ico n="auto" />បង្កើតវីដេអូដោយស្វ័យប្រវត្តិ
      </button>

      {busy && <p>{status}</p>}
      {!busy && status && <p>{status}</p>}
      {error && <p style={{ color: "#ff7777" }}><Ico n="warn" />{error}</p>}

      {url && (
        <div style={{ marginTop: 12 }}>
          <video
            controls
            playsInline
            src={url}
            style={{ width: "100%", maxHeight: 360, borderRadius: 8 }}
          />
          <button
            style={btn}
            disabled={busy || saved}
            onClick={() => void save()}
          >
            {saved ? <><Ico n="check" />បានរក្សាទុករួច</> : <><Ico n="cloud" />Save to Library</>}
          </button>
          <a
            href={url}
            download="khoem-ai-auto-create.mp4"
            style={{ ...btn, display: "inline-block", textDecoration: "none" }}
          >
            <Ico n="download" />ទាញយក MP4
          </a>
        </div>
      )}
    </div>
  );
}
