import { useEffect, useState } from "react";
import { useLanguageCode } from "../i18n";

type Dataset = { path: string; name_en: string; name_km: string; count: number };
type Item = Record<string, unknown>;

const HEX = /^#[0-9a-f]{6}$/i;
const SKIP = new Set(["km", "en", "hex", "name", "light"]);

function str(v: unknown): string {
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

function hexOf(it: Item): string {
  for (const v of Object.values(it)) {
    if (typeof v === "string" && HEX.test(v)) return v;
  }
  return "";
}

function titleOf(it: Item): string {
  return str(it.km) || str(it.en) || str(it.light) || str(it.name) || str(it.id) || "-";
}

function detailOf(it: Item): string {
  const title = titleOf(it);
  const en = str(it.en);
  const hex = hexOf(it);
  const parts: string[] = [];
  if (en && en !== title) parts.push(en);
  if (hex) parts.push(hex);
  for (const [key, v] of Object.entries(it)) {
    if (SKIP.has(key)) continue;
    const s = str(v);
    if (s && s !== title && !HEX.test(s)) parts.push(s);
  }
  return parts.join(" · ").slice(0, 140);
}

export default function ColorLightCenter({ onClose }: { onClose: () => void }) {
  const lang = useLanguageCode();
  const km = lang === "km";

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [path, setPath] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [raw, setRaw] = useState<unknown | null>(null);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/colorlight")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((body) => {
        if (cancelled) return;
        const list: Dataset[] = Array.isArray(body?.datasets) ? body.datasets : [];
        setDatasets(list);
        if (list.length > 0) setPath(list[0].path);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err?.message || err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setBusy(true);
      setError(null);
      const url =
        "/api/colorlight/data?path=" + encodeURIComponent(path) +
        "&q=" + encodeURIComponent(query.trim()) + "&limit=300";
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then((body) => {
          if (cancelled) return;
          if (Array.isArray(body?.items)) {
            setItems(body.items);
            setRaw(null);
            setTotal(typeof body.total === "number" ? body.total : body.items.length);
          } else {
            setItems([]);
            setRaw(body);
            setTotal(0);
          }
        })
        .catch((err) => {
          if (!cancelled) setError(String(err?.message || err));
        })
        .finally(() => {
          if (!cancelled) setBusy(false);
        });
    }, query ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [path, query]);

  return (
    <div className="status-overlay" role="dialog" aria-label="Color and Light">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">Color and Light</div>
            <div className="status-panel__page-title">
              {km ? "ពណ៌ និងអំពូលភ្លើង" : "Colors and lights"}
            </div>
          </div>
          <button
            className="status-panel__close"
            onClick={onClose}
            aria-label={km ? "បិទ" : "Close"}
          >
            ✕
          </button>
        </div>

        <select
          value={path}
          onChange={(e) => setPath(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        >
          {datasets.map((d) => (
            <option key={d.path} value={d.path}>
              {(km ? d.name_km || d.name_en : d.name_en) + " (" + d.count + ")"}
            </option>
          ))}
        </select>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={km ? "ស្វែងរក (ឈ្មោះ ឬ hex)" : "Search (name or hex)"}
          style={{ width: "100%", marginBottom: 8 }}
        />

        {error && <p className="status-card__err">{error}</p>}
        {busy && <div className="status-panel__meta">{km ? "កំពុងផ្ទុក…" : "Loading…"}</div>}
        {!busy && !error && items.length > 0 && (
          <div className="status-panel__meta">
            {items.length} / {total}
          </div>
        )}

        {raw !== null && (
          <div className="status-card__extra">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.85em" }}>
              {JSON.stringify(raw, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  flex: "0 0 36px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: hexOf(it) || "transparent",
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{titleOf(it)}</div>
                <div style={{ fontSize: "0.85em", opacity: 0.75, wordBreak: "break-word" }}>
                  {detailOf(it)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
