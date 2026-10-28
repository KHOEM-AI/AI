import { useEffect, useRef, useState } from "react";
import type { PointerEvent as PE } from "react";
import { useLanguageCode } from "../i18n";

type Dataset = { path: string; name_en: string; name_km: string; count: number };
type Item = Record<string, unknown>;
type Col = { h: number; s: number; b: number; l: number };
type Saved = { id: string; name: string; cols: Col[] };

const HEX = /^#[0-9a-f]{6}$/i;
const SKIP = new Set(["km", "en", "hex", "name", "light"]);
const KI = "http://" + (typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "localhost") + ":5001/api";
const HM: Record<string, number[]> = { comp: [0, 180], analog: [0, 30, -30, 60, -60], triad: [0, 120, 240], tetrad: [0, 90, 180, 270], mono: [0] };

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

function rgb(h: number, s: number, v: number): [number, number, number] {
  const S = s / 100, V = v / 100;
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round(255 * (V - V * S * Math.max(0, Math.min(k, 4 - k, 1))));
  };
  return [f(5), f(3), f(1)];
}
const hx = (h: number, s: number, v: number) =>
  "#" + rgb(h, s, v).map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
const hexc = (c: Col) => hx(c.h, c.s, c.b);
function unhex(x: string): Col {
  const t = x.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(t.substr(i, 2), 16) / 255);
  const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b);
  let h = 0;
  if (d) {
    h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h: Math.round(h), s: Math.round(mx ? (d / mx) * 100 : 0), b: Math.round(mx * 100), l: 0 };
}
function ink(c: Col): string {
  const [r, g, b] = rgb(c.h, c.s, c.b);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1b1f4a" : "#fff";
}
const rnd = (a: number, b: number) => Math.round(a + Math.random() * (b - a));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const newCol = (): Col => ({ h: rnd(0, 359), s: rnd(40, 95), b: rnd(55, 100), l: 0 });

function harmonize(cs: Col[], base: number, hm: string): Col[] {
  const o = HM[hm];
  if (!o) return cs;
  const b = cs[base];
  const n = cs.length;
  return cs.map((c, i) => {
    if (c.l || i === base) return c;
    const j = (i - base + n) % n;
    if (hm === "mono") {
      return { ...c, h: b.h, s: clamp(b.s + ((j * 17) % 50) - 25, 10, 100), b: clamp(b.b - ((j * 13) % 50) + 10, 25, 100) };
    }
    return { ...c, h: (b.h + o[j % o.length] + 360) % 360, s: b.s, b: b.b };
  });
}

const btn = { background: "#2a3350", color: "inherit", border: 0, borderRadius: 7, padding: "7px 11px", cursor: "pointer" } as const;

