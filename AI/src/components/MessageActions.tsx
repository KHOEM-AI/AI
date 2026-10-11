import { useState } from "react";
import type { ReactNode } from "react";
import type { Message } from "../types";
import { useLanguageCode } from "../i18n";
import { useKhoem } from "../hooks/useKhoem";
import { speakText, stopSpeaking, speechSupported, VOICE_PRESETS, getVoicePreset, setVoicePreset } from "../useSpeechOutput";

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
  const lang = useLanguageCode();
  const k = useKhoem(lang);
  const kk = (key: string, fb: string) => k(key) || fb;
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [preset, setPreset] = useState(getVoicePreset());
  const [voiceAge, setVoiceAge] = useState(
    VOICE_PRESETS.find((v) => v.id === getVoicePreset())?.ageMin === 0 ? "0-10" :
    VOICE_PRESETS.find((v) => v.id === getVoicePreset())?.ageMin === 11 ? "11-20" :
    VOICE_PRESETS.find((v) => v.id === getVoicePreset())?.ageMin === 21 ? "21-30" :
    VOICE_PRESETS.find((v) => v.id === getVoicePreset())?.ageMin === 31 ? "31-40" :
    VOICE_PRESETS.find((v) => v.id === getVoicePreset())?.ageMin === 41 ? "41-50" :
    VOICE_PRESETS.find((v) => v.id === getVoicePreset())?.ageMin === 51 ? "51-60" : "61-70"
  );
  const [voiceGender, setVoiceGender] = useState<"female" | "male">(
    VOICE_PRESETS.find((v) => v.id === getVoicePreset())?.gender ?? "female"
  );

  const ageOptions = [
    { value: "0-10", label: "≤ ១០ ឆ្នាំ" },
    { value: "11-20", label: "១១–២០ ឆ្នាំ" },
    { value: "21-30", label: "២១–៣០ ឆ្នាំ" },
    { value: "31-40", label: "៣១–៤០ ឆ្នាំ" },
    { value: "41-50", label: "៤១–៥០ ឆ្នាំ" },
    { value: "51-60", label: "៥១–៦០ ឆ្នាំ" },
    { value: "61-70", label: "៦១–៧០ ឆ្នាំ" },
  ];

  function chooseVoice(age: string, gender: "female" | "male") {
    const [min] = age.split("-").map(Number);
    const found = VOICE_PRESETS.find((v) => v.ageMin === min && v.gender === gender);
    if (!found) return;
    setVoiceAge(age);
    setVoiceGender(gender);
    setPreset(found.id);
    setVoicePreset(found.id);
  }

  function previewVoice() {
    speakText("សួស្តី ខ្ញុំកំពុងសាកល្បងសំឡេង។", preset, () => setSpeaking(false));
    setSpeaking(true);
  }

  function handleSpeak() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    if (speakText(message.text, preset, () => setSpeaking(false))) setSpeaking(true);
  }

  async function handleCopy() {
    if (await copyText(message.text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="bubble__actions">
      <button type="button" className={`bubble__action${message.feedback === "like" ? " bubble__action--active" : ""}`} onClick={() => onFeedback(message.id, "like")} aria-label={kk("ai.menu.messageLike", "ចូលចិត្ត")} title={kk("ai.menu.messageLike", "ចូលចិត្ត")}>
        <Icon>
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
        </Icon>
      </button>
      <button type="button" className={`bubble__action${message.feedback === "dislike" ? " bubble__action--active" : ""}`} onClick={() => onFeedback(message.id, "dislike")} aria-label={kk("ai.menu.messageDislike", "មិនចូលចិត្ត")} title={kk("ai.menu.messageDislike", "មិនចូលចិត្ត")}>
        <Icon>
          <path d="M17 14V2" />
          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
        </Icon>
      </button>
      {isLast && (
        <button type="button" className="bubble__action" onClick={onRegenerate} disabled={disabled} aria-label={kk("ai.menu.messageRegenerate", "ឆ្លើយម្ដងទៀត")} title={kk("ai.menu.messageRegenerate", "ឆ្លើយម្ដងទៀត")}>
          <Icon>
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </Icon>
        </button>
      )}
      <button type="button" className={`bubble__action${copied ? " bubble__action--active" : ""}`} onClick={handleCopy} aria-label={kk("ai.menu.messageCopy", "ចម្លង")} title={kk("ai.menu.messageCopy", "ចម្លង")}>
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
        <button type="button" className="bubble__action" onClick={onNewChat} disabled={disabled} aria-label={kk("ai.menu.messageNewChat", "ជជែកថ្មី")} title={kk("ai.menu.messageNewChat", "ជជែកថ្មី")}>
          <Icon>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M12 7v6" />
            <path d="M9 10h6" />
          </Icon>
        </button>
      )}
      {speechSupported() && (
        <>
          <button type="button" className={`bubble__action${speaking ? " bubble__action--active" : ""}`} onClick={handleSpeak} aria-label="អានជាសំឡេង" title="អានជាសំឡេង">
            <Icon>
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M19 5a10 10 0 0 1 0 14" />
            </Icon>
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
            <select
              value={voiceAge}
              onChange={(e) => chooseVoice(e.target.value, voiceGender)}
              aria-label="ជ្រើសក្រុមអាយុ"
              style={{ background: "transparent", color: "inherit", border: "1px solid currentColor", borderRadius: 8, fontSize: 12, padding: "4px" }}
            >
              {ageOptions.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <button
              type="button"
              onClick={() => chooseVoice(voiceAge, "female")}
              aria-pressed={voiceGender === "female"}
              style={{ border: "1px solid currentColor", borderRadius: 8, padding: "4px 7px", fontSize: 12, opacity: voiceGender === "female" ? 1 : 0.6 }}
            >ស្រី</button>
            <button
              type="button"
              onClick={() => chooseVoice(voiceAge, "male")}
              aria-pressed={voiceGender === "male"}
              style={{ border: "1px solid currentColor", borderRadius: 8, padding: "4px 7px", fontSize: 12, opacity: voiceGender === "male" ? 1 : 0.6 }}
            >ប្រុស</button>
            <button
              type="button"
              onClick={previewVoice}
              style={{ border: "1px solid currentColor", borderRadius: 8, padding: "4px 7px", fontSize: 12 }}
            >សាកសំឡេង</button>
          </div>
        </>
      )}
    </div>
  );
}
