/**
 * App.tsx — ទំព័រ "AI" (React + TypeScript, Vite)
 * និយាយមួយប្រយោគ → AI សរសេរកូដ / វិភាគ / ឆ្លើយ
 *
 * ត្រូវការ server.mjs រត់ក្នុង Termux (ច្រក 8787) ដើម្បីភ្ជាប់ទៅ Claude API។
 * សោ API មិនត្រូវដាក់ក្នុងឯកសារនេះទេ។
 */
import { useEffect, useRef, useState } from "react";

/* ───────────── Config ───────────── */
const API_URL = "http://127.0.0.1:8787/api/chat";
const STORE_KEY = "ai-page:v1";
const MAX_BYTES = 100_000;
const MAX_FILE_BYTES = 30_000;
const FENCE = "`".repeat(3);

const RULES = [
  'អ្នកគឺ "AI" ជាជំនួយការសរសេរកូដ និងវិភាគសម្រាប់អ្នកប្រើភាសាខ្មែរ ដែលសរសេរកូដលើទូរស័ព្ទតាម Termux និង GitHub។',
  "ច្បាប់៖",
  "- ឆ្លើយជាភាសាខ្មែរជាមូលដ្ឋាន។ កូដ ឈ្មោះអថេរ និងពាក្យបញ្ជាជាអង់គ្លេស។ ប្រើភាសាសាមញ្ញ ខ្លី ងាយអានលើទូរស័ព្ទ។",
  "- កូដត្រូវពេញលេញ អាចចម្លងទៅរត់បាន ដាក់ក្នុង code fence ដែលមានឈ្មោះភាសា ហើយប្រាប់ឈ្មោះឯកសារមុន code block។",
  "- ពេលវិភាគកូដ៖ ចង្អុលឈ្មោះឯកសារ/បន្ទាត់ បែងចែក កំហុស, ហានិភ័យ, ដំណោះស្រាយ។",
  "- ពេលរៀបរចនាសម្ព័ន្ធ project៖ បង្ហាញជា tree ហើយផ្តល់ពាក្យបញ្ជា Termux (mkdir, mv) ដែលអាចចម្លងបាន។",
  "- កុំអះអាងថាបានរត់ ឬសាកល្បងកូដ បើមិនបានរត់ជាក់ស្តែង។ បើមិនប្រាកដ ត្រូវប្រាប់ត្រង់ៗ។ កុំប្រឌិត។",
  "- បើសំណើមិនច្បាស់ពេក សួរតែមួយសំណួរខ្លី ប៉ុន្តែបើអាចសន្មតបានសមហេតុផល ចូរធ្វើមុន ហើយប្រាប់ការសន្មតរបស់អ្នក។",
  "- កុំសុំ ឬបង្ហាញ password, token, API key។ បើឃើញក្នុងកូដ ត្រូវព្រមានឱ្យដកចេញ។",
].join("\n");

const EXAMPLES: Array<{ text: string; auto: boolean }> = [
  { text: "សរសេរ script Python ដែលអានឯកសារ CSV ហើយបង្ហាញលទ្ធផលសរុប", auto: true },
  { text: "រៀបរចនាសម្ព័ន្ធ folder សម្រាប់ project React + TypeScript ដែលរត់លើ Termux", auto: true },
  { text: "ជួយពន្យល់ error នេះ ហើយប្រាប់របៀបកែ៖\n", auto: false },
];

/* ───────────── Types ───────────── */
type Role = "user" | "assistant";
type Tier = "quick" | "default" | "complex";
type Phase = "ready" | "thinking" | "writing";

interface Turn {
  role: Role;
  content: string; // អ្វីដែលផ្ញើទៅ AI (រួមទាំងឯកសារ)
  display?: string; // អ្វីដែលបង្ហាញក្នុង bubble របស់អ្នកប្រើ
  note?: string;
}
interface Attach {
  name: string;
  text: string;
}
type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

