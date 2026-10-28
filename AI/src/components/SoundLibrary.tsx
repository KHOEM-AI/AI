import { useCallback, useEffect, useState } from "react";

// Reads and edits the IQ-AI sound library through the Vite proxy (/iqai -> :8799/api/v1).
// The proxy adds the token, so the browser never sees it.

interface Sound {
  id: string;
  name: string;
  category: string;
  tags: string[];
  source: string;
  license: string;
  format: string;
  size: number;
  favorite?: boolean;
}

const CATS: [string, string][] = [
  ["", "ទាំងអស់ · All"],
  ["animals", "សត្វ · Animals"],
  ["human", "មនុស្ស · Human"],
  ["vehicles", "យានយន្ត · Vehicles"],
  ["machines", "ម៉ាស៊ីន · Machines"],
  ["nature", "ធម្មជាតិ · Nature"],
  ["music", "តន្ត្រី · Music"],
  ["objects", "វត្ថុ · Objects"],
  ["signals", "សញ្ញា · Signals"],
  ["ambience", "បរិយាកាស · Ambience"],
  ["synthetic", "សំយោគ · Synthetic"],
  ["effects", "បែបផែន · Effects"],
  ["cinematic", "ភាពយន្ត · Cinematic"],
  ["city", "ទីក្រុង · City"],
  ["unknown", "មិនទាន់ចាត់ថ្នាក់ · Unknown"],
];
const catLabel = (c: string) => CATS.find(([k]) => k === c)?.[1] ?? c;

const box: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: 10,
  padding: 12,
  marginBottom: 12,
};
const input: React.CSSProperties = { borderRadius: 8, padding: 8, fontSize: 15, marginRight: 6, marginBottom: 6 };
const smallBtn: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "none",
  background: "rgba(255,255,255,0.14)",
  color: "#fff",
  marginRight: 8,
  marginTop: 4,
};

async function patchSound(id: string, patch: Record<string, unknown>): Promise<Sound> {
  const r = await fetch(`/iqai/sounds/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const body = await r.json().catch(() => null);
  if (!r.ok || !body) throw new Error(body?.message ?? body?.error ?? `HTTP ${r.status}`);
  return body as Sound;
}

export default function SoundLibrary() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [items, setItems] = useState<Sound[]>([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState("");
  const [pending, setPending] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState({ name: "", category: "unknown", tags: "" });

  const load = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const qs = new URLSearchParams({ limit: "200" });
      if (q.trim()) qs.set("q", q.trim());
      if (category) qs.set("category", category);
      if (favOnly) qs.set("favorite", "true");
      const r = await fetch(`/iqai/sounds?${qs}`);
      const body = await r.json().catch(() => null);
      if (!r.ok || !body) throw new Error(body?.error ?? `HTTP ${r.status}`);
      setItems(body.items as Sound[]);
      setTotal(body.total as number);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  }, [q, category, favOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  const url = (id: string) => `/iqai/sounds/${encodeURIComponent(id)}/content`;

  // Put the server's updated record into the list; drop it if it no longer matches the filters.
  const applyUpdate = (u: Sound) => {
    const visible = (!category || u.category === category) && (!favOnly || u.favorite === true);
    setItems((prev) => (visible ? prev.map((x) => (x.id === u.id ? u : x)) : prev.filter((x) => x.id !== u.id)));
    if (!visible) setTotal((t) => Math.max(0, t - 1));
  };

  const toggleFavorite = async (s: Sound) => {
    setPending(s.id);
    setActionErr("");
    try {
      applyUpdate(await patchSound(s.id, { favorite: s.favorite !== true }));
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : String(e));
    }
    setPending("");
  };

  const startEdit = (s: Sound) => {
    setActionErr("");
    setDraft({ name: s.name, category: s.category, tags: s.tags.join(", ") });
    setEditing(s.id);
  };

  const saveEdit = async (id: string) => {
    setPending(id);
    setActionErr("");
    try {
      const tags = draft.tags.split(",").map((t) => t.trim()).filter(Boolean);
      applyUpdate(await patchSound(id, { name: draft.name, category: draft.category, tags }));
      setEditing("");
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : String(e));
    }
    setPending("");
  };

  return (
    <div style={box}>
      <div style={{ marginBottom: 6 }}>🔊 បណ្ណាល័យសំឡេង · Sound library ({total})</div>
      <input
        style={{ ...input, width: "55%" }}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ស្វែងរក · Search name or tag"
      />
      <select style={input} value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATS.map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
      <label style={{ display: "block", fontSize: 14, marginBottom: 6 }}>
        <input type="checkbox" checked={favOnly} onChange={(e) => setFavOnly(e.target.checked)} />{" "}
        ⭐ តែចូលចិត្ត · Favorites only
      </label>
      {busy && <div>កំពុងដំណើរការ... · Working...</div>}
      {err && <div style={{ color: "#ff8a8a" }}>⚠️ {err}</div>}
      {actionErr && <div style={{ color: "#ff8a8a" }}>⚠️ {actionErr}</div>}
      {!busy && !err && items.length === 0 && <div>មិនមានសំឡេង · No sounds found</div>}
      {items.map((s) => (
        <div key={s.id} style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "8px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 15 }}>{s.name}</div>
            <button
              style={{ background: "none", border: "none", fontSize: 22, color: "#ffd54f", padding: "0 4px" }}
              disabled={pending === s.id}
              onClick={() => void toggleFavorite(s)}
              aria-label={s.favorite ? "Remove from favorites" : "Add to favorites"}
            >
              {s.favorite ? "★" : "☆"}
            </button>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {catLabel(s.category)} · {s.format} · {Math.max(1, Math.round(s.size / 1024))} KB
            {s.tags.length > 0 && ` · ${s.tags.join(", ")}`}
          </div>
          {editing === s.id ? (
            <div style={{ marginTop: 6 }}>
              <input
                style={{ ...input, width: "90%" }}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="ឈ្មោះ · Name"
              />
              <select
                style={input}
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {CATS.filter(([k]) => k !== "").map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
              <input
                style={{ ...input, width: "90%" }}
                value={draft.tags}
                onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                placeholder="ស្លាក · Tags (comma separated)"
              />
              <div>
                <button
                  style={{ ...smallBtn, background: "#4f7cff" }}
                  disabled={pending === s.id}
                  onClick={() => void saveEdit(s.id)}
                >
                  💾 រក្សាទុក · Save
                </button>
                <button style={smallBtn} onClick={() => setEditing("")}>✖ បោះបង់ · Cancel</button>
              </div>
            </div>
          ) : (
            <>
              {playing === s.id ? (
                <audio controls autoPlay src={url(s.id)} style={{ width: "100%", marginTop: 4 }} onEnded={() => setPlaying("")} />
              ) : (
                <button
                  style={{ marginTop: 4, marginRight: 8, padding: "6px 12px", borderRadius: 8, border: "none", background: "#4f7cff", color: "#fff" }}
                  onClick={() => setPlaying(s.id)}
                >
                  ▶ ស្តាប់ · Play
                </button>
              )}
              <button style={smallBtn} onClick={() => startEdit(s)}>✏️ កែ · Edit</button>
              <a href={`${url(s.id)}?download=1`} style={{ color: "#9db8ff", fontSize: 14 }}>⬇ ទាញយក · Download</a>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
