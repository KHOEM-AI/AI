import KeiDashboard from "../KeiDashboard";

export default function KeiCenter({ onClose }: { onClose: () => void }) {
  return (
    <div className="status-overlay" role="dialog" aria-label="KHOEM-AI">
      <div className="status-panel">
        <div className="status-panel__head">
          <div />
          <button className="status-panel__close" onClick={onClose} aria-label="close">✕</button>
        </div>
        <KeiDashboard />
      </div>
    </div>
  );
}
