import geoip from "geoip-lite";

// Best-effort, approximate country only — never a precise location or identity.
export function lookupCountry(ip) {
  if (!ip) return null;
  const clean = String(ip).replace(/^::ffff:/, "");
  if (clean === "127.0.0.1" || clean === "::1") return { local: true, code: null };
  try {
    const g = geoip.lookup(clean);
    return g && g.country ? { local: false, code: g.country } : null;
  } catch {
    return null;
  }
}