interface StreamEvent {
  type: string;
  delta?: { type?: string; text?: string; stop_reason?: string };
  error?: { message?: string };
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/* Web Speech API (មិនមាន type ក្នុង TS លំនាំដើម) */
interface SREvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface SRLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SRCtor = new () => SRLike;
const SRClass: SRCtor | undefined = (() => {
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
})();

/* ───────────── Helpers ───────────── */
function loadTurns(): Turn[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const v: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(v)) return [];
    return v.filter(
      (t): t is Turn =>
        !!t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string",
    );
  } catch {
    return [];
  }
}

function budgeted(list: Turn[]): Array<{ role: Role; content: string }> {
  const enc = new TextEncoder();
  let total = enc.encode(RULES).length;
  const out: Array<{ role: Role; content: string }> = [];
  for (let i = list.length - 1; i >= 0; i--) {
    const n = enc.encode(list[i].content).length;
    if (total + n > MAX_BYTES) break;
    total += n;
    out.unshift({ role: list[i].role, content: list[i].content });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* ប្រើវិធីជំនួស */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function errorText(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return "សោ API មិនត្រឹមត្រូវ។ សូមពិនិត្យ ANTHROPIC_API_KEY ក្នុង Termux។";
    if (e.status === 429) return "ប្រើច្រើនពេក។ សូមរង់ចាំបន្តិច រួចចុចផ្ញើម្តងទៀត។";
    return `ម៉ាស៊ីនបម្រើឆ្លើយកំហុស (${e.status})៖ ${e.message}`;
  }
  return "ភ្ជាប់ម៉ាស៊ីនបម្រើមិនបាន។ សូមពិនិត្យថា node server.mjs កំពុងរត់ (ច្រក 8787)។";
}

/* ───────────── Markdown បែបសាមញ្ញ (មិនប្រើ innerHTML) ───────────── */
function Inline({ text }: { text: string }) {
  const segs = text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g).filter(Boolean);
  return (
    <>
      {segs.map((s, i) => {
        if (s.length > 2 && s.startsWith("`") && s.endsWith("`")) {
          return (
            <code className="ic" key={i}>
              {s.slice(1, -1)}
            </code>
          );
        }
        if (s.length > 4 && s.startsWith("**") && s.endsWith("**")) {
          return <strong key={i}>{s.slice(2, -2)}</strong>;
        }
        return <span key={i}>{s}</span>;
      })}
    </>
  );
}

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      blocks.push({ kind: "p", text: para.join("\n") });
      para = [];
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    let m: RegExpMatchArray | null;
    if (!line.trim()) {
      flush();
      continue;
    }
    if ((m = line.match(/^#{1,6}\s+(.*)$/))) {
      flush();
      blocks.push({ kind: "h", text: m[1] });
      continue;
    }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
      flush();
      const last = blocks[blocks.length - 1];
      if (last && last.kind === "ul") last.items.push(m[1]);
      else blocks.push({ kind: "ul", items: [m[1]] });
      continue;
    }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      flush();
      const last = blocks[blocks.length - 1];
      if (last && last.kind === "ol") last.items.push(m[1]);
      else blocks.push({ kind: "ol", items: [m[1]] });
      continue;
    }
    para.push(line);
  }
  flush();
  return blocks;
}

function Blocks({ text }: { text: string }) {
  return (
    <>
      {parseBlocks(text).map((b, i) => {
        if (b.kind === "h") {
          return (
            <h4 key={i}>
              <Inline text={b.text} />
            </h4>
          );
        }
        if (b.kind === "p") {
          return (
            <p key={i}>
              <Inline text={b.text} />
            </p>
          );
        }
        const items = b.items.map((it, j) => (
          <li key={j}>
            <Inline text={it} />
          </li>
        ));
        return b.kind === "ul" ? <ul key={i}>{items}</ul> : <ol key={i}>{items}</ol>;
      })}
    </>
  );
}

