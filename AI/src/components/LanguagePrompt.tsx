import { LANGUAGE_OPTIONS, type LanguageCode } from "../language";

export default function LanguagePrompt({
  current,
  onSelect,
  onClose,
}: {
  current: LanguageCode;
  onSelect: (code: LanguageCode) => void;
  onClose?: () => void;
}) {
  return (
    <div className="honorific-overlay" role="dialog" aria-label="ជ្រើសរើសភាសា">
      <div className="honorific-panel">
        <p className="honorific-panel__title">ជ្រើសរើសភាសា</p>
        <div className="honorific-panel__grid language-panel__grid">
          {LANGUAGE_OPTIONS.map((o) => (
            <button
              key={o.code}
              className={`honorific-btn${current === o.code ? " honorific-btn--active" : ""}`}
              onClick={() => onSelect(o.code)}
            >
              {o.label}
            </button>
          ))}
        </div>
        {onClose && (
          <button className="honorific-panel__close" onClick={onClose}>
            បិទ
          </button>
        )}
      </div>
    </div>
  );
}