export default function ColorLightCenter({ onClose }: { onClose: () => void }) {
  const lang = useLanguageCode();
  const km = lang === "km";

  /* ---- palette designer (saved in KI) ---- */
  const [cols, setCols] = useState<Col[]>([
    { h: 244, s: 30, b: 99, l: 0 }, { h: 350, s: 55, b: 93, l: 0 }, { h: 247, s: 70, b: 95, l: 0 },
    { h: 222, s: 82, b: 82, l: 0 }, { h: 150, s: 60, b: 50, l: 0 },
  ]);
  const [cur, setCur] = useState(0);
  const [harm, setHarm] = useState("custom");
  const [name, setName] = useState("Vibrant colors");
  const [pid, setPid] = useState("p" + Date.now());
  const [kiOk, setKiOk] = useState<boolean | null>(null);
  const [msg, setMsg] = useState("");
  const [kiList, setKiList] = useState<Saved[]>([]);
  const wheelRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef(-1);
  const c0 = cols[Math.min(cur, cols.length - 1)];

  useEffect(() => {
    const c = wheelRef.current;
    const ctx = c ? c.getContext("2d") : null;
    if (!c || !ctx) return;
    const N = 300, R = N / 2, im = ctx.createImageData(N, N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const dx = x - R + 0.5, dy = y - R + 0.5, r = Math.hypot(dx, dy);
        if (r > R) continue;
        const [a, b, d] = rgb((Math.atan2(dy, dx) * 180) / Math.PI + 450, (r / R) * 100, 100);
        im.data.set([a, b, d, 255], (y * N + x) * 4);
      }
    }
    ctx.putImageData(im, 0, 0);
  }, []);

  useEffect(() => {
    let alive = true;
    const ping = () =>
      fetch(KI + "/healthz", { cache: "no-store" })
        .then((r) => alive && setKiOk(r.ok))
        .catch(() => alive && setKiOk(false));
    ping();
    const t = setInterval(ping, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const onDown = (e: PE<HTMLDivElement>) => {
    const t = (e.target as HTMLElement).closest("[data-i]") as HTMLElement | null;
    if (!t) return;
    const i = Number(t.dataset.i);
    drag.current = i;
    setCur(i);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PE<HTMLDivElement>) => {
    const i = drag.current;
    if (i < 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
    const h = Math.round(((Math.atan2(dy, dx) * 180) / Math.PI + 450) % 360);
    const s = Math.round(Math.min(1, Math.hypot(dx, dy) / (r.width / 2)) * 100);
    setHarm("custom");
    setCols((cs) => cs.map((c, k) => (k === i && !c.l ? { ...c, h, s } : c)));
  };

  const slide = (k: "h" | "s" | "b", v: number) => {
    setHarm("custom");
    setCols((cs) => cs.map((c) => (c.l ? c : ({ ...c, [k]: v } as Col))));
  };
  const gen = () =>
    setCols((cs) => {
      const g = cs.map((c) => (c.l ? c : newCol()));
      return harm === "custom" ? g : harmonize(g, Math.min(cur, g.length - 1), harm);
    });
  const pickHarm = (v: string) => {
    setHarm(v);
    setCols((cs) => harmonize(cs, Math.min(cur, cs.length - 1), v));
  };
  const addHex = (x: string) => {
    setCols((cs) => (cs.length >= 24 ? cs : [...cs, unhex(x)]));
    setCur(cols.length);
  };
  const del = () => {
    if (cols.length < 2) return;
    setCols((cs) => cs.filter((_, i) => i !== cur));
    setCur(0);
  };
  const lock = () => setCols((cs) => cs.map((c, i) => (i === cur ? { ...c, l: c.l ? 0 : 1 } : c)));

  const save = async () => {
    try {
      const r = await fetch(KI + "/colors", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pid, name, note: "", cols }),
      });
      setMsg(r.ok ? "Saved · KI ✔" : "KI error " + r.status);
    } catch { setMsg("KI offline"); }
  };
  const loadList = async () => {
    try {
      const j = await (await fetch(KI + "/colors")).json();
      setKiList(Array.isArray(j?.palettes) ? j.palettes : []);
      setMsg("");
    } catch { setMsg("KI offline"); }
  };
  const loadOne = (p: Saved) => {
    const cs = (Array.isArray(p.cols) ? p.cols : []).slice(0, 24).map((c) => ({
      h: clamp(Number(c.h) || 0, 0, 360), s: clamp(Number(c.s) || 0, 0, 100), b: clamp(Number(c.b) || 0, 0, 100), l: c.l ? 1 : 0,
    }));
    if (!cs.length) return;
    setCols(cs); setCur(0); setHarm("custom"); setName(String(p.name || "")); setPid(String(p.id));
  };

  /* ---- library (khoem-now datasets: colors + lights) ---- */
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
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((body) => {
        if (cancelled) return;
        const list: Dataset[] = Array.isArray(body?.datasets) ? body.datasets : [];
        setDatasets(list);
        if (list.length > 0) setPath(list[0].path);
      })
      .catch((err) => { if (!cancelled) setError(String(err?.message || err)); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setBusy(true);
      setError(null);
      const url = "/api/colorlight/data?path=" + encodeURIComponent(path) + "&q=" + encodeURIComponent(query.trim()) + "&limit=300";
      fetch(url)
        .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then((body) => {
          if (cancelled) return;
          if (Array.isArray(body?.items)) {
            setItems(body.items); setRaw(null);
            setTotal(typeof body.total === "number" ? body.total : body.items.length);
          } else { setItems([]); setRaw(body); setTotal(0); }
        })
        .catch((err) => { if (!cancelled) setError(String(err?.message || err)); })
        .finally(() => { if (!cancelled) setBusy(false); });
    }, query ? 300 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [path, query]);

  const cur0 = hexc(c0);
  const row = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 10 } as const;

  return (
    <div className="status-overlay" role="dialog" aria-label="Color and Light">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">Color and Light</div>
            <div className="status-panel__page-title">{km ? "ពណ៌ និងអំពូលភ្លើង" : "Colors and lights"}</div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label={km ? "បិទ" : "Close"}>✕</button>
        </div>

        {/* palette header */}
        <div style={row}>
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
          <span style={{ fontSize: 12, color: kiOk ? "#00A651" : "#FF4040" }}>
            ● {kiOk === null ? "KI …" : kiOk ? "KI" : "KI offline"}
          </span>
        </div>
        <div style={row}>
          <select value={harm} onChange={(e) => pickHarm(e.target.value)} style={{ flex: 1 }}>
            <option value="custom">Harmony: Custom</option>
            <option value="comp">Complementary</option>
            <option value="analog">Analogous</option>
            <option value="triad">Triadic</option>
            <option value="tetrad">Tetradic</option>
            <option value="mono">Monochromatic</option>
          </select>
        </div>

        {/* color wheel */}
        <div
          onPointerDown={onDown} onPointerMove={onMove}
          onPointerUp={() => { drag.current = -1; }} onPointerCancel={() => { drag.current = -1; }}
          style={{ position: "relative", width: "100%", maxWidth: 280, aspectRatio: "1", margin: "12px auto 0", touchAction: "none" }}
        >
          <canvas ref={wheelRef} width={300} height={300} style={{ width: "100%", height: "100%", borderRadius: "50%", display: "block" }} />
          {cols.map((c, i) => {
            const a = ((c.h - 90) * Math.PI) / 180;
            return (
              <div
                key={i} data-i={i}
                style={{
                  position: "absolute", width: 22, height: 22, marginLeft: -11, marginTop: -11, borderRadius: "50%",
                  left: 50 + (Math.cos(a) * c.s) / 2 + "%", top: 50 + (Math.sin(a) * c.s) / 2 + "%",
                  background: hexc(c), border: "2px solid #fff", cursor: "grab",
                  boxShadow: i === cur ? "0 0 0 3px #b8862b" : "0 0 0 1px #0006",
                }}
              />
            );
          })}
        </div>

        {/* HSB sliders: apply to all colors */}
        <div style={{ marginTop: 12 }}>
          <div className="status-panel__meta">{km ? "អនុវត្តលើគ្រប់ពណ៌ · HSB" : "Apply to all colors · HSB"}</div>
          {([["h", "Hue", 360], ["s", "Saturation", 100], ["b", "Brightness", 100]] as const).map(([k, label, mx]) => (
            <div key={k} style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{label}</span><span>{c0[k]}</span>
              </div>
              <input type="range" min={0} max={mx} value={c0[k]} onChange={(e) => slide(k, Number(e.target.value))} style={{ width: "100%" }} />
            </div>
          ))}
        </div>

        {/* color cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))", gap: 8, marginTop: 12 }}>
          {cols.map((c, i) => (
            <div
              key={i} onClick={() => setCur(i)}
              style={{
                background: hexc(c), color: ink(c), height: 110, borderRadius: 10, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between",
                padding: "8px 4px", fontWeight: 700, fontSize: 12,
                border: i === cur ? "2px solid #fff" : "2px solid transparent",
              }}
            >
              <span>{hexc(c)}FF</span><span>{c.l ? "🔒" : ""}</span>
            </div>
          ))}
        </div>

        {/* lamp preview */}
        <div style={{ ...row, justifyContent: "flex-start" }}>
          <span style={{ width: 44, height: 44, borderRadius: "50%", background: cur0, boxShadow: "0 0 24px 8px " + cur0 + "99" }} />
          <span>{km ? "អំពូល (មើលជាមុន)" : "Lamp preview"} · {cur0}</span>
        </div>

        {/* actions */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <button style={btn} onClick={gen}>Generate</button>
          <button style={btn} onClick={() => { setCols((cs) => (cs.length >= 24 ? cs : [...cs, newCol()])); setCur(cols.length); }}>+ Add</button>
          <button style={btn} onClick={lock}>Lock</button>
          <button style={btn} onClick={del}>Delete</button>
          <button style={{ ...btn, background: "#b8862b" }} onClick={save}>Save → KI</button>
          <button style={btn} onClick={loadList}>Load from KI</button>
        </div>
        {msg && <div className="status-panel__meta" style={{ marginTop: 6 }}>{msg}</div>}
        {kiList.length > 0 && (
          <select defaultValue="" onChange={(e) => { const p = kiList[Number(e.target.value)]; if (p) loadOne(p); }} style={{ width: "100%", marginTop: 8 }}>
            <option value="" disabled>KI palettes…</option>
            {kiList.map((p, i) => <option key={p.id} value={i}>{p.name}</option>)}
          </select>
        )}

        {/* library: khoem-now data (colors + lights) */}
        <div className="status-panel__meta" style={{ marginTop: 18 }}>
          {km ? "បណ្ណាល័យ khoem-now · ចុចពណ៌ដើម្បីបន្ថែម" : "khoem-now library · tap a color to add"}
        </div>
        <select value={path} onChange={(e) => setPath(e.target.value)} style={{ width: "100%", margin: "8px 0" }}>
          {datasets.map((d) => (
            <option key={d.path} value={d.path}>{(km ? d.name_km || d.name_en : d.name_en) + " (" + d.count + ")"}</option>
          ))}
        </select>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={km ? "ស្វែងរក (ឈ្មោះ ឬ hex)" : "Search (name or hex)"} style={{ width: "100%", marginBottom: 8 }} />

        {error && <p className="status-card__err">{error}</p>}
        {busy && <div className="status-panel__meta">{km ? "កំពុងផ្ទុក…" : "Loading…"}</div>}
        {!busy && !error && items.length > 0 && <div className="status-panel__meta">{items.length} / {total}</div>}
        {raw !== null && (
          <div className="status-card__extra">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.85em" }}>{JSON.stringify(raw, null, 2)}</pre>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {items.map((it, i) => (
            <div key={i} onClick={() => { const x = hexOf(it); if (x) addHex(x); }}
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: hexOf(it) ? "pointer" : "default" }}>
              <span style={{ width: 36, height: 36, flex: "0 0 36px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.25)", background: hexOf(it) || "transparent" }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{titleOf(it)}</div>
                <div style={{ fontSize: "0.85em", opacity: 0.75, wordBreak: "break-word" }}>{detailOf(it)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
