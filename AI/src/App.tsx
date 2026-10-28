import khoemLogo from "./assets/khoem-ai-logo.webp";
import { Fragment, useEffect, useRef, useState } from "react";
import HeartbeatLogo from "./components/HeartbeatLogo";
import { useChat } from "./hooks/useChat";
import AIStatus from "./components/AIStatus";
import ControlCenter from "./components/ControlCenter";
import PatchDashboard from "./components/PatchDashboard";
import CodeCenter from "./components/CodeCenter";
import AuditMetricsCenter from "./components/AuditMetricsCenter";
import ObservabilityCenter from "./components/ObservabilityCenter";
import ManagementCenter from "./components/ManagementCenter";
import SafetyCenter from "./components/SafetyCenter";
import ToolRegistryCenter from "./components/ToolRegistryCenter";
import LearningCenter from "./components/LearningCenter";
import ApiCenter from "./components/ApiCenter";
import ColorLightCenter from "./components/ColorLightCenter";
import DataCenter from "./components/DataCenter";
import IqaiCenter from "./components/IqaiCenter";
import { lazy, Suspense } from "react";
const AvStudio = lazy(() => import("./components/AvStudio"));
import EmotionBadge from "./components/EmotionBadge";
import ThreeDStudio from "./components/StudioHub";
import MessageActions from "./components/MessageActions";
import HonorificPrompt from "./components/HonorificPrompt";
import ErrorBoundary from "./components/ErrorBoundary";
import { loadHonorific, saveHonorific, type Honorific } from "./honorific";
import { loadLanguage, saveLanguage, type LanguageCode, type LanguageOption } from "./language";
import { LanguageProvider, getTranslations } from "./i18n";
import { useSpeechInput } from "./useSpeechInput";
import { useKhoem } from "./hooks/useKhoem";
import { APP_NAME } from "./lib/app";

