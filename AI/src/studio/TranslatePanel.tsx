import { useRef, useState } from "react";

const LANG_BASE = "/l10n";
const MAX_CHARS = 200;

const LANGS = [
  { code: "km", label: "ខ្មែរ" },
  { code: "en", label: "English (US)" },
  { code: "zh", label: "中文" },
] as const;

type Code = (typeof LANGS)[number]["code"];

interface Match {
  key: string;
  source: "ui" | "color";
  original: string;
  text: string;
  missing: boolean;
}

interface Result {
  found: boolean;
  matches: Match[];
  suggestions: Match[];
}

function detect(s: string): Code {
  if (/[\u1780-\u17FF]/.test(s)) return "km";
  if (/[\u3400-\u9FFF]/.test(s)) return "zh";
  return "en";
}

export default function TranslatePanel({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState("");
  const [to, setTo] = useState<Code>("km");
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const ctl = useRef<AbortController | null>(null);

  async function run(override?: string) {
    const src = (override ?? text).trim();
    if (!src || busy) return;
    if (override !== undefined) setText(src);
    setErr("");
    setRes(null);
    setCopied(false);
    const from = detect(src);
    if (from === to) {
      setErr("ភាសាដើម និងភាសាគោលដៅដូចគ្នា សូមជ្រើសភាសាផ្សេង");
      return;
    }
    setBusy(true);
    const c = new AbortController();
    ctl.current = c;
    const timer = setTimeout(() => c.abort(), 15000);
    try {
      const url = `${LANG_BASE}/api/dictionary?q=${encodeURIComponent(src)}&from=${from}&to=${to}`;
      const r = await fetch(url, { signal: c.signal });
      const body = await r.json().catch(() => null);
      if (!r.ok || !body || body.success !== true) {
        const m = body && body.error ? (typeof body.error === "string" ? body.error : body.error.message) : "";
        throw new Error(m || `សំណើមិនជោគជ័យ (${r.status})`);
      }
      setRes({
        found: Boolean(body.data.found),
        matches: body.data.matches ?? [],
        suggestions: body.data.suggestions ?? [],
      });
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
    const first = res?.matches.find((m) => !m.missing);
    if (!first) return;
    try {
      await navigator.clipboard.writeText(first.text);
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
      <h2 style={{ margin: "0 0 12px" }}>🌐 បកប្រែ · Translate · 翻译</h2>
      <input
        style={box}
        placeholder="វាយពាក្យ ឬឃ្លា (ឧ. Save, ក្រហម, 保存)..."
        value={text}
        maxLength={MAX_CHARS}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") void run(); }}
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
        <button className="ks-btn ks-primary" disabled={busy || !text.trim()} onClick={() => void run()}>
          {busy ? "កំពុងស្វែងរក..." : "បកប្រែ"}
        </button>
      </div>
      {err && <p className="ks-msg" role="alert">{err}</p>}
      {res && res.found && (
        <div style={{ marginTop: 14 }}>
          {res.matches.map((m, i) => (
            <div key={m.key + i} style={{ ...box, marginBottom: 8 }}>
              <div style={{ fontSize: 22 }}>{m.missing ? "— មិនទាន់មានភាសានេះ" : m.text}</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                {m.original} · {m.source === "color" ? "ពណ៌" : "ឃ្លាកម្មវិធី"}
              </div>
            </div>
          ))}
          <button className="ks-btn" onClick={() => void copy()}>{copied ? "បានចម្លង ✓" : "ចម្លង"}</button>
        </div>
      )}
      {res && !res.found && (
        <div style={{ marginTop: 14 }}>
          <p>មិនទាន់ស្គាល់ពាក្យ ឬឃ្លានេះក្នុងវចនានុក្រម KHOEM_AI</p>
          {res.suggestions.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span>ប្រហែលជា៖</span>
              {res.suggestions.map((s, i) => (
                <button key={s.key + i} className="ks-btn" onClick={() => void run(s.original)}>{s.original}</button>
              ))}
            </div>
          )}
        </div>
      )}
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 16 }}>
        វចនានុក្រមមានឃ្លាក្នុងកម្មវិធី និងឈ្មោះពណ៌ ពីទំព័រ KHOEM_AI។ មិនបកអត្ថបទសេរីទេ។
      </p>
    </div>
  );
}
