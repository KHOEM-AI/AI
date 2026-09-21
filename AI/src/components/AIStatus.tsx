import { useEffect, useState } from "react";
import {
  AI_STATUS_CARDS, STATUS_LABELS, AI_NAME,
  PAGE_TITLE_KM, PAGE_TITLE_EN, StatusCode,
} from "../data/aiStatus";
import {
  API_HEALTH_TIMEOUT_MS, HEALTH_MAX_RETRIES,
  OFFLINE_AFTER_FAILED_CHECKS, STATUS_POLL_INTERVAL_MS,
} from "../config/timeouts.mjs";

interface Shown {
  status: StatusCode;
  reasonKm: string;
  reasonEn: string;
  lastChecked?: string;
  lastGood?: string;
  ms?: number;
  http?: number;
  error?: string;
  module?: string;
}
interface ServerCard {
  id: string; status: string; reasonKm?: string; reasonEn?: string;
  lastChecked?: string; responseTimeMs?: number; error?: string; module?: string;
}
interface ServerData {
  checkedAt: string;
  system: { status: string; reasonKm?: string; reasonEn?: string; lastChecked?: string };
  cards: ServerCard[];
}
interface Snapshot { api: Shown; system: Shown; cards: Record<string, Shown> }
interface Probe { kind: "response" | "timeout" | "network"; ok: boolean; http?: number; ms: number; data?: any }

const GOOD = new Set<string>(["ONLINE", "READY", "ACTIVE", "DEVELOPING", "HEALTHY"]);
const SERVER_ID: Record<string, string> = { "english-brain": "english", "khmer-brain": "khmer" };

const asCode = (s: string): StatusCode => (s in STATUS_LABELS ? (s as StatusCode) : "UNKNOWN");
const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("en-GB") : "—");

async function timedFetch(url: string, ms: number): Promise<Probe> {
  const ctrl = new AbortController();
  const t0 = performance.now();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    const elapsed = Math.round(performance.now() - t0);
    const isJson = (r.headers.get("content-type") || "").includes("application/json");
    // ចម្លើយមិនមែន JSON (ឧ. Vite proxy ពេល backend ស្លាប់) = server មិនបានឆ្លើយតបពិត
    if (!isJson) return { kind: "network", ok: false, http: r.status, ms: elapsed };
    const data = await r.json().catch(() => null);
    return { kind: "response", ok: r.ok, http: r.status, ms: elapsed, data };
  } catch (e: any) {
    const elapsed = Math.round(performance.now() - t0);
    return { kind: e?.name === "AbortError" ? "timeout" : "network", ok: false, ms: elapsed };
  } finally {
    clearTimeout(timer);
  }
}

function Diag({ s }: { s: Shown }) {
  const bad = !GOOD.has(s.status);
  return (
    <div className="status-card__diag">
      {s.reasonKm && <div>{s.reasonKm}</div>}
      {s.reasonEn && <div>{s.reasonEn}</div>}
      {s.status === "TIMEOUT" ? (
        <div>Timeout: {(s.ms ?? 0).toLocaleString("en-US")} ms</div>
      ) : (
        (s.http !== undefined || s.ms !== undefined) && (
          <div>
            {s.http !== undefined ? `HTTP ${s.http}` : ""}
            {s.http !== undefined && s.ms !== undefined ? " · " : ""}
            {s.ms !== undefined ? `${s.ms} ms` : ""}
          </div>
        )
      )}
      {s.module && <div>Module: {s.module}</div>}
      {s.error && <div className="status-card__err">Error: {s.error}</div>}
      <div>Last checked — ពិនិត្យចុងក្រោយ: {fmtTime(s.lastChecked)}</div>
      {bad && <div>Last successful check: {fmtTime(s.lastGood)}</div>}
    </div>
  );
}

