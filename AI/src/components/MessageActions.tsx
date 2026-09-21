import { useState } from "react";
import type { ReactNode } from "react";
import type { Message } from "../types";

interface Props {
  message: Message;
  isLast: boolean;
  disabled: boolean;
  onFeedback: (id: string, value: "like" | "dislike") => void;
  onRegenerate: () => void;
  onNewChat: () => void;
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function MessageActions({ message, isLast, disabled, onFeedback, onRegenerate, onNewChat }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (await copyText(message.text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="bubble__actions">
      <button type="button" className={`bubble__action${message.feedback === "like" ? " bubble__action--active" : ""}`} onClick={() => onFeedback(message.id, "like")} aria-label="ចូលចិត្ត" title="ចូលចិត្ត">
        <Icon>
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
        </Icon>
      </button>
      <button type="button" className={`bubble__action${message.feedback === "dislike" ? " bubble__action--active" : ""}`} onClick={() => onFeedback(message.id, "dislike")} aria-label="មិនចូលចិត្ត" title="មិនចូលចិត្ត">
        <Icon>
          <path d="M17 14V2" />
          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
        </Icon>
      </button>
      {isLast && (
        <button type="button" className="bubble__action" onClick={onRegenerate} disabled={disabled} aria-label="ឆ្លើយម្ដងទៀត" title="ឆ្លើយម្ដងទៀត">
          <Icon>
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </Icon>
        </button>
      )}
      <button type="button" className={`bubble__action${copied ? " bubble__action--active" : ""}`} onClick={handleCopy} aria-label="ចម្លង" title="ចម្លង">
        <Icon>
          {copied ? (
            <path d="M20 6 9 17l-5-5" />
          ) : (
            <>
              <rect x="9" y="9" width="12" height="12" rx="3" strokeWidth="2.2" />
              <path d="M7 15H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1" strokeWidth="2.2" />
            </>
          )}
        </Icon>
      </button>
      {isLast && (
        <button type="button" className="bubble__action" onClick={onNewChat} disabled={disabled} aria-label="ជជែកថ្មី" title="ជជែកថ្មី">
          <Icon>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M12 7v6" />
            <path d="M9 10h6" />
          </Icon>
        </button>
      )}
    </div>
  );
}
