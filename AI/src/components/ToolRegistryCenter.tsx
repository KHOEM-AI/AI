import { useState } from "react";
import { useT, useLanguageCode, pickText } from "../i18n";
import { useKhoem } from "../hooks/useKhoem";

interface Tool {
  id: string; action: string; name: string; description: string; capabilities: string[];
}

async function api(url: string, opts: RequestInit = {}) {
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  const json = await r.json();
  return (json && typeof json === "object" && "result" in json) ? json.result : json;
}

export default function ToolRegistryCenter({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguageCode();
  const k = useKhoem(lang);
  const kk = (key: string, fb: string) => k(key) || fb;
  const [tools, setTools] = useState<Tool[] | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Tool[] | null>(null);
  const [riskId, setRiskId] = useState("");
  const [riskInfo, setRiskInfo] = useState<unknown | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadTools() {
    setBusy("list"); setError(null);
    try {
      const d = await api("/api/tools");
      setTools(d.tools ?? []);
    } catch { setError("tool list failed"); } finally { setBusy(null); }
  }

  async function searchTools() {
    if (!query.trim()) return;
    setBusy("find"); setError(null);
    try {
      const d = await api(`/api/tools/find?q=${encodeURIComponent(query.trim())}`);
      setHits(d.hits ?? []);
    } catch { setError("tool search failed"); } finally { setBusy(null); }
  }

  async function checkRisk() {
    if (!riskId.trim()) return;
    setBusy("risk"); setError(null);
    try {
      setRiskInfo(await api(`/api/tools/${encodeURIComponent(riskId.trim())}/risk`));
    } catch { setError("risk check failed"); } finally { setBusy(null); }
  }

  return (
    <div className="status-overlay" role="dialog" aria-label="Tool Registry Center">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">Tool Registry</div>
            <div className="status-panel__page-title">
              {kk("ai.menu.toolreg01", pickText(lang, "រកមើល tool/API ដែល AI អាចប្រើ", "Discover tools/APIs the AI can use"))}
            </div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        {error && <div className="status-card__err">{error}</div>}

        <div className="status-panel__meta" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button disabled={busy === "list"} onClick={loadTools}>
            {kk("ai.menu.toolreg02", pickText(lang, "ផ្ទុក Tools ទាំងអស់", "Load all tools"))}
          </button>
        </div>

        {tools && (
          <div className="status-grid" style={{ marginTop: 8 }}>
            {tools.length === 0 && (
              <div className="status-card">
                <p className="status-card__desc-km">{kk("ai.menu.toolreg03", pickText(lang, "គ្មាន tool", "No tools registered"))}</p>
              </div>
            )}
            {tools.map((tool) => (
              <div className="status-card" key={tool.id}>
                <div className="status-card__head">
                  <span className="status-card__name">{tool.name}</span>
                  <span className="status-badge" style={{ "--badge-color": "#38bdf8" } as React.CSSProperties}>
                    {tool.action}
                  </span>
                </div>
                <div className="status-card__extra">
                  <div>{tool.description}</div>
                  <div>{kk("ai.menu.toolreg04", pickText(lang, "សមត្ថភាព", "Capabilities"))}: {tool.capabilities.join(", ") || "—"}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{kk("ai.menu.toolreg05", pickText(lang, "ស្វែងរក Tool", "Find tool"))}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={kk("ai.menu.toolreg06", pickText(lang, "ពាក្យគន្លឹះ", "keyword"))} />
          <button disabled={busy === "find"} onClick={searchTools}>
            {kk("ai.menu.toolreg07", pickText(lang, "ស្វែងរក", "Search"))}
          </button>
        </div>
        {hits && (
          <div className="status-card__extra">
            {hits.length === 0
              ? kk("ai.menu.toolreg08", pickText(lang, "រកមិនឃើញ", "Not found"))
              : hits.map((h) => <div key={h.id}>{h.name} ({h.id})</div>)}
          </div>
        )}

        <div className="status-panel__meta" style={{ marginTop: 16 }}>
          <span>{kk("ai.menu.toolreg09", pickText(lang, "ត្រួតពិនិត្យ Risk", "Check risk"))}</span>
        </div>
        <div className="status-panel__meta" style={{ display: "flex", gap: 8 }}>
          <input value={riskId} onChange={(e) => setRiskId(e.target.value)}
            placeholder={kk("ai.menu.toolreg10", pickText(lang, "Tool ID", "Tool ID"))} />
          <button disabled={busy === "risk"} onClick={checkRisk}>
            {kk("ai.menu.toolreg11", pickText(lang, "ត្រួតពិនិត្យ", "Check"))}
          </button>
        </div>
        {riskInfo !== null && (
          <div className="status-card__extra">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.85em" }}>
              {JSON.stringify(riskInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
