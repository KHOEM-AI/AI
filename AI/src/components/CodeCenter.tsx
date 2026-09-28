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
  const [allSymbols, setAllSymbols] = useState<{ path: string; kind: string; name: string }[] | null>(null);
  const [circular, setCircular] = useState<string[][] | null>(null);
  const [sandboxRelPath, setSandboxRelPath] = useState("");
  const [sandboxNewContent, setSandboxNewContent] = useState("");
  const [sandboxReason, setSandboxReason] = useState("");
  const [sandboxResult, setSandboxResult] = useState<unknown | null>(null);
  const [legacyScan, setLegacyScan] = useState<unknown | null>(null);
  const [legacyCheck, setLegacyCheck] = useState<unknown | null>(null);
  const [legacyFindQ, setLegacyFindQ] = useState("");
  const [legacyFind, setLegacyFind] = useState<unknown | null>(null);
  const [legacyFuncsFile, setLegacyFuncsFile] = useState("");
  const [legacyFuncs, setLegacyFuncs] = useState<unknown | null>(null);
  const [legacyReadFile, setLegacyReadFile] = useState("");
  const [legacyRead, setLegacyRead] = useState<unknown | null>(null);
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

  async function loadAllSymbols() {
    setBusy("all-symbols"); setError(null);
    try {
      const d = await api("/api/code/symbols");
      const rows = [];
      for (const f of d.files ?? []) {
        for (const name of f.functions ?? []) rows.push({ path: f.path, kind: "function", name });
        for (const name of f.classes ?? []) rows.push({ path: f.path, kind: "class", name });
        for (const name of f.interfaces ?? []) rows.push({ path: f.path, kind: "interface", name });
        for (const name of f.types ?? []) rows.push({ path: f.path, kind: "type", name });
      }
      setAllSymbols(rows);
    } catch { setError("symbol list failed"); } finally { setBusy(null); }
  }

  async function loadCircular() {
    setBusy("circular"); setError(null);
    try {
      const d = await api("/api/code/circular");
      setCircular(d.cycles ?? []);
    } catch { setError("circular check failed"); } finally { setBusy(null); }
  }

  async function runSandboxTest() {
    if (!sandboxRelPath.trim() || !sandboxNewContent) return;
    setBusy("sandbox"); setError(null);
    try {
      setSandboxResult(await api("/api/sandbox/test", {
        method: "POST",
        body: JSON.stringify({ relPath: sandboxRelPath.trim(), newContent: sandboxNewContent, reason: sandboxReason.trim() || undefined }),
      }));
    } catch { setError("sandbox test failed"); } finally { setBusy(null); }
  }

  async function runLegacyScan() {
    setBusy("legacy-scan"); setError(null);
    try { setLegacyScan(await api("/api/scan")); }
    catch { setError("legacy scan failed"); } finally { setBusy(null); }
  }

  async function runLegacyCheck() {
    setBusy("legacy-check"); setError(null);
    try { setLegacyCheck(await api("/api/check")); }
    catch { setError("legacy check failed"); } finally { setBusy(null); }
  }

  async function runLegacyFind() {
    if (!legacyFindQ.trim()) return;
    setBusy("legacy-find"); setError(null);
    try { setLegacyFind(await api(`/api/find?q=${encodeURIComponent(legacyFindQ.trim())}`)); }
    catch { setError("legacy find failed"); } finally { setBusy(null); }
  }

  async function runLegacyFuncs() {
    if (!legacyFuncsFile.trim()) return;
    setBusy("legacy-funcs"); setError(null);
    try { setLegacyFuncs(await api(`/api/funcs?file=${encodeURIComponent(legacyFuncsFile.trim())}`)); }
    catch { setError("legacy funcs failed"); } finally { setBusy(null); }
  }

  async function runLegacyRead() {
    if (!legacyReadFile.trim()) return;
    setBusy("legacy-read"); setError(null);
    try { setLegacyRead(await api(`/api/read?file=${encodeURIComponent(legacyReadFile.trim())}`)); }
    catch { setError("legacy read failed"); } finally { setBusy(null); }
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
            <span>{pickText(lang, "ចំនួនឯកសារ", "Files indexed")}: {index.files?.length ?? 0}</span>
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

        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{pickText(lang, "រាល់ Symbol ក្នុងគម្រោង", "All symbols in project")}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <button disabled={busy === "all-symbols"} onClick={loadAllSymbols}>
            {pickText(lang, "ផ្ទុកទាំងអស់", "Load all")}
          </button>
        </div>
        {allSymbols && (
          <div className="status-card__extra">
            {allSymbols.length === 0
              ? pickText(lang, "គ្មាន", "None")
              : allSymbols.map((s, i) => <div key={i}>{s.path} — {s.name} ({s.kind})</div>)}
          </div>
        )}

        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{pickText(lang, "រក Circular Dependency", "Find circular dependencies")}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <button disabled={busy === "circular"} onClick={loadCircular}>
            {pickText(lang, "ត្រួតពិនិត្យ", "Check")}
          </button>
        </div>
        {circular && (
          <div className="status-card__extra">
            {circular.length === 0
              ? pickText(lang, "រកមិនឃើញ circular dependency", "No circular dependencies found")
              : circular.map((cycle, i) => <div key={i}>{cycle.join(" → ")}</div>)}
          </div>
        )}

        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{pickText(lang, "សាកល្បងកូដក្នុង Sandbox", "Test code in sandbox")}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            value={sandboxRelPath}
            onChange={(e) => setSandboxRelPath(e.target.value)}
            placeholder="src/ai/khoem.mjs"
          />
          <textarea
            value={sandboxNewContent}
            onChange={(e) => setSandboxNewContent(e.target.value)}
            placeholder={pickText(lang, "ខ្លឹមសារកូដថ្មីទាំងស្រុង", "full new file content")}
            rows={8}
            style={{ fontFamily: "monospace", fontSize: "0.85em" }}
          />
          <input
            value={sandboxReason}
            onChange={(e) => setSandboxReason(e.target.value)}
            placeholder={pickText(lang, "មូលហេតុ (មិនចាំបាច់)", "reason (optional)")}
          />
          <button disabled={busy === "sandbox" || !sandboxRelPath.trim() || !sandboxNewContent} onClick={runSandboxTest}>
            {pickText(lang, "រត់សាកល្បង", "Run test")}
          </button>
        </div>
        {sandboxResult !== null && (
          <div className="status-card__extra">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.85em" }}>
              {JSON.stringify(sandboxResult, null, 2)}
            </pre>
          </div>
        )}

        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{pickText(lang, "ឧបករណ៍ចាស់ (Legacy Phase 1)", "Legacy tools (Phase 1)")}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button disabled={busy === "legacy-scan"} onClick={runLegacyScan}>
            {pickText(lang, "Scan", "Scan")}
          </button>
          <button disabled={busy === "legacy-check"} onClick={runLegacyCheck}>
            {pickText(lang, "Check", "Check")}
          </button>
        </div>
        {legacyScan !== null && (
          <div className="status-card__extra">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.85em" }}>{JSON.stringify(legacyScan, null, 2)}</pre>
          </div>
        )}
        {legacyCheck !== null && (
          <div className="status-card__extra">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.85em" }}>{JSON.stringify(legacyCheck, null, 2)}</pre>
          </div>
        )}

        <div className="status-panel__meta" style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={legacyFindQ} onChange={(e) => setLegacyFindQ(e.target.value)} placeholder={pickText(lang, "ពាក្យស្វែងរក", "search term")} />
          <button disabled={busy === "legacy-find" || !legacyFindQ.trim()} onClick={runLegacyFind}>
            {pickText(lang, "Find", "Find")}
          </button>
        </div>
        {legacyFind !== null && (
          <div className="status-card__extra">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.85em" }}>{JSON.stringify(legacyFind, null, 2)}</pre>
          </div>
        )}

        <div className="status-panel__meta" style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={legacyFuncsFile} onChange={(e) => setLegacyFuncsFile(e.target.value)} placeholder="src/ai/khoem.mjs" />
          <button disabled={busy === "legacy-funcs" || !legacyFuncsFile.trim()} onClick={runLegacyFuncs}>
            {pickText(lang, "Funcs", "Funcs")}
          </button>
        </div>
        {legacyFuncs !== null && (
          <div className="status-card__extra">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.85em" }}>{JSON.stringify(legacyFuncs, null, 2)}</pre>
          </div>
        )}

        <div className="status-panel__meta" style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={legacyReadFile} onChange={(e) => setLegacyReadFile(e.target.value)} placeholder="src/ai/khoem.mjs" />
          <button disabled={busy === "legacy-read" || !legacyReadFile.trim()} onClick={runLegacyRead}>
            {pickText(lang, "Read", "Read")}
          </button>
        </div>
        {legacyRead !== null && (
          <div className="status-card__extra">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.85em" }}>{JSON.stringify(legacyRead, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