export default function AIStatus({ onClose }: { onClose: () => void }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    let fails = 0;
    const lastGood: Record<string, string> = {};

    const stamp = (id: string, s: Shown): Shown => {
      if (GOOD.has(s.status) && s.lastChecked) lastGood[id] = s.lastChecked;
      return { ...s, lastGood: lastGood[id] };
    };

    const run = async () => {
      let res = await timedFetch("/api/health", API_HEALTH_TIMEOUT_MS);
      for (let i = 0; i < HEALTH_MAX_RETRIES && res.kind !== "response"; i++) {
        res = await timedFetch("/api/health", API_HEALTH_TIMEOUT_MS);
      }
      const checked = new Date().toISOString();
      let api: Shown;
      let server: ServerData | null = null;

      if (res.ok) {
        fails = 0;
        api = {
          status: "ONLINE",
          reasonKm: "កំពុងដំណើរការ និងអាចទទួល request។",
          reasonEn: "Running and able to receive requests.",
          lastChecked: checked, http: res.http, ms: res.ms,
        };
        const st = await timedFetch("/api/status", API_HEALTH_TIMEOUT_MS);
        if (st.ok && st.data && Array.isArray(st.data.cards)) server = st.data as ServerData;
      } else if (res.kind === "response") {
        fails = 0;
        api = {
          status: "ERROR",
          reasonKm: "API ឆ្លើយតប ប៉ុន្តែ health check បរាជ័យ។",
          reasonEn: "The API responded, but the health check failed.",
          lastChecked: checked, http: res.http, ms: res.ms,
        };
      } else {
        fails += 1;
        const secs = API_HEALTH_TIMEOUT_MS / 1000;
        if (fails >= OFFLINE_AFTER_FAILED_CHECKS) {
          api = {
            status: "OFFLINE",
            reasonKm: `មិនអាចភ្ជាប់ API បាន (health check បរាជ័យ ${fails} ដងជាប់គ្នា)។`,
            reasonEn: `Cannot reach the API (${fails} consecutive failed health checks).`,
            lastChecked: checked, http: res.http,
          };
        } else if (res.kind === "timeout") {
          api = {
            status: "TIMEOUT",
            reasonKm: `API មិនបានឆ្លើយតបក្នុងរយៈពេល ${secs} វិនាទី។ (${fails}/${OFFLINE_AFTER_FAILED_CHECKS})`,
            reasonEn: `The API did not respond within ${secs} seconds. (${fails}/${OFFLINE_AFTER_FAILED_CHECKS})`,
            lastChecked: checked, ms: API_HEALTH_TIMEOUT_MS,
          };
        } else {
          api = {
            status: "UNKNOWN",
            reasonKm: `ការភ្ជាប់បរាជ័យ (${fails}/${OFFLINE_AFTER_FAILED_CHECKS}) មិនទាន់ដឹងស្ថានភាពពិត។`,
            reasonEn: `Connection failed (${fails}/${OFFLINE_AFTER_FAILED_CHECKS}); real status not yet known.`,
            lastChecked: checked, http: res.http,
          };
        }
      }

      const cards: Record<string, Shown> = {};
      for (const c of AI_STATUS_CARDS) {
        if (c.id === "api") { cards[c.id] = stamp(c.id, api); continue; }
        const sc = server?.cards.find((x) => x.id === (SERVER_ID[c.id] ?? c.id));
        let shown: Shown;
        if (sc) {
          shown = {
            status: asCode(sc.status),
            reasonKm: sc.reasonKm ?? "", reasonEn: sc.reasonEn ?? "",
            lastChecked: sc.lastChecked ?? checked, ms: sc.responseTimeMs,
            error: sc.error, module: sc.module,
          };
        } else if (api.status === "ONLINE") {
          shown = {
            status: "UNKNOWN",
            reasonKm: "មិនបានទទួល status របស់ module នេះពី /api/status។",
            reasonEn: "No status for this module was returned by /api/status.",
            lastChecked: checked,
          };
        } else {
          shown = {
            status: "UNKNOWN",
            reasonKm: "មិនអាចត្រួតពិនិត្យបាន ព្រោះ API មិនឆ្លើយតប។",
            reasonEn: "Cannot be checked because the API is not responding.",
            lastChecked: checked,
          };
        }
        cards[c.id] = stamp(c.id, shown);
      }

      let system: Shown;
      if (server) {
        system = {
          status: asCode(server.system.status),
          reasonKm: server.system.reasonKm ?? "", reasonEn: server.system.reasonEn ?? "",
          lastChecked: server.system.lastChecked ?? checked,
        };
      } else if (api.status === "OFFLINE" || api.status === "ERROR") {
        system = { status: api.status, reasonKm: api.reasonKm, reasonEn: api.reasonEn, lastChecked: checked };
      } else {
        system = {
          status: "UNKNOWN",
          reasonKm: "មិនទាន់មានទិន្នន័យ health គ្រប់គ្រាន់។",
          reasonEn: "Not enough health data yet.",
          lastChecked: checked,
        };
      }
      system = stamp("__system", system);

      if (!stopped) setSnap({ api, system, cards });
    };

    const loop = async () => {
      await run();
      if (!stopped) timer = window.setTimeout(loop, STATUS_POLL_INTERVAL_MS);
    };
    loop();

    return () => {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);

  const pending: Shown = {
    status: "LOADING",
    reasonKm: "កំពុងពិនិត្យលើកដំបូង",
    reasonEn: "First check in progress",
  };
  const system = snap?.system ?? pending;
  const sysLabel = STATUS_LABELS[system.status];

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
          <span className={system.status === "HEALTHY" ? "status-health status-health--good" : "status-health status-health--warn"}>
            System Health — សុខភាពប្រព័ន្ធ: {system.status} — {sysLabel.km}
          </span>
          {system.reasonKm && <span>{system.reasonKm}</span>}
          {system.reasonEn && <span>{system.reasonEn}</span>}
          <span>Last checked — ពិនិត្យចុងក្រោយ: {fmtTime(system.lastChecked)}</span>
          {!GOOD.has(system.status) && <span>Last successful check: {fmtTime(system.lastGood)}</span>}
        </div>

        <div className="status-grid">
          {AI_STATUS_CARDS.map((c) => {
            const s = snap?.cards[c.id] ?? pending;
            const label = STATUS_LABELS[s.status];
            return (
              <div className="status-card" key={c.id}>
                <div className="status-card__head">
                  <span className="status-card__name">{c.nameEn} — {c.nameKm}</span>
                  <span className="status-badge" style={{ ["--badge-color" as any]: label.color }}>
                    ● {s.status} — {label.km}
                  </span>
                </div>
                <p className="status-card__desc-km">{c.descKm}</p>
                <p className="status-card__desc-en">{c.descEn}</p>
                <Diag s={s} />
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
