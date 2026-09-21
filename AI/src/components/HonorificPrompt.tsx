import { HONORIFIC_OPTIONS, type Honorific } from "../honorific";

export default function HonorificPrompt({
  current,
  onSelect,
  onClose,
}: {
  current: Honorific | null;
  onSelect: (h: Honorific) => void;
  onClose?: () => void;
}) {
  return (
    <div className="honorific-overlay" role="dialog" aria-label="ជ្រើសរើសការហៅ">
      <div className="honorific-panel">
        <p className="honorific-panel__title">តើចង់ឱ្យខ្ញុំហៅអ្នកតាមរបៀបណា?</p>
        <div className="honorific-panel__grid">
          {HONORIFIC_OPTIONS.map((h) => (
            <button
              key={h}
              className={`honorific-btn${current === h ? " honorific-btn--active" : ""}`}
              onClick={() => onSelect(h)}
            >
              {h}
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
