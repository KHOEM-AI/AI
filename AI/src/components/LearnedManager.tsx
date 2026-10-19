import { useCallback, useEffect, useState } from "react";
import { pickText, useLanguageCode } from "../i18n";
import { api } from "../api/client";

type Kind = "text" | "number" | "json" | "lines" | "bool" | "area";
type F = { k: string; label: string; kind?: Kind; ph?: string };
type Op = { sub: string; m: "GET" | "POST"; desc: string; fields?: F[]; preview?: boolean; raw?: boolean; danger?: boolean };

const Q: F = { k: "q", label: "q" };
const LIM: F = { k: "limit", label: "limit", kind: "number" };

const GROUPS: { name: string; ops: Op[] }[] = [
  { name: "អាន", ops: [
    { sub: "count", m: "GET", desc: "ចំនួនសរុប" },
    { sub: "keys", m: "GET", desc: "បញ្ជីសំណួរ", fields: [{ k: "offset", label: "offset", kind: "number" }, LIM] },
    { sub: "get", m: "GET", desc: "យកចម្លើយតាមសំណួរ", fields: [Q] },
    { sub: "exists", m: "GET", desc: "មានសំណួរនេះឬអត់", fields: [Q] },
    { sub: "match", m: "GET", desc: "ផ្គូផ្គងដូច AI", fields: [Q] },
    { sub: "random", m: "GET", desc: "ចៃដន្យមួយ" },
    { sub: "recent", m: "GET", desc: "ថ្មីៗ", fields: [LIM] },
    { sub: "longest", m: "GET", desc: "ចម្លើយវែងជាងគេ", fields: [LIM] },
    { sub: "shortest", m: "GET", desc: "ចម្លើយខ្លីជាងគេ", fields: [LIM] },
    { sub: "by-length", m: "GET", desc: "ត្រងតាមប្រវែង", fields: [{ k: "min", label: "min", kind: "number" }, { k: "max", label: "max", kind: "number" }, { k: "field", label: "field", ph: "a ឬ q" }, LIM] },
    { sub: "export", m: "GET", desc: "នាំចេញ JSON" },
    { sub: "export.txt", m: "GET", desc: "នាំចេញ TXT", raw: true },
  ] },
  { name: "ស្វែងរក", ops: [
    { sub: "search", m: "GET", desc: "ស្វែងរកក្នុងសំណួរ និងចម្លើយ", fields: [Q, LIM] },
    { sub: "starts", m: "GET", desc: "ចាប់ផ្ដើមដោយ", fields: [{ k: "prefix", label: "prefix" }, LIM] },
    { sub: "similar", m: "GET", desc: "ស្រដៀងគ្នា", fields: [Q, LIM] },
    { sub: "suggest", m: "GET", desc: "ផ្ដល់យោបល់", fields: [Q, LIM] },
    { sub: "words", m: "GET", desc: "ពាក្យញឹកញាប់", fields: [LIM] },
  ] },
  { name: "វិភាគ", ops: [
    { sub: "stats", m: "GET", desc: "ស្ថិតិ" },
    { sub: "health", m: "GET", desc: "សុខភាពឯកសារ" },
    { sub: "duplicates", m: "GET", desc: "ចម្លើយស្ទួន" },
    { sub: "validate", m: "GET", desc: "ពិនិត្យបញ្ហា" },
    { sub: "lang-mix", m: "GET", desc: "ភាសាខ្មែរ/Latin" },
    { sub: "routes", m: "GET", desc: "បញ្ជី route" },
  ] },
  { name: "សរសេរ", ops: [
    { sub: "update", m: "POST", desc: "កែចម្លើយ", fields: [Q, { k: "a", label: "a (ចម្លើយថ្មី)", kind: "area" }] },
    { sub: "rename", m: "POST", desc: "ប្ដូរឈ្មោះសំណួរ", fields: [{ k: "from", label: "from" }, { k: "to", label: "to" }, { k: "overwrite", label: "overwrite", kind: "bool" }] },
    { sub: "append", m: "POST", desc: "បន្ថែមចម្លើយ", fields: [Q, { k: "a", label: "a (អត្ថបទបន្ថែម)", kind: "area" }] },
    { sub: "alias", m: "POST", desc: "ចម្លងជាសំណួរថ្មី", fields: [{ k: "from", label: "from" }, { k: "to", label: "to" }, { k: "overwrite", label: "overwrite", kind: "bool" }] },
    { sub: "replace", m: "POST", desc: "ជំនួសអត្ថបទ (មើលមុន)", preview: true, fields: [{ k: "find", label: "find" }, { k: "replace", label: "replace" }] },
    { sub: "bulk", m: "POST", desc: "បន្ថែមច្រើន", fields: [{ k: "items", label: "items", kind: "json", ph: '[{"q":"សំណួរ","a":"ចម្លើយ"}]' }] },
    { sub: "import", m: "POST", desc: "នាំចូល", fields: [{ k: "mode", label: "mode", ph: "merge ឬ skip" }, { k: "data", label: "data", kind: "json", ph: '{"សំណួរ":"ចម្លើយ"}' }] },
  ] },
  { name: "Backup", ops: [
    { sub: "backup", m: "POST", desc: "បង្កើត backup" },
    { sub: "backups", m: "GET", desc: "បញ្ជី backup" },
    { sub: "backup-diff", m: "GET", desc: "ប្រៀបធៀប backup", fields: [{ k: "name", label: "name (learned-....json)" }] },
    { sub: "restore", m: "POST", desc: "ស្ដារ (មើលមុន)", preview: true, danger: true, fields: [{ k: "name", label: "name (learned-....json)" }] },
    { sub: "prune-backups", m: "POST", desc: "លុប backup ចាស់ (មើលមុន)", preview: true, danger: true, fields: [{ k: "keep", label: "keep", kind: "number" }] },
  ] },
  { name: "លុប", ops: [
    { sub: "forget-bulk", m: "POST", desc: "ភ្លេចច្រើន (១ បន្ទាត់ ១ សំណួរ)", danger: true, fields: [{ k: "qs", label: "qs", kind: "lines" }] },
    { sub: "forget-prefix", m: "POST", desc: "ភ្លេចតាម prefix (មើលមុន)", preview: true, danger: true, fields: [{ k: "prefix", label: "prefix" }] },
    { sub: "clean", m: "POST", desc: "សម្អាតធាតុខូច (មើលមុន)", preview: true, danger: true },
    { sub: "clear", m: "POST", desc: "លុបទាំងអស់ (វាយ CLEAR)", danger: true, fields: [{ k: "confirm", label: 'វាយ "CLEAR"' }] },
  ] },
];

