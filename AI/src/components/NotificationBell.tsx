import { useCallback, useEffect, useRef, useState } from "react";
import "./NotificationBell.css";

// Bell for KI notifications. Talks to KI only through the dev proxy /ki (the KI token is added on the server side).
// GET /ki/api/notifications -> { unread, total, notifications[] } | POST /ki/api/notifications/read {all:true}

type Item = { id: string; time: string; level: "info" | "warn" | "error" | "critical"; source: string; title: string; message: string | null; read: boolean };
type Feed = { unread: number; total: number; notifications: Item[] };

const POLL_MS = 30_000;

async function ki<T>(path: string, init?: RequestInit): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch(`/ki${path}`, { ...init, signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export default function NotificationBell() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setFeed(await ki<Feed>("/api/notifications?limit=30"));
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "error");
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const markAll = async () => {
    try {
      await ki("/api/notifications/read", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ all: true }) });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "error");
    }
  };

  const unread = feed?.unread ?? 0;
  return (
    <div className="kbell" ref={box}>
      <button className="kbell__btn" onClick={() => { setOpen((o) => !o); if (!open) void load(); }} aria-label="Notifications / ការជូនដំណឹង" aria-expanded={open}>
        <BellIcon />
        {unread > 0 && <span className="kbell__badge">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="kbell__panel" role="dialog" aria-label="Notifications">
          <div className="kbell__head">
            <strong>ការជូនដំណឹង</strong>
            <button className="kbell__all" onClick={() => void markAll()} disabled={unread === 0}>អានទាំងអស់</button>
          </div>
          {err && <div className="kbell__err">KI: {err}</div>}
          {!err && feed && feed.notifications.length === 0 && <div className="kbell__empty">គ្មានការជូនដំណឹង</div>}
          <ul className="kbell__list">
            {feed?.notifications.map((n) => (
              <li key={n.id} className={`kbell__item kbell__item--${n.level}${n.read ? " is-read" : ""}`}>
                <div className="kbell__title">{n.title}</div>
                {n.message && <div className="kbell__msg">{n.message}</div>}
                <div className="kbell__meta">{n.source} · {new Date(n.time).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
