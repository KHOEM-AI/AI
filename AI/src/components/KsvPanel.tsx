export default function KsvPanel({ onClose }: { onClose: () => void }) {
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const url = `http://${host}:5173/`;
  return (
    <div className="status-overlay" role="dialog" aria-label="KSV" style={{ padding: 0 }}>
      <div className="status-panel" style={{ maxWidth: "100%", width: "100%", height: "100dvh", borderRadius: 0, border: 0, boxShadow: "none", display: "flex", flexDirection: "column", boxSizing: "border-box", padding: "calc(8px + env(safe-area-inset-top)) 10px calc(6px + env(safe-area-inset-bottom))" }}>
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">KHOEM-AI</div>
            
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <iframe title="KSV" src={url} allow="camera; geolocation" style={{ width: "100%", flex: 1, minHeight: 0, border: 0, borderRadius: 10 }} />
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
          Blank? Start the KSV UI on port 5173. <a href={url} target="_blank" rel="noreferrer">Open in new tab</a>
        </div>
      </div>
    </div>
  );
}
