import {
  AI_STATUS_CARDS, STATUS_LABELS, AI_NAME,
  PAGE_TITLE_KM, PAGE_TITLE_EN, LAST_UPDATED, StatusCode,
} from "../data/aiStatus";

const HEALTHY: StatusCode[] = ["ONLINE", "READY", "ACTIVE", "DEVELOPING"];

export default function AIStatus({ onClose }: { onClose: () => void }) {
  const healthy = AI_STATUS_CARDS.every((c) => HEALTHY.includes(c.status));

  return (
    <div className="status-overlay" role="dialog" aria-label="AI STATUS">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">{AI_NAME}</div>
            <div className="status-panel__page-title">{PAGE_TITLE_KM} — {PAGE_TITLE_EN}</div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label="បិទ">✕</button>
        </div>

        <div className="status-panel__meta">
          <span>Last Updated — បានធ្វើបច្ចុប្បន្នភាពចុងក្រោយ: {LAST_UPDATED}</span>
          <span className={healthy ? "status-health status-health--good" : "status-health status-health--warn"}>
            System Health — សុខភាពប្រព័ន្ធ: {healthy ? "ធម្មតា / Normal" : "ត្រូវពិនិត្យ / Needs review"}
          </span>
        </div>

        <div className="status-grid">
          {AI_STATUS_CARDS.map((c) => {
            const label = STATUS_LABELS[c.status];
            return (
              <div className="status-card" key={c.id}>
                <div className="status-card__head">
                  <span className="status-card__name">{c.nameEn} — {c.nameKm}</span>
                  <span className="status-badge" style={{ ["--badge-color" as any]: label.color }}>
                    ● {c.status}
                  </span>
                </div>
                <p className="status-card__desc-km">{c.descKm}</p>
                <p className="status-card__desc-en">{c.descEn}</p>
                {c.extra && (
                  <div className="status-card__extra">
                    {c.extra.map((e) => <div key={e.labelEn}><b>{e.labelEn}:</b> {e.value}</div>)}
                  </div>
                )}
                {c.commands && (
                  <div className="status-card__commands">
                    {c.commands.map((cmd) => <code key={cmd}>{cmd}</code>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
