import { LANGUAGE_OPTIONS, type LanguageCode } from "../language";
import { useT } from "../i18n";

export default function LanguagePrompt({
  current,
  onSelect,
  onClose,
}: {
  current: LanguageCode;
  onSelect: (code: LanguageCode) => void;
  onClose?: () => void;
}) {
  const t = useT();
  return (
    <div className="honorific-overlay" role="dialog" aria-label={t.languageTitle}>
      <div className="honorific-panel">
        <p className="honorific-panel__title">{t.languageTitle}</p>
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
            {t.languageClose}
          </button>
        )}
      </div>
    </div>
  );
}
