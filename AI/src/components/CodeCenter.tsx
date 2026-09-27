import { useState } from "react";
import { useT, useLanguageCode, pickText } from "../i18n";

interface FileEntry {
  path: string; filename: string; extension: string; sizeBytes: number;
  lineCount: number | null; language: string; todoCount: number | null; fixmeCount: number | null;
}
interface IndexData { scannedAt: string | null; files: FileEntry[] }
interface Finding {
  id: string; severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: string; file: string | null; evidence: string; explanation: string; suggestedFix: string;
}
interface Health {
  checkedAt: string; build: { ok: boolean; errorCount: number };
  todoCount: number; fixmeCount: number; oversizedFiles: { path: string; lineCount: number }[];
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "#f87171", HIGH: "#fb923c", MEDIUM: "#facc15", LOW: "#38bdf8",
};

async function api(url: string, opts: RequestInit = {}) {
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  const json = await r.json();
  // ម៉ូឌុល /api/code/* ទាំងអស់ រុំ payload ក្នុង { result: ... }
  return (json && typeof json === "object" && "result" in json) ? json.result : json;
}

export default function CodeCenter({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguageCode();
  const [index, setIndex] = useState<IndexData | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [symbolName, setSymbolName] = useState("");
  const [symbolHits, setSymbolHits] = useState<{ path: string; kind: string }[] | null>(null);
  const [depFile, setDepFile] = useState("");
  const [deps, setDeps] = useState<{ dependencies: string[]; dependents: string[] } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runScan() {
    setBusy("scan"); setError(null);
    try {
      await api("/api/code/scan", { method: "POST" });
      const idx = await api("/api/code/index");
      setIndex(idx);
    } catch { setError("scan failed"); } finally { setBusy(null); }
  }

  async function loadHealth() {
    setBusy("health"); setError(null);
    try { setHealth(await api("/api/code/health")); }
    catch { setError("health check failed"); } finally { setBusy(null); }
  }

  async function loadFindings() {
    setBusy("findings"); setError(null);
    try {
      const d = await api("/api/code/findings");
      setFindings(d.findings ?? []);
    } catch { setError("findings failed"); } finally { setBusy(null); }
  }

  async function searchSymbol() {
    if (!symbolName.trim()) return;
    setBusy("symbol"); setError(null);
    try {
      const d = await api(`/api/code/symbol?name=${encodeURIComponent(symbolName.trim())}`);
      setSymbolHits(d.hits ?? []);
    } catch { setError("symbol search failed"); } finally { setBusy(null); }
  }

  async function loadDeps() {
    if (!depFile.trim()) return;
    setBusy("deps"); setError(null);
    try {
      const a = await api(`/api/code/dependencies?file=${encodeURIComponent(depFile.trim())}`);
      const b = await api(`/api/code/dependents?file=${encodeURIComponent(depFile.trim())}`);
      setDeps({ dependencies: a.dependencies ?? [], dependents: b.dependents ?? [] });
    } catch { setError("dependency lookup failed"); } finally { setBusy(null); }
  }

  return (
    <div className="status-overlay" role="dialog" aria-label="Code Center">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">Code Data Center</div>
            <div className="status-panel__page-title">
              {pickText(lang, "ស្កេន វិភាគ និងត្រួតពិនិត្យសុខភាពកូដ", "Scan, analyze, and check code health")}
            </div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        {error && <div className="status-card__err">{error}</div>}

        <div className="status-panel__meta" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button disabled={busy === "scan"} onClick={runScan}>
            {pickText(lang, "ស្កេនកូដឡើងវិញ", "Rescan repo")}
          </button>
          <button disabled={busy === "health"} onClick={loadHealth}>
            {pickText(lang, "ពិនិត្យសុខភាពកូដ", "Check code health")}
          </button>
          <button disabled={busy === "findings"} onClick={loadFindings}>
            {pickText(lang, "មើល Findings", "View findings")}
          </button>
        </div>

        {index && (
          <div className="status-panel__meta" style={{ marginTop: 16 }}>
            <span>{pickText(lang, "ចំនួនឯកសារ", "Files indexed")}: {index.files.length}</span>
          </div>
        )}

        {health && (
          <div className="status-grid" style={{ marginTop: 8 }}>
            <div className="status-card">
              <div className="status-card__head">
                <span className="status-card__name">{pickText(lang, "សុខភាពកូដ", "Code health")}</span>
                <span className="status-badge" style={{ "--badge-color": health.build.ok ? "#4ade80" : "#f87171" } as React.CSSProperties}>
                  {health.build.ok ? "OK" : `${health.build.errorCount} errors`}
                </span>
              </div>
              <div className="status-card__extra">
                <div>TODO: {health.todoCount} · FIXME: {health.fixmeCount}</div>
                <div>{pickText(lang, "ឯកសារធំពេក", "Oversized files")}: {health.oversizedFiles.length}</div>
              </div>
            </div>
          </div>
        )}

        {findings && (
          <div className="status-grid" style={{ marginTop: 8 }}>
            {findings.length === 0 && (
              <div className="status-card">
                <p className="status-card__desc-km">{pickText(lang, "គ្មានបញ្ហារកឃើញ", "No findings")}</p>
              </div>
            )}
            {findings.map((f) => (
              <div className="status-card" key={f.id}>
                <div className="status-card__head">
                  <span className="status-card__name">{f.category}{f.file ? ` · ${f.file}` : ""}</span>
                  <span className="status-badge" style={{ "--badge-color": SEV_COLOR[f.severity] } as React.CSSProperties}>
                    {f.severity}
                  </span>
                </div>
                <p className="status-card__desc-en">{f.evidence}</p>
                <div className="status-card__extra">
                  <div>{f.explanation}</div>
                  <div><b>{pickText(lang, "ដំណោះស្រាយ", "Fix")}:</b> {f.suggestedFix}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{pickText(lang, "ស្វែងរក Symbol", "Find symbol")}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input
            value={symbolName}
            onChange={(e) => setSymbolName(e.target.value)}
            placeholder={pickText(lang, "ឈ្មោះ function/class", "function/class name")}
          />
          <button disabled={busy === "symbol"} onClick={searchSymbol}>
            {pickText(lang, "ស្វែងរក", "Search")}
          </button>
        </div>
        {symbolHits && (
          <div className="status-card__extra">
            {symbolHits.length === 0
              ? pickText(lang, "រកមិនឃើញ", "Not found")
              : symbolHits.map((h, i) => <div key={i}>{h.path} ({h.kind})</div>)}
          </div>
        )}

        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{pickText(lang, "ត្រួតពិនិត្យ Dependency", "Check dependencies")}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input
            value={depFile}
            onChange={(e) => setDepFile(e.target.value)}
            placeholder="src/ai/khoem.mjs"
          />
          <button disabled={busy === "deps"} onClick={loadDeps}>
            {pickText(lang, "មើល", "Check")}
          </button>
        </div>
        {deps && (
          <div className="status-card__extra">
            <div><b>{pickText(lang, "ហៅប្រើ", "Depends on")}:</b> {deps.dependencies.join(", ") || "—"}</div>
            <div><b>{pickText(lang, "ត្រូវបានហៅដោយ", "Used by")}:</b> {deps.dependents.join(", ") || "—"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
