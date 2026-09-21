import { Fragment, useEffect, useRef, useState } from "react";
import { useChat } from "./hooks/useChat";
import AIStatus from "./components/AIStatus";
import MessageActions from "./components/MessageActions";
import HonorificPrompt from "./components/HonorificPrompt";
import { loadHonorific, saveHonorific, type Honorific } from "./honorific";

export default function App() {
  const [honorific, setHonorific] = useState<Honorific | null>(() => loadHonorific());
  const [showHonorific, setShowHonorific] = useState(false);
  const { messages, isSending, error, sendMessage, regenerate, setFeedback, clearConversation } = useChat(honorific);
  const [input, setInput] = useState("");
  const [showStatus, setShowStatus] = useState(false);
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

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span className="app__brand-mark"><span className="app__logo" /></span>
          <span className="app__brand-name">KHOEM-AI</span>
        </div>
        <button className="app__status-btn" onClick={() => setShowStatus(true)}>
          ស្ថានភាព AI
        </button>
        <button className="app__status-btn" onClick={() => setShowHonorific(true)}>
          ប្ដូរការហៅ
        </button>
        {messages.length > 0 && (
          <button className="app__clear" onClick={clearConversation}>
            សម្អាតការសន្ទនា
          </button>
        )}
      </header>

      <main className="app__body" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty-state">
            <p className="empty-state__title">ចាប់ផ្ដើមសន្ទនាជាមួយ AI</p>
            <p className="empty-state__hint">សរសេរសំណួរខាងក្រោម ហើយចុច Enter ដើម្បីផ្ញើ</p>
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
            <div className="bubble__text">កំពុងគិត…</div>
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
          placeholder="សរសេរសំណួររបស់អ្នកនៅទីនេះ..."
          rows={1}
        />
        <button
          className="composer__send"
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          aria-label="ផ្ញើសារ"
        >
          ផ្ញើ
        </button>
      </footer>

      {showStatus && <AIStatus onClose={() => setShowStatus(false)} />}

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
  );
}