function CodeBlock({ raw }: { raw: string }) {
  const [label, setLabel] = useState("ចម្លង");
  let lang = "";
  let code = raw;
  const nl = raw.indexOf("\n");
  if (nl !== -1 && /^[\w+#.-]*\s*$/.test(raw.slice(0, nl))) {
    lang = raw.slice(0, nl).trim();
    code = raw.slice(nl + 1);
  }
  code = code.replace(/\n$/, "");
  const onCopy = async () => {
    const ok = await copyText(code);
    setLabel(ok ? "បានចម្លង" : "ចម្លងមិនបាន");
    window.setTimeout(() => setLabel("ចម្លង"), 1400);
  };
  return (
    <div className="code">
      <div className="code-bar">
        <span>{lang || "code"}</span>
        <button type="button" onClick={onCopy}>
          {label}
        </button>
      </div>
      <pre>{code}</pre>
    </div>
  );
}

function Md({ text }: { text: string }) {
  return (
    <>
      {text.split(FENCE).map((part, i) =>
        i % 2 === 1 ? <CodeBlock key={i} raw={part} /> : <Blocks key={i} text={part} />,
      )}
    </>
  );
}

/* ───────────── Component ───────────── */
export default function App() {
  const [turns, setTurns] = useState<Turn[]>(loadTurns);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<Attach[]>([]);
  const [live, setLive] = useState("");
  const [phase, setPhase] = useState<Phase>("ready");
  const [tier, setTier] = useState<Tier>("default");
  const [note, setNote] = useState("");
  const [listening, setListening] = useState(false);

  const busy = phase !== "ready";
  const ctlRef = useRef<AbortController | null>(null);
  const recRef = useRef<SRLike | null>(null);
  const msgsRef = useRef<HTMLElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const pickerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(turns.slice(-40)));
    } catch {
      /* មិនអីទេ */
    }
  }, [turns]);

  useEffect(() => {
    const m = msgsRef.current;
    if (m) m.scrollTop = m.scrollHeight;
  }, [turns, live, phase]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  async function send(override?: string) {
    if (busy) return;
    const draftText = override ?? input;
    const typed = draftText.trim();
    if (!typed && files.length === 0) return;

    const draftFiles = files;
    let content = typed;
    for (const a of draftFiles) {
      content += `\n\nឯកសារ ${a.name}:\n${FENCE}\n${a.text}\n${FENCE}`;
    }
    const userTurn: Turn = {
      role: "user",
      content,
      display: typed || "(ឯកសារ)",
      note: draftFiles.length ? "📎 " + draftFiles.map((a) => a.name).join(", ") : "",
    };
    const history = [...turns, userTurn];
    const payload = budgeted(history);
    const last = payload[payload.length - 1];
    if (!last || last.role !== "user" || last.content !== content) {
      setNote("សារ ឬឯកសារធំពេក។ សូមផ្ញើជាផ្នែកតូចៗ។");
      return;
    }

    setTurns(history);
    setInput("");
    setFiles([]);
    setNote("");
    setLive("");
    setPhase("thinking");

    const ctl = new AbortController();
    ctlRef.current = ctl;
    let text = "";
    let truncated = false;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ system: RULES, messages: payload, tier }),
        signal: ctl.signal,
      });
      if (!res.ok || !res.body) {
        let msg = res.statusText;
        try {
          const j = (await res.json()) as { error?: string };
          if (j.error) msg = j.error.slice(0, 200);
        } catch {
          /* ប្រើ statusText */
        }
        throw new ApiError(res.status, msg);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data) continue;
          let ev: StreamEvent;
          try {
            ev = JSON.parse(data) as StreamEvent;
          } catch {
            continue;
          }
          if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
            text += ev.delta.text ?? "";
            setPhase("writing");
            setLive(text);
          } else if (ev.type === "message_delta" && ev.delta?.stop_reason === "max_tokens") {
            truncated = true;
          } else if (ev.type === "error") {
            throw new ApiError(500, ev.error?.message ?? "កំហុសពី API");
          }
        }
      }
      if (!text) throw new ApiError(500, "មិនមានចម្លើយ។ សូមសួរឱ្យខ្លីជាងនេះ។");
      setTurns([...history, { role: "assistant", content: text }]);
      if (truncated) setNote("ចម្លើយត្រូវកាត់ខ្លី។ សូមសុំបន្ត ឬសួរឱ្យតូចជាងនេះ។");
    } catch (e) {
      const cancelled = e instanceof DOMException && e.name === "AbortError";
      if (text) {
        setTurns([...history, { role: "assistant", content: text }]);
      } else {
        // គ្មានចម្លើយ៖ ដកសារចេញពីប្រវត្តិ ហើយដាក់ត្រឡប់ទៅប្រអប់វិញ
        setTurns(turns);
        setInput(draftText);
        setFiles(draftFiles);
      }
      if (!cancelled) setNote(errorText(e));
    } finally {
      ctlRef.current = null;
      setLive("");
      setPhase("ready");
    }
  }

  function stop() {
    ctlRef.current?.abort();
  }

  function reset() {
    stop();
    setTurns([]);
    setNote("");
  }

  async function onPick(list: FileList | null) {
    const picked = Array.from(list ?? []);
    if (pickerRef.current) pickerRef.current.value = "";
    const added: Attach[] = [];
    for (const f of picked) {
      if (f.size > MAX_FILE_BYTES) {
        setNote(`${f.name} ធំពេក (លើស 30 KB)។ សូមផ្ញើតែផ្នែកចាំបាច់។`);
        continue;
      }
      try {
        const text = await f.text();
        if (text.includes("\u0000")) {
          setNote(`${f.name} មិនមែនឯកសារអក្សរទេ។`);
          continue;
        }
        added.push({ name: f.name, text });
      } catch {
        setNote(`អានឯកសារ ${f.name} មិនបាន។`);
      }
    }
    if (added.length) setFiles((prev) => [...prev, ...added]);
  }

  function toggleMic() {
    if (!SRClass) return;
    if (listening && recRef.current) {
      recRef.current.stop();
      return;
    }
    const rec = new SRClass();
    rec.lang = "km-KH";
    rec.interimResults = true;
    rec.continuous = false;
    const base = input ? input.trimEnd() + " " : "";
    rec.onresult = (ev) => {
      let t = "";
      for (let i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
      setInput(base + t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setNote("មិនអាចប្រើមីក្រូហ្វូនបានទេ។ សូមអនុញ្ញាតមីក្រូហ្វូន ឬវាយដោយដៃ។");
    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
      setNote("");
    } catch {
      /* មិនអីទេ */
    }
  }

  const statusText = phase === "thinking" ? "កំពុងគិត" : phase === "writing" ? "កំពុងសរសេរ" : "រួចរាល់";
  const canSend = input.trim().length > 0 || files.length > 0;

  return (
    <div className="ai-app">
      <style>{CSS}</style>
      <div className="app">
        <header className="head">
          <div className="brand">AI</div>
          <div className={`status${busy ? " busy" : ""}`} role="status" aria-live="polite">
            {statusText}
          </div>
          <select value={tier} onChange={(e) => setTier(e.target.value as Tier)} aria-label="កម្រិតគិត">
            <option value="quick">លឿន</option>
            <option value="default">ធម្មតា</option>
            <option value="complex">គិតជ្រៅ</option>
          </select>
          <button className="ghost" type="button" onClick={reset}>
            ចាប់ផ្តើមថ្មី
          </button>
        </header>

        <main className="msgs" ref={msgsRef}>
          {turns.length === 0 && phase === "ready" && (
            <section className="empty">
              <h1>និយាយមួយប្រយោគ ខ្ញុំសរសេរ ឬវិភាគកូដឱ្យ</h1>
              <p>អាចភ្ជាប់ឯកសារកូដ (📎) ឬនិយាយជាសំឡេង ដើម្បីឱ្យខ្ញុំវិភាគ។</p>
              <div className="chips">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.text}
                    type="button"
                    onClick={() => {
                      if (ex.auto) {
                        void send(ex.text);
                      } else {
                        setInput(ex.text);
                        taRef.current?.focus();
                      }
                    }}
                  >
                    {ex.text.trim()}
                  </button>
                ))}
              </div>
            </section>
          )}

          {turns.map((t, i) =>
            t.role === "user" ? (
              <div className="row user" key={i}>
                <div className="bubble user">
                  {t.display ?? t.content}
                  {t.note ? <span className="files">{t.note}</span> : null}
                </div>
              </div>
            ) : (
              <div className="row" key={i}>
                <div className="bubble ai">
                  <Md text={t.content} />
                </div>
              </div>
            ),
          )}

          {busy && (
            <div className="row">
              <div className="bubble ai">
                {live ? <Md text={live} /> : <span className="think">កំពុងគិត…</span>}
              </div>
            </div>
          )}
        </main>

        <div className="composer">
          {files.length > 0 && (
            <div className="files-row">
              {files.map((a, i) => (
                <span className="file-chip" key={a.name + i}>
                  {a.name}
                  <button
                    type="button"
                    aria-label={`ដក ${a.name}`}
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="box">
            <button className="icon" type="button" aria-label="ភ្ជាប់ឯកសារកូដ" onClick={() => pickerRef.current?.click()}>
              <svg viewBox="0 0 24 24">
                <path d="M21 11.5l-8.6 8.6a5.5 5.5 0 01-7.8-7.8l9-9a3.7 3.7 0 015.2 5.2l-9 9a1.8 1.8 0 01-2.6-2.6l8.3-8.3" />
              </svg>
            </button>
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              placeholder="និយាយមួយប្រយោគ ឧ. សរសេរ script ដាក់ឯកសារចូលថតតាមប្រភេទ"
              aria-label="សារ"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            {SRClass && (
              <button
                className={`icon${listening ? " on" : ""}`}
                type="button"
                aria-label="និយាយជាសំឡេង"
                onClick={toggleMic}
              >
                <svg viewBox="0 0 24 24">
                  <rect x="9" y="3" width="6" height="12" rx="3" />
                  <path d="M5 11a7 7 0 0014 0M12 18v3" />
                </svg>
              </button>
            )}
            <button
              className="icon send"
              type="button"
              aria-label={busy ? "បញ្ឈប់" : "ផ្ញើ"}
              disabled={!busy && !canSend}
              onClick={() => (busy ? stop() : void send())}
            >
              {busy ? (
                <svg className="stop" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="M4 12l16-8-6 16-3-7-7-1z" />
                </svg>
              )}
            </button>
          </div>
          <input
            ref={pickerRef}
            type="file"
            multiple
            hidden
            accept=".txt,.md,.js,.mjs,.ts,.tsx,.jsx,.py,.json,.html,.css,.sh,.cs,.java,.c,.cpp,.h,.go,.rs,.sql,.csv,.yml,.yaml,.toml,.xml"
            onChange={(e) => void onPick(e.target.files)}
          />
          <div className="note">
            {note || "ខ្ញុំអាចខុស — សូមសាកល្បងកូដមុនប្រើពិតប្រាកដ។ ការប្រើ API គិតលុយតាមការប្រើ។"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Styles ───────────── */
const CSS = `
:root{
  --bg:#EDF1EF; --surface:#FAFBFA; --ink:#16262B; --muted:#5D6F73; --line:#CBD6D3;
  --user:#2F3E9E; --user-ink:#FFFFFF; --accent:#B7791F;
  --code-bg:#14232A; --code-ink:#E4EDEE; --err:#B42318; --focus:#2F3E9E;
}
@media (prefers-color-scheme:dark){
  :root{
    --bg:#0F1A1E; --surface:#16262B; --ink:#E4EDEE; --muted:#8FA2A6; --line:#28393E;
    --user:#5468D4; --user-ink:#FFFFFF; --accent:#D9A441;
    --code-bg:#0A1215; --code-ink:#E4EDEE; --err:#F97066; --focus:#9FB0FF;
  }
}
html,body,#root{height:100%;margin:0}
body{background:var(--bg)}
.ai-app{
  height:100%;background:var(--bg);color:var(--ink);
  font-family:"Noto Sans Khmer","Khmer OS System","Khmer UI",system-ui,-apple-system,"Segoe UI",sans-serif;
  font-size:16px;line-height:1.7;
}
.ai-app *{box-sizing:border-box}
.app{height:100%;display:flex;flex-direction:column;max-width:760px;margin:0 auto}
.ai-app button,.ai-app select,.ai-app textarea{font:inherit;color:inherit}
.ai-app button:focus-visible,.ai-app select:focus-visible,.ai-app textarea:focus-visible{outline:3px solid var(--focus);outline-offset:2px}

.head{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line)}
.brand{font-size:30px;font-weight:700;letter-spacing:-.02em;line-height:1}
.status{font-size:13px;color:var(--muted);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.status.busy{color:var(--accent);font-weight:600}
.head select,.head .ghost{background:transparent;border:1px solid var(--line);border-radius:6px;padding:4px 8px;font-size:13px;cursor:pointer}
.head select option{background:var(--surface);color:var(--ink)}

.msgs{flex:1;overflow-y:auto;padding:16px 16px 8px}
.empty{padding:28px 0 8px}
.empty h1{font-size:22px;line-height:1.4;margin:0 0 6px;font-weight:700}
.empty p{margin:0 0 16px;color:var(--muted);font-size:15px}
.chips{display:flex;flex-direction:column;gap:8px;align-items:flex-start}
.chips button{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:8px 12px;text-align:left;cursor:pointer;font-size:15px}
.chips button:hover{border-color:var(--ink)}

.row{margin:0 0 18px;display:flex}
.row.user{justify-content:flex-end}
.bubble.user{max-width:88%;background:var(--user);color:var(--user-ink);border-radius:16px 16px 4px 16px;padding:8px 14px;white-space:pre-wrap;overflow-wrap:anywhere}
.bubble.user .files{display:block;margin-top:4px;font-size:13px;opacity:.85}
.bubble.ai{width:100%;border-left:3px solid var(--accent);padding-left:12px;overflow-wrap:anywhere;min-width:0}
.bubble.ai p{margin:0 0 10px;white-space:pre-wrap}
.bubble.ai h4{margin:14px 0 6px;font-size:16px}
.bubble.ai ul,.bubble.ai ol{margin:0 0 10px;padding-left:22px}
.bubble.ai li{margin:2px 0}
.ic{font-family:"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;font-size:.88em;background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:0 5px}
.think{color:var(--muted);font-size:15px}

.code{margin:0 0 12px;border-radius:8px;overflow:hidden;background:var(--code-bg);color:var(--code-ink)}
.code-bar{display:flex;justify-content:space-between;align-items:center;padding:4px 6px 4px 12px;font-size:12px;color:#9FB3B8;border-bottom:1px solid rgba(255,255,255,.08)}
.code-bar button{background:transparent;border:1px solid rgba(255,255,255,.25);color:var(--code-ink);border-radius:5px;padding:2px 10px;font-size:12px;cursor:pointer}
.code pre{margin:0;padding:10px 12px;overflow-x:auto;font-family:"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;font-size:13px;line-height:1.55;white-space:pre;tab-size:2}

.composer{padding:8px 12px 10px;border-top:1px solid var(--line);background:var(--bg)}
.files-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.file-chip{display:inline-flex;align-items:center;gap:6px;font-size:13px;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:1px 4px 1px 10px}
.file-chip button{background:transparent;border:0;cursor:pointer;font-size:16px;line-height:1;padding:2px 6px;color:var(--muted)}
.box{display:flex;align-items:flex-end;gap:6px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:6px}
.box:focus-within{border-color:var(--focus)}
.box textarea{flex:1;min-width:0;resize:none;border:0;background:transparent;padding:8px 6px;max-height:160px;line-height:1.5}
.ai-app .box textarea:focus-visible{outline:none}
.icon{flex:none;width:40px;height:40px;border-radius:10px;border:0;background:transparent;display:grid;place-items:center;cursor:pointer;color:var(--muted)}
.icon svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.icon.on{color:var(--err)}
.icon.send{background:var(--ink);color:var(--bg)}
.icon.send:disabled{opacity:.35;cursor:not-allowed}
.icon.send svg.stop{fill:currentColor;stroke:none}
.note{min-height:18px;margin:6px 4px 0;font-size:12.5px;color:var(--muted)}
@media (prefers-reduced-motion:no-preference){
  .status.busy::after{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin-left:8px;animation:ai-blink 1s ease-in-out infinite}
  @keyframes ai-blink{50%{opacity:.2}}
}
`;
