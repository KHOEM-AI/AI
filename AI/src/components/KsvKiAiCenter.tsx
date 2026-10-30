import { useCallback, useEffect, useState } from "react";
import systemMap from "../../docs/SYSTEM_MAP.md?raw";

// KSV 🤝 KI 🤝 AI: one page that shows which parts answer, and explains every part.
// "ជាប់" means the server answered an HTTP request. It does not prove the data is correct.

const host = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "localhost";

type Svc = { key: string; name: string; role: string; port: string; url: string };

// The three linked parts (big buttons).
const MAIN: Svc[] = [
  { key: "ksv", name: "KSV", role: "បញ្ជាឧបករណ៍អេឡិចត្រូនិចទូទៅ", port: ":4000", url: `http://${host}:4000/api/` },
  { key: "ki", name: "KI", role: "API", port: ":5001", url: `http://${host}:5001/api/healthz` },
  { key: "ai", name: "AI", role: "UI", port: ":8787", url: "/api/health" },
];

// The other parts of KHOEM-AI.
const OTHER: Svc[] = [
  { key: "khoem", name: "KHOEM_AI", role: "ភាសា និងកូដ", port: ":8790", url: "/l10n/health" },
  { key: "iqai", name: "IQ-AI", role: "សំឡេង វីដេអូ រូបភាព", port: ":8799", url: `http://${host}:8799/` },
  { key: "cai", name: "CAI", role: "ស្កេនរូបថតរាប់ចំនួន និងទីតាំង", port: ":5180", url: `http://${host}:5180/` },
];

type Result = { state: "idle" | "checking" | "ok" | "down"; ms?: number };

async function ping(url: string): Promise<Result> {
  const t0 = performance.now();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 3000);
  try {
    // no-cors: any HTTP answer (even 401/404) means the server is running.
    await fetch(url, { mode: "no-cors", signal: ctl.signal, cache: "no-store" });
    return { state: "ok", ms: Math.round(performance.now() - t0) };
  } catch {
    return { state: "down" };
  } finally {
    clearTimeout(timer);
  }
}

const COLOR = { ok: "#22c55e", down: "#ef4444", checking: "#facc15", idle: "#94a3b8" } as const;

export default function KsvKiAiCenter({ onClose }: { onClose: () => void }) {
  const [res, setRes] = useState<Record<string, Result>>({});

  const check = useCallback(async (s: Svc) => {
    setRes((p) => ({ ...p, [s.key]: { state: "checking" } }));
    const r = await ping(s.url);
    setRes((p) => ({ ...p, [s.key]: r }));
  }, []);
  const checkAll = useCallback(() => { [...MAIN, ...OTHER].forEach((s) => { void check(s); }); }, [check]);
  useEffect(() => { checkAll(); }, [checkAll]);

  const st = (k: string): Result => res[k] ?? { state: "idle" };
  const mainOk = MAIN.every((s) => st(s.key).state === "ok");
  const mainChecked = MAIN.every((s) => st(s.key).state === "ok" || st(s.key).state === "down");
  const mark = (r: Result) => (r.state === "ok" ? "✔" : r.state === "down" ? "✖" : "…");

  const nodeBtn = (s: Svc, big: boolean): React.CSSProperties => ({
    padding: big ? "12px 18px" : "8px 12px",
    fontSize: big ? 17 : 14,
    fontWeight: 700,
    borderRadius: 12,
    cursor: "pointer",
    color: "#fff",
    background: "rgba(56,189,248,0.08)",
    border: `2px solid ${COLOR[st(s.key).state]}`,
    boxShadow: `0 0 12px ${COLOR[st(s.key).state]}66`,
  });

  return (
    <div className="status-overlay" role="dialog" aria-label="KSV KI AI">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">🌐 KSV 🤝 KI 🤝 AI</div>
            <div className="status-panel__page-title">KHOEM-AI · ការតភ្ជាប់ និងការពន្យល់ផ្នែកនីមួយៗ</div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", margin: "14px 0 8px" }}>
          {MAIN.map((s, i) => (
            <span key={s.key} style={{ display: "contents" }}>
              <button style={nodeBtn(s, true)} onClick={() => { void check(s); }} title={s.url}>
                {s.name} {mark(st(s.key))}
              </button>
              {i < MAIN.length - 1 && <span aria-hidden="true" style={{ fontSize: 22 }}>🤝</span>}
            </span>
          ))}
        </div>
        <p style={{ margin: "6px 0 12px", color: mainOk ? "#22c55e" : mainChecked ? "#f59e0b" : "#94a3b8" }}>
          {mainOk
            ? "✅ KSV, KI និង AI ឆ្លើយទាំងអស់"
            : mainChecked
              ? "⚠️ មានផ្នែកមិនរត់ — បើកដោយពាក្យ ai ក្នុង Termux"
              : "កំពុងពិនិត្យ…"}
        </p>

        <div style={{ display: "grid", gap: 6 }}>
          {[...MAIN, ...OTHER].map((s) => {
            const r = st(s.key);
            return (
              <div key={s.key} style={{ display: "flex", justifyContent: "space-between", gap: 8, border: `1px solid ${COLOR[r.state]}55`, borderRadius: 10, padding: "8px 10px" }}>
                <span><b>{s.name}</b> <span style={{ opacity: 0.75 }}>👉 {s.role}</span></span>
                <span style={{ color: COLOR[r.state], whiteSpace: "nowrap" }}>
                  {s.port} {r.state === "ok" ? `✔ ${r.ms}ms` : r.state === "down" ? "✖ មិនរត់" : "…"}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ margin: "12px 0" }}>
          <button onClick={checkAll}>🔄 ពិនិត្យម្តងទៀត</button>
        </div>
        <p style={{ fontSize: 12, opacity: 0.7, margin: "0 0 12px" }}>
          ✔ = server ឆ្លើយ (មិនបញ្ជាក់ថាទិន្នន័យត្រឹមត្រូវទេ) · KSV ត្រូវការ token ដើម្បីបញ្ជា — ទំព័រនេះមិនប្រើ token ទេ
        </p>

        <details open>
          <summary style={{ cursor: "pointer", fontWeight: 700, color: "#7dd3fc" }}>📖 ឯកសារ SYSTEM_MAP</summary>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13, lineHeight: 1.5, margin: "8px 0 0", fontFamily: "inherit" }}>
            {systemMap}
          </pre>
        </details>
      </div>
    </div>
  );
}
