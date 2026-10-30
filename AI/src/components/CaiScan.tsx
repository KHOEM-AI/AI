export default function CaiScan({ onClose }: { onClose: () => void }) {
  return (
    <div className="status-overlay" role="dialog" aria-label="CAI">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">CAI</div>
            <div className="status-panel__page-title">Vision · Count · Locate</div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <iframe title="CAI" src="/cai/index.html" allow="camera; geolocation" style={{ width: "100%", height: "78vh", border: 0, borderRadius: 10 }} />
      </div>
    </div>
  );
}
