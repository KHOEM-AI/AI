import { Fragment, useEffect, useRef, useState } from "react";
import { useChat } from "./hooks/useChat";
import AIStatus from "./components/AIStatus";
import ControlCenter from "./components/ControlCenter";
import MessageActions from "./components/MessageActions";
import HonorificPrompt from "./components/HonorificPrompt";
import LanguagePrompt from "./components/LanguagePrompt";
import { loadHonorific, saveHonorific, type Honorific } from "./honorific";
import { loadLanguage, saveLanguage, getLanguageLabel, type LanguageCode } from "./language";
import { LanguageProvider, getTranslations } from "./i18n";

function AppInner() {
  const [honorific, setHonorific] = useState<Honorific | null>(() => loadHonorific());
  const [showHonorific, setShowHonorific] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>(() => loadLanguage());
  const [showLanguage, setShowLanguage] = useState(false);
  const t = getTranslations(language);
  const { messages, isSending, error, sendMessage, regenerate, setFeedback, clearConversation } = useChat(honorific);
  const [input, setInput] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [showControl, setShowControl] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
            <span className="app__brand-mark"><span className="app__logo" /></span>
            <span className="app__brand-name">KHOEM-AI</span>
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
                  <span className="app__brand-mark"><span className="app__logo" /></span>
                  <span className="app__brand-name">KHOEM-AI</span>
                </div>
                <button className="app__sidebar-close" onClick={() => setShowMenu(false)} aria-label={t.menuClose}>
                  ✕
                </button>
              </div>

              <nav className="app__sidebar-nav">
                <button className="app__sidebar-item" onClick={() => { setShowStatus(true); setShowMenu(false); }}>
                  {t.navStatus}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowControl(true); setShowMenu(false); }}>
                  {t.navControlCenter}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowHonorific(true); setShowMenu(false); }}>
                  {t.navHonorific}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowLanguage(true); setShowMenu(false); }}>
                  {t.navLanguage} · {getLanguageLabel(language)}
                </button>
                {messages.length > 0 && (
                  <button className="app__sidebar-item" onClick={handleNewChat}>
                    {t.navClearChat}
                  </button>
                )}
              </nav>
            </aside>
          </>
        )}

        <main className="app__body" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="empty-state">
              <p className="empty-state__title">{t.emptyTitle}</p>
              <p className="empty-state__hint">{t.emptyHint}</p>
            </div>
          )}

          {messages.map((m, idx) => (
            <Fragment key={m.id}>
            <div className={`bubble bubble--${m.role}`}>
              <div className="bubble__text">{m.text}</div>
              </div>
            {m.role === "assistant" && (
              <MessageActions message={m} isLast={idx === messages.length - 1} disabled={isSending} onFeedback={setFeedback} onRegenerate={regenerate} onNewChat={clearConversation} />
            )}
          </Fragment>
          ))}

          {isSending && (
            <div className="bubble bubble--assistant bubble--pending">
              <div className="bubble__text">{t.thinking}</div>
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
            placeholder={t.composerPlaceholder}
            rows={1}
          />
          <button
            className="composer__send"
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            aria-label={t.sendAria}
          >
            {t.send}
          </button>
        </footer>

        {showStatus && <AIStatus onClose={() => setShowStatus(false)} />}
        {showControl && <ControlCenter onClose={() => setShowControl(false)} />}

        {showLanguage && (
          <LanguagePrompt current={language} onSelect={handleSelectLanguage} onClose={() => setShowLanguage(false)} />
        )}

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
