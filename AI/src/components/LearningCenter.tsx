import { useState } from "react";
import { useT, pickText, useLanguageCode } from "../i18n";
import { useKhoem } from "../hooks/useKhoem";

async function api(url: string, opts: RequestInit = {}) {
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  const json = await r.json();
  return (json && typeof json === "object" && "result" in json) ? json.result : json;
}

export default function LearningCenter({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguageCode();
  const k = useKhoem(lang);
  const kk = (key: string, fb: string) => k(key) || fb;

  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [forgetQ, setForgetQ] = useState("");
  const [learnedText, setLearnedText] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLearn() {
    if (!q.trim() || !a.trim()) return;
    setBusy("learn"); setError(null); setMessage(null);
    try {
      const res = await api("/api/learn", { method: "POST", body: JSON.stringify({ q: q.trim(), a: a.trim() }) });
      setMessage(typeof res === "string" ? res : JSON.stringify(res));
      setQ(""); setA("");
    } catch {
      setError(kk("ai.menu.learningLearnFailed", pickText(lang, "រៀនមិនបានជោគជ័យ", "Learn failed")));
    } finally { setBusy(null); }
  }

  async function handleForget() {
    if (!forgetQ.trim()) return;
    setBusy("forget"); setError(null); setMessage(null);
    try {
      const res = await api("/api/forget", { method: "POST", body: JSON.stringify({ q: forgetQ.trim() }) });
      setMessage(typeof res === "string" ? res : JSON.stringify(res));
      setForgetQ("");
    } catch {
      setError(kk("ai.menu.learningForgetFailed", pickText(lang, "ភ្លេចមិនបានជោគជ័យ", "Forget failed")));
    } finally { setBusy(null); }
  }

  async function loadLearned() {
    setBusy("learned"); setError(null);
    try {
      const res = await api("/api/learned");
      setLearnedText(typeof res === "string" ? res : JSON.stringify(res));
    } catch {
      setError(kk("ai.menu.learningLoadFailed", pickText(lang, "ទាញយកបញ្ជីមិនបានជោគជ័យ", "Failed to load learned list")));
    } finally { setBusy(null); }
  }

  return (
    <div className="status-overlay" role="dialog" aria-label={kk("ai.menu.learningCenter", "Learning Center")}>
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">{kk("ai.menu.learningCenter", pickText(lang, "មជ្ឈមណ្ឌលការរៀន", "Learning Center"))}</div>
            <div className="status-panel__page-title">
              {kk("ai.menu.learningSubtitle", pickText(lang, "បង្រៀន ភ្លេច និងមើលចំណេះដឹងដែលបានរៀន", "Teach, forget, and browse learned knowledge"))}
            </div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        {error && <div className="status-card__err">{error}</div>}
        {message && <div className="status-panel__meta">{message}</div>}

        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{kk("ai.menu.learningTeachTitle", pickText(lang, "រៀនចំណុចថ្មី", "Teach a new fact"))}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={kk("ai.menu.learningQuestionPh", pickText(lang, "សំណួរ (ឧ. សួស្ដី)", "Question (e.g. hello)"))}
          />
          <input
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder={kk("ai.menu.learningAnswerPh", pickText(lang, "ចម្លើយ", "Answer"))}
          />
          <button disabled={busy === "learn" || !q.trim() || !a.trim()} onClick={handleLearn}>
            {kk("ai.menu.learningLearnBtn", pickText(lang, "រៀន", "Learn"))}
          </button>
        </div>

        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{kk("ai.menu.learningForgetTitle", pickText(lang, "ភ្លេចចំណុច", "Forget a fact"))}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input
            value={forgetQ}
            onChange={(e) => setForgetQ(e.target.value)}
            placeholder={kk("ai.menu.learningForgetPh", pickText(lang, "សំណួរដែលចង់ភ្លេច", "Question to forget"))}
          />
          <button disabled={busy === "forget" || !forgetQ.trim()} onClick={handleForget}>
            {kk("ai.menu.learningForgetBtn", pickText(lang, "ភ្លេច", "Forget"))}
          </button>
        </div>

        <div className="status-panel__meta" style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
          <span>{kk("ai.menu.learningLearnedTitle", pickText(lang, "អ្វីដែលបានរៀនរួច", "Learned so far"))}</span>
          <button disabled={busy === "learned"} onClick={loadLearned}>
            {kk("ai.menu.learningLoadBtn", pickText(lang, "ផ្ទុកបញ្ជី", "Load list"))}
          </button>
        </div>
        {learnedText && (
          <div className="status-card__extra" style={{ whiteSpace: "pre-wrap" }}>
            {learnedText}
          </div>
        )}
      </div>
    </div>
  );
}
