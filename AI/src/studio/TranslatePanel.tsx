import { useRef, useState } from "react";

const LANGS = [
  { code: "km", label: "ខ្មែរ", name: "Khmer" },
  { code: "en", label: "English", name: "English" },
  { code: "zh", label: "中文", name: "Simplified Chinese" },
] as const;

const MAX_CHARS = 2000;

export default function TranslatePanel({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState("");
  const [to, setTo] = useState<string>("km");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const ctl = useRef<AbortController | null>(null);

  async function run() {
    const src = text.trim();
    if (!src || busy) return;
    const lang = LANGS.find((l) => l.code === to) ?? LANGS[0];
    setBusy(true);
    setErr("");
    setOut("");
    setCopied(false);
    const c = new AbortController();
    ctl.current = c;
    const timer = setTimeout(() => c.abort(), 60000);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: c.signal,
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Translate the following text into ${lang.name}. Reply with the translation only, with no explanation and no quotation marks.\n\n${src}`,
            },
          ],
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `សំណើមិនជោគជ័យ (${res.status})`);
      }
      const data = await res.json();
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("គ្មានចម្លើយពី AI");
      setOut(data.reply.trim());
    } catch (e) {
      setErr(
        e instanceof DOMException && e.name === "AbortError"
          ? "យូរពេក សូមព្យាយាមម្តងទៀត"
          : e instanceof Error
            ? e.message
            : "មានបញ្ហាមិនស្គាល់មូលហេតុ",
      );
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
    } catch {
      setErr("ចម្លងមិនបាន សូមជ្រើសអត្ថបទចម្លងដោយដៃ");
    }
  }

  const box: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)",
    color: "inherit", font: "inherit", fontSize: 16,
  };

  return (
    <div style={{ padding: 12, maxWidth: 720, margin: "0 auto", color: "#eee" }}>
      <button className="ks-btn" onClick={onBack} style={{ marginBottom: 12 }}>← Home</button>
      <h2 style={{ margin: "0 0 12px" }}>🌐 បកប្រែ AI</h2>
      <textarea
        style={{ ...box, minHeight: 120, resize: "vertical" }}
        placeholder="វាយអត្ថបទដែលចង់បកប្រែ..."
        value={text}
        maxLength={MAX_CHARS}
        onChange={(e) => setText(e.target.value)}
      />
      <div style={{ fontSize: 12, opacity: 0.6, margin: "4px 0 10px" }}>{text.length}/{MAX_CHARS}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span>បកប្រែទៅ៖</span>
        {LANGS.map((l) => (
          <button key={l.code} className={`ks-btn${to === l.code ? " ks-primary" : ""}`} onClick={() => setTo(l.code)}>
            {l.label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="ks-btn ks-primary" disabled={busy || !text.trim()} onClick={run}>
          {busy ? "កំពុងបកប្រែ..." : "បកប្រែ"}
        </button>
      </div>
      {err && <p className="ks-msg" role="alert">{err}</p>}
      {out && (
        <div style={{ marginTop: 14 }}>
          <div style={{ ...box, whiteSpace: "pre-wrap", minHeight: 80 }}>{out}</div>
          <button className="ks-btn" onClick={copy} style={{ marginTop: 8 }}>{copied ? "បានចម្លង ✓" : "ចម្លង"}</button>
        </div>
      )}
    </div>
  );
}
