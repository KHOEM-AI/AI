import { useCallback, useEffect, useState } from "react";
import { pickText, useLanguageCode } from "../i18n";
import { api } from "../api/client";

type Item = { q: string; a: string };
type Page = { total: number; offset: number; limit: number; items: Item[] };

const un = <T,>(j: any): T => (j && typeof j === "object" && "result" in j ? j.result : j);

export default function LearnedManager() {
  const lang = useLanguageCode();
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [filter, setFilter] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (p: number) => {
    setBusy(true);
    try {
      const [s, h, d] = await Promise.all([
        api("/api/learned/stats"),
        api("/api/learned/health"),
        api(`/api/learned/page?page=${p}`),
      ]);
      setStats(un(s)); setHealth(un(h)); setData(un<Page>(d)); setMsg("");
    } catch (e: any) {
      setMsg(`❌ ${e?.status ?? ""} ${e?.message ?? ""}`);
    } finally { setBusy(false); }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  async function backup() {
    setBusy(true);
    try {
      setMsg("✅ " + JSON.stringify(un(await api("/api/learned/backup", { method: "POST", body: "{}" }))));
      await load(page);
    } catch (e: any) { setMsg(`❌ ${e?.status ?? ""} ${e?.message ?? ""}`); }
    finally { setBusy(false); }
  }

  async function forget(q: string) {
    if (!window.confirm(pickText(lang, `ភ្លេច "${q}" ?`, `Forget "${q}"?`))) return;
    setBusy(true);
    try {
      await api("/api/forget", { method: "POST", body: JSON.stringify({ q }) });
      await load(page);
    } catch (e: any) { setMsg(`❌ ${e?.status ?? ""} ${e?.message ?? ""}`); setBusy(false); }
  }

  const f = filter.trim().toLowerCase();
  const items = (data?.items ?? []).filter((i) => !f || i.q.toLowerCase().includes(f) || i.a.toLowerCase().includes(f));
  const pages = data ? Math.max(1, Math.ceil(data.total / (data.limit || 50))) : 1;

  return (
    <div style={{ marginTop: 24 }}>
      <div className="status-panel__meta" style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{pickText(lang, "គ្រប់គ្រងចំណេះដឹង", "Manage knowledge")}</strong>
        <span style={{ display: "flex", gap: 8 }}>
          <button disabled={busy} onClick={() => load(page)}>↻</button>
          <button disabled={busy} onClick={backup}>{pickText(lang, "Backup", "Backup")}</button>
        </span>
      </div>

      {stats && (
        <div className="status-panel__meta">
          {pickText(lang, "ចំនួន", "Count")}: {stats.count} · {pickText(lang, "ប្រវែងចម្លើយមធ្យម", "avg answer")}: {stats.avgAnswerChars}
          {health && <> · backup: {health.backups} · {health.parseOk ? "✅" : "❌"} {Math.round((health.sizeBytes ?? 0) / 1024)} KB</>}
        </div>
      )}
      {msg && <div className="status-card__extra" style={{ whiteSpace: "pre-wrap" }}>{msg}</div>}

      <input
        style={{ width: "100%", marginTop: 8 }}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={pickText(lang, "ស្វែងរកក្នុងទំព័រនេះ", "Filter this page")}
      />

      <div className="status-card__extra" style={{ maxHeight: 320, overflow: "auto" }}>
        {items.map((i) => (
          <div key={i.q} style={{ padding: "6px 0", borderBottom: "1px solid rgba(128,128,128,.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong>{i.q}</strong>
              <button disabled={busy} onClick={() => forget(i.q)}>🗑</button>
            </div>
            <div style={{ whiteSpace: "pre-wrap", opacity: 0.85 }}>
              {i.a.length > 200 ? i.a.slice(0, 200) + "…" : i.a}
            </div>
          </div>
        ))}
        {items.length === 0 && <div>{pickText(lang, "គ្មានទិន្នន័យ", "No data")}</div>}
      </div>

      <div className="status-panel__meta" style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <button disabled={busy || page <= 1} onClick={() => setPage(page - 1)}>‹</button>
        <span>{page} / {pages}</span>
        <button disabled={busy || page >= pages} onClick={() => setPage(page + 1)}>›</button>
      </div>
    </div>
  );
}