function AppInner() {
  const [honorific, setHonorific] = useState<Honorific | null>(() => loadHonorific());
  const [showHonorific, setShowHonorific] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>(() => loadLanguage());
  const [showLanguage, setShowLanguage] = useState(false);
  const [khoemLanguageOptions, setKhoemLanguageOptions] = useState<LanguageOption[]>([]);
  const [languageError, setLanguageError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/l10n/api/languages")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((body) => {
        const rows = Array.isArray(body?.data) ? body.data : [];
        const options = rows
          .map((x: any) => ({
            code: String(x.languageId ?? x.iso639_1 ?? x.bcp47 ?? ""),
            label: String(x.nativeName ?? x.englishName ?? x.languageId ?? ""),
            nameEn: String(x.englishName ?? x.languageId ?? ""),
            flag: String(x.flag ?? "🌐"),
          }))
          .filter((x: { code: string; label: string; nameEn: string; flag: string }) => x.code);

        if (cancelled) return;
        if (options.length > 0) {
          setKhoemLanguageOptions(options);
          setLanguageError(false);
        } else {
          setLanguageError(true);
        }
      })
      .catch((err) => {
        console.error("[l10n] languages fetch failed:", err);
        if (!cancelled) setLanguageError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const t = getTranslations(language);
  const k = useKhoem(language);
  const { messages, isSending, error, sendMessage, regenerate, setFeedback, clearConversation } = useChat(honorific);
  const [input, setInput] = useState("");
  const mic = useSpeechInput(language, (text) =>
    setInput((prev) => (prev ? prev + " " : "") + text),
  );
  const [showStatus, setShowStatus] = useState(false);
  const [showControl, setShowControl] = useState(false);
  const [showPatchDashboard, setShowPatchDashboard] = useState(false);
  const [showCodeCenter, setShowCodeCenter] = useState(false);
  const [showAuditMetrics, setShowAuditMetrics] = useState(false);
  const [showObservability, setShowObservability] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [showToolRegistry, setShowToolRegistry] = useState(false);
  const [showLearningCenter, setShowLearningCenter] = useState(false);
  const [showApiCenter, setShowApiCenter] = useState(false);
const [showColorLight, setShowColorLight] = useState(false);
  const [showDataCenter, setShowDataCenter] = useState(false);
  const [showIqai, setShowIqai] = useState(false);
  const [showThreeDStudio, setShowThreeDStudio] = useState(false);
  const [showAvStudio, setShowAvStudio] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showDone, setShowDone] = useState(false);
  const wasSending = useRef(false);
  useEffect(() => {
    if (wasSending.current && !isSending && !error) {
      setShowDone(true);
      const t = setTimeout(() => setShowDone(false), 2000);
      wasSending.current = isSending;
      return () => clearTimeout(t);
    }
    if (isSending) setShowDone(false);
    wasSending.current = isSending;
  }, [isSending, error]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  function handleSend() {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleNewChat() {
    clearConversation();
    setShowMenu(false);
  }

  function handleSelectLanguage(code: LanguageCode) {
    saveLanguage(code);
    setLanguage(code);
    setShowLanguage(false);
  }

  return (
    <LanguageProvider value={language}>
      <div className="app">
        <header className="app__header">
          <button className="app__menu-btn" onClick={() => setShowMenu(true)} aria-label={t.menuOpen}>
            <span className="app__menu-line" />
            <span className="app__menu-line" />
            <span className="app__menu-line" />
          </button>

          <div className="app__brand">
            <span className="app__brand-mark"><img className="app__logo" src={khoemLogo} alt="KHOEM-AI" /></span>
            <span className="app__brand-name">{APP_NAME}</span>
          </div>

          <button className="app__new-btn" onClick={handleNewChat} aria-label={t.newChat}>
            +
          </button>
        </header>

        {showMenu && (
          <>
            <div className="app__overlay" onClick={() => setShowMenu(false)} />
            <aside className="app__sidebar">
              <div className="app__sidebar-top">
                <div className="app__brand">
                  <span className="app__brand-mark"><img className="app__logo" src={khoemLogo} alt="KHOEM-AI" /></span>
                  <span className="app__brand-name">{APP_NAME}</span>
                </div>
                <button className="app__sidebar-close" onClick={() => setShowMenu(false)} aria-label={t.menuClose}>
                  ✕
                </button>
              </div>

              <nav className="app__sidebar-nav">
                <button className="app__sidebar-item" onClick={() => { setShowStatus(true); setShowMenu(false); }}>
                  <span aria-hidden="true">📊</span> {t.navStatus}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowControl(true); setShowMenu(false); }}>
                  <span aria-hidden="true">🎛</span> {t.navControlCenter}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowPatchDashboard(true); setShowMenu(false); }}>
                  <span aria-hidden="true">🧩</span> {k("ai.menu.patchDashboard") || "Patch Dashboard"}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowCodeCenter(true); setShowMenu(false); }}>
                  <span aria-hidden="true">💻</span> {k("ai.menu.codeCenter") || "Code Center"}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowApiCenter(true); setShowMenu(false); }}>🔌 API Center</button>