const un = (j: any) => (j && typeof j === "object" && "result" in j ? j.result : j);
const errMsg = (e: any) => `❌ ${e?.status ?? ""} ${typeof e?.message === "string" ? e.message : JSON.stringify(e?.message)}`;

function OpCard({ op, lang, onChanged }: { op: Op; lang: string; onChanged: () => void }) {
  const [v, setV] = useState<Record<string, any>>({});
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const set = (k: string, x: any) => { setV((s) => ({ ...s, [k]: x })); setPending(false); };

  function payload(): Record<string, any> {
    const o: Record<string, any> = {};
    for (const f of op.fields ?? []) {
      const x = v[f.k];
      if (f.kind === "bool") { if (x) o[f.k] = true; continue; }
      if (x === undefined || x === "") continue;
      if (f.kind === "number") o[f.k] = Number(x);
      else if (f.kind === "json") o[f.k] = JSON.parse(x);
      else if (f.kind === "lines") o[f.k] = String(x).split("\n").map((s) => s.trim()).filter(Boolean);
      else o[f.k] = x;
    }
    return o;
  }

  async function run(confirm = false) {
    if (op.danger && (confirm || !op.preview) &&
      !window.confirm(pickText(lang, `បញ្ជាក់ ${op.sub} ?`, `Confirm ${op.sub}?`))) return;
    setBusy(true);
    try {
      const p = payload();
      const base = `/api/learned/${op.sub}`;
      if (op.m === "GET") {
        const qs = new URLSearchParams(Object.entries(p).map(([k, x]) => [k, String(x)])).toString();
        const url = qs ? `${base}?${qs}` : base;
        if (op.raw) {
          const r = await fetch(url);
          const t = await r.text();
          if (!r.ok) throw { status: r.status, message: t };
          setOut(t);
        } else setOut(JSON.stringify(un(await api(url)), null, 2));
      } else {
        if (op.preview && confirm) p.confirm = true;
        const r = un(await api(base, { method: "POST", body: JSON.stringify(p) }));
        setOut(JSON.stringify(r, null, 2));
        const empty = r?.matches === 0 || (Array.isArray(r?.wouldDelete) && r.wouldDelete.length === 0);
        setPending(!!op.preview && !confirm && r?.confirmed === false && !empty);
        if (!op.preview || confirm) onChanged();
      }
    } catch (e: any) { setOut(errMsg(e)); }
    finally { setBusy(false); }
  }

  function download() {
    const blob = new Blob([out], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = op.sub === "export.txt" ? "learned.txt" : "learned.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <details style={{ marginTop: 6 }}>
      <summary>{op.m} {op.sub} — {op.desc}</summary>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
        {(op.fields ?? []).map((f) =>
          f.kind === "bool" ? (
            <label key={f.k}><input type="checkbox" checked={!!v[f.k]} onChange={(e) => set(f.k, e.target.checked)} /> {f.label}</label>
          ) : f.kind === "json" || f.kind === "lines" || f.kind === "area" ? (
            <textarea key={f.k} rows={4} placeholder={f.ph ?? f.label} value={v[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} />
          ) : (
            <input key={f.k} placeholder={f.ph ?? f.label} value={v[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} />
          ),
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={busy} onClick={() => run(false)}>
            {op.preview ? pickText(lang, "មើលមុន", "Preview") : pickText(lang, "ដំណើរការ", "Run")}
          </button>
          {pending && <button disabled={busy} onClick={() => run(true)}>⚠️ {pickText(lang, "បញ្ជាក់ ធ្វើពិត", "Confirm")}</button>}
          {out && op.sub.startsWith("export") && <button onClick={download}>⬇</button>}
        </div>
        {out && <pre className="status-card__extra" style={{ whiteSpace: "pre-wrap", maxHeight: 220, overflow: "auto", margin: 0 }}>{out}</pre>}
      </div>
    </details>
  );
}

const PAGE = 20;
type Item = { q: string; a: string };

export default function LearnedManager() {
  const lang = useLanguageCode();
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [data, setData] = useState<{ total: number; items: Item[] } | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("");
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState(GROUPS[0].name);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const qs = `offset=${(page - 1) * PAGE}&limit=${PAGE}${sort ? `&sort=${sort}` : ""}`;
      const [s, h, d] = await Promise.all([
        api("/api/learned/stats"), api("/api/learned/health"), api(`/api/learned/page?${qs}`),
      ]);
      setStats(un(s)); setHealth(un(h)); setData(un(d)); setMsg("");
    } catch (e: any) { setMsg(errMsg(e)); }
    finally { setBusy(false); }
  }, [page, sort]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api("/api/learned/routes").then((j) => {
      const server: string[] = un(j) ?? [];
      const have = new Set<string>(["GET /api/learned/page"]);
      GROUPS.forEach((g) => g.ops.forEach((o) => have.add(`${o.m} /api/learned/${o.sub}`)));
      setMissing(server.filter((r) => !have.has(r)));
    }).catch(() => setMissing(null));
  }, []);

  async function forget(q: string) {
    if (!window.confirm(pickText(lang, `ភ្លេច "${q}" ?`, `Forget "${q}"?`))) return;
    try { await api("/api/forget", { method: "POST", body: JSON.stringify({ q }) }); await load(); }
    catch (e: any) { setMsg(errMsg(e)); }
  }

  async function edit(i: Item) {
    const a = window.prompt(pickText(lang, "ចម្លើយថ្មី", "New answer"), i.a);
    if (a === null || !a.trim()) return;
    try { await api("/api/learned/update", { method: "POST", body: JSON.stringify({ q: i.q, a }) }); await load(); }
    catch (e: any) { setMsg(errMsg(e)); }
  }

  const f = filter.trim().toLowerCase();
  const items = (data?.items ?? []).filter((i) => !f || i.q.toLowerCase().includes(f) || i.a.toLowerCase().includes(f));
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE));
  const group = GROUPS.find((g) => g.name === tab) ?? GROUPS[0];

  return (
    <div style={{ marginTop: 24 }}>
      <div className="status-panel__meta" style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{pickText(lang, "គ្រប់គ្រងចំណេះដឹង", "Manage knowledge")}</strong>
        <button disabled={busy} onClick={load}>↻</button>
      </div>
      {stats && (
        <div className="status-panel__meta">
          {stats.count} · avg {stats.avgAnswerChars}
          {health && <> · backup {health.backups} · {health.parseOk ? "✅" : "❌"} {Math.round((health.sizeBytes ?? 0) / 1024)} KB</>}
        </div>
      )}
      {msg && <div className="status-card__extra">{msg}</div>}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input style={{ flex: 1 }} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={pickText(lang, "ត្រងក្នុងទំព័រនេះ", "Filter this page")} />
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
          <option value="">default</option>
          <option value="reverse">reverse</option>
          <option value="alpha">alpha</option>
          <option value="len">len</option>
        </select>
      </div>
      <div className="status-card__extra" style={{ maxHeight: 300, overflow: "auto" }}>
        {items.map((i) => (
          <div key={i.q} style={{ padding: "6px 0", borderBottom: "1px solid rgba(128,128,128,.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong>{i.q}</strong>
              <span style={{ display: "flex", gap: 6 }}>
                <button disabled={busy} onClick={() => edit(i)}>✏️</button>
                <button disabled={busy} onClick={() => forget(i.q)}>🗑</button>
              </span>
            </div>
            <div style={{ whiteSpace: "pre-wrap", opacity: 0.85 }}>{i.a.length > 200 ? i.a.slice(0, 200) + "…" : i.a}</div>
          </div>
        ))}
        {items.length === 0 && <div>{pickText(lang, "គ្មានទិន្នន័យ", "No data")}</div>}
      </div>
      <div className="status-panel__meta" style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <button disabled={busy || page <= 1} onClick={() => setPage(page - 1)}>‹</button>
        <span>{page} / {pages}</span>
        <button disabled={busy || page >= pages} onClick={() => setPage(page + 1)}>›</button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
        {GROUPS.map((g) => (
          <button key={g.name} style={{ fontWeight: g.name === tab ? 700 : 400 }} onClick={() => setTab(g.name)}>{g.name}</button>
        ))}
      </div>
      {group.ops.map((o) => <OpCard key={o.sub} op={o} lang={lang} onChanged={load} />)}

      {missing && (
        <div className="status-panel__meta" style={{ marginTop: 12 }}>
          {missing.length === 0 ? "✅ UI គ្របដណ្ដប់ route learned ទាំងអស់" : `⚠️ មិនទាន់មាន UI: ${missing.join(", ")}`}
        </div>
      )}
    </div>
  );
}
