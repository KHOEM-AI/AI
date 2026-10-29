import { readRecentAuditEvents } from "./audit.mjs";
import { lookupCountry } from "./geoLookup.mjs";

function flagEmoji(code) {
  if (!code || code.length !== 2) return "🏳️";
  const base = 0x1f1e6;
  return [...code.toUpperCase()].map((c) => String.fromCodePoint(base + c.charCodeAt(0) - 65)).join("");
}

function whereFor(ip) {
  if (!ip) return { km: "គ្មាន IP", en: "no IP" };
  const geo = lookupCountry(ip);
  if (geo?.local) return { km: "ម៉ាស៊ីនក្នុងតំបន់ (localhost)", en: "local machine (localhost)" };
  if (geo?.code) return { km: `${flagEmoji(geo.code)} ${geo.code}`, en: `${flagEmoji(geo.code)} ${geo.code}` };
  return { km: "មិនស្គាល់ប្រទេស", en: "unknown country" };
}

function messageFor(entry) {
  const ip = entry.data?.ip || null;
  const action = entry.data?.action || entry.data?.path || "?";
  const actor = entry.data?.actor || "មិនស្គាល់";
  const where = whereFor(ip);
  const ipTxt = ip ? ` (${ip})` : "";
  return {
    at: entry.at,
    event: entry.event,
    ip,
    action,
    actor,
    message_km: `⚠ ការព្យាយាមគ្មានសិទ្ធិលើ "${action}" ពី ${where.km}${ipTxt} — អះអាងខ្លួនឯងជា "${actor}" (មិនទាន់ផ្ទៀងផ្ទាត់)`,
    message_en: `⚠ Unauthorized attempt on "${action}" from ${where.en}${ipTxt} — claimed as "${actor}" (unverified)`,
  };
}

// Note: "actor" is self-reported by the caller (x-actor header), not authenticated —
// it is shown for context only and must never be treated as a confirmed identity.
export function buildSecurityAlerts(limit = 100) {
  const events = readRecentAuditEvents(500);
  const alerts = events
    .filter((e) => e.event === "AUTH_DENY" || e.event === "POLICY_DENY")
    .slice(-limit)
    .reverse()
    .map(messageFor);
  return { count: alerts.length, alerts };
}