<button className="app__sidebar-item" onClick={() => { setShowColorLight(true); setShowMenu(false); }}>🎨 Color and Light · ពណ៌ និងអំពូលភ្លើង</button>
                <button className="app__sidebar-item" onClick={() => { setShowDataCenter(true); setShowMenu(false); }}>🗂 Data Center</button>
                <button className="app__sidebar-item" onClick={() => { setShowIqai(true); setShowMenu(false); }}>🎭 Emotion and Media Analyzer · វិភាគអារម្មណ៍ និងឯកសារ</button>
                <button className="app__sidebar-item" onClick={() => { setShowThreeDStudio(true); setShowMenu(false); }}><span aria-hidden="true">🧊</span> 3D Studio · Orbit 360°</button>
                <button className="app__sidebar-item" onClick={() => { setShowAvStudio(true); setShowMenu(false); }}><span aria-hidden="true">🎧</span> Audio · Video · Creative Studio</button>
                <button className="app__sidebar-item" onClick={() => { setShowLearningCenter(true); setShowMenu(false); }}>
                  <span aria-hidden="true">🎓</span> {k("ai.menu.learningCenter") || "Learning Center"}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowAuditMetrics(true); setShowMenu(false); }}>
                  <span aria-hidden="true">📈</span> {k("ai.menu.auditMetrics") || "Audit & Metrics"}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowObservability(true); setShowMenu(false); }}>
                  <span aria-hidden="true">🔭</span> {k("ai.menu.observability") || "Observability"}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowManagement(true); setShowMenu(false); }}>
                  <span aria-hidden="true">⚙️</span> {k("ai.menu.management") || "Management"}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowSafety(true); setShowMenu(false); }}>
                  <span aria-hidden="true">🛡</span> {k("ai.menu.safety") || "Safety"}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowToolRegistry(true); setShowMenu(false); }}>
                  <span aria-hidden="true">🧰</span> {k("ai.menu.toolRegistry") || "Tool Registry"}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowHonorific(true); setShowMenu(false); }}>
                  <span aria-hidden="true">🙏</span> {t.navHonorific}
                </button>
                <button className="app__sidebar-item" onClick={() => setShowLanguage((v) => !v)}>
                  <span aria-hidden="true">🌐</span> {t.navLanguage} · {khoemLanguageOptions.find((o) => o.code === language)?.label ?? language}
                </button>
                {showLanguage && (
                  <div className="language-panel__list language-panel__list--inline">
                    {languageError && khoemLanguageOptions.length === 0 && (
                      <div className="language-option" role="alert">
                        ទាញយកបញ្ជីភាសាមិនបាន
                      </div>
                    )}
                    {khoemLanguageOptions.map((o) => (
                      <button
                        key={o.code}
                        className={`language-option${language === o.code ? " language-option--active" : ""}`}
                        onClick={() => { handleSelectLanguage(o.code); setShowLanguage(false); setShowMenu(false); }}
                      >
                        <span className="language-option__flag">{o.flag}</span>
                        <span className="language-option__names">
                          <span className="language-option__native">{o.label}</span>
                          <span className="language-option__en">{o.nameEn}</span>
                        </span>
                        {language === o.code && <span className="language-option__check">✓</span>}
                      </button>
                    ))}
                    <button className="language-panel__back" onClick={() => setShowLanguage(false)}>
                      ← {t.languageClose}
                    </button>
                  </div>
                )}
                {messages.length > 0 && (
                  <button className="app__sidebar-item" onClick={handleNewChat}>
                    <span aria-hidden="true">🧹</span> {t.navClearChat}
                  </button>
                )}
              </nav>
            </aside>
          </>
        )}

        <main className="app__body" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="empty-state">
              <p className="empty-state__title">{k("ai.menu.chatEmptyTitle") || t.emptyTitle}</p>
              <p className="empty-state__hint">{k("ai.menu.chatEmptyHint") || t.emptyHint}</p>
            </div>
          )}

          {messages.map((m, idx) => (
            <Fragment key={m.id}>
            <div className={`bubble bubble--${m.role}`}>
              <div className="bubble__text">{m.text}</div>
              {m.role === "user" && <EmotionBadge text={m.text} />}
              </div>
            {m.role === "assistant" && (
              <MessageActions message={m} isLast={idx === messages.length - 1} disabled={isSending} onFeedback={setFeedback} onRegenerate={regenerate} onNewChat={clearConversation} />
            )}
          </Fragment>
          ))}

          {isSending && <HeartbeatLogo state="thinking" width={120} />}
          {!isSending && error && <HeartbeatLogo state="error" width={120} />}
          {!isSending && showDone && <HeartbeatLogo state="done" width={120} />}
          {isSending && (
            <div className="bubble bubble--assistant bubble--pending">
              <div className="bubble__text">{k("ai.menu.chatThinking") || t.thinking}</div>
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}
        </main>

        <footer className="app__composer">
          <textarea
            className="composer__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={k("ai.menu.chatPlaceholder") || t.composerPlaceholder}
            rows={1}
          />
          {mic.supported && (
            <button
              type="button"
              className={"composer__mic" + (mic.listening ? " composer__mic--on" : "")}
              onClick={mic.toggle}
              aria-label="Microphone"
              aria-pressed={mic.listening}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="17" x2="12" y2="22" /></svg>
            </button>
          )}
          <button
            className="composer__send"
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            aria-label={k("ai.menu.chatSendAria") || t.sendAria}
          >
            {k("ai.menu.chatSend") || t.send}
          </button>
        </footer>

        {showStatus && <ErrorBoundary onClose={() => setShowStatus(false)}><AIStatus onClose={() => setShowStatus(false)} /></ErrorBoundary>}
        {showControl && <ErrorBoundary onClose={() => setShowControl(false)}><ControlCenter onClose={() => setShowControl(false)} /></ErrorBoundary>}
        {showPatchDashboard && <ErrorBoundary onClose={() => setShowPatchDashboard(false)}><PatchDashboard onClose={() => setShowPatchDashboard(false)} /></ErrorBoundary>}
        {showCodeCenter && <ErrorBoundary onClose={() => setShowCodeCenter(false)}><CodeCenter onClose={() => setShowCodeCenter(false)} /></ErrorBoundary>}
        {showAuditMetrics && <ErrorBoundary onClose={() => setShowAuditMetrics(false)}><AuditMetricsCenter onClose={() => setShowAuditMetrics(false)} /></ErrorBoundary>}
        {showObservability && <ErrorBoundary onClose={() => setShowObservability(false)}><ObservabilityCenter onClose={() => setShowObservability(false)} /></ErrorBoundary>}
        {showManagement && <ErrorBoundary onClose={() => setShowManagement(false)}><ManagementCenter onClose={() => setShowManagement(false)} /></ErrorBoundary>}
        {showSafety && <ErrorBoundary onClose={() => setShowSafety(false)}><SafetyCenter onClose={() => setShowSafety(false)} /></ErrorBoundary>}
        {showToolRegistry && <ErrorBoundary onClose={() => setShowToolRegistry(false)}><ToolRegistryCenter onClose={() => setShowToolRegistry(false)} /></ErrorBoundary>}
        {showLearningCenter && <ErrorBoundary onClose={() => setShowLearningCenter(false)}><LearningCenter onClose={() => setShowLearningCenter(false)} /></ErrorBoundary>}
        {showApiCenter && <ErrorBoundary onClose={() => setShowApiCenter(false)}><ApiCenter onClose={() => setShowApiCenter(false)} /></ErrorBoundary>}
{showColorLight && <ErrorBoundary onClose={() => setShowColorLight(false)}><ColorLightCenter onClose={() => setShowColorLight(false)} /></ErrorBoundary>}
        {showDataCenter && <ErrorBoundary onClose={() => setShowDataCenter(false)}><DataCenter onClose={() => setShowDataCenter(false)} /></ErrorBoundary>}
        {showIqai && <ErrorBoundary onClose={() => setShowIqai(false)}><IqaiCenter onClose={() => setShowIqai(false)} /></ErrorBoundary>}
        {showThreeDStudio && <ErrorBoundary onClose={() => setShowThreeDStudio(false)}><ThreeDStudio onClose={() => setShowThreeDStudio(false)} /></ErrorBoundary>}
        {showAvStudio && <ErrorBoundary onClose={() => setShowAvStudio(false)}><Suspense fallback={null}><AvStudio onClose={() => setShowAvStudio(false)} /></Suspense></ErrorBoundary>}

        {(!honorific || showHonorific) && (
          <HonorificPrompt
            current={honorific}
            onSelect={(h) => {
              saveHonorific(h);
              setHonorific(h);
              setShowHonorific(false);
            }}
            onClose={honorific ? () => setShowHonorific(false) : undefined}
          />
        )}
      </div>
    </LanguageProvider>
  );
}

export default function App() {
  return <AppInner />;
}
