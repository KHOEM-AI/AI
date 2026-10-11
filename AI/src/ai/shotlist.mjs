// Shot list builder: pure function, no file/network I/O.
// Characters, assets and voices are INJECTED by the caller.
const clean = (s) => String(s ?? "").trim();

export function splitBeats(text) {
  return clean(text)
    .split(/\n+|(?<=[។.!?])\s+/)
    .map(clean)
    .filter(Boolean);
}

const nameOf = (a) => [a?.nameKm, a?.nameEn, a?.name].map(clean).filter(Boolean);

export function buildShotList({ title = "", beats = [], characters = [], assets = [], voices = {}, maxShots = 60 } = {}) {
  const raw = Array.isArray(beats) ? beats : splitBeats(beats);
  const list = raw.map(clean).filter(Boolean).slice(0, Math.max(1, maxShots));
  const chars = Array.isArray(characters) ? characters.filter((c) => c && clean(c.name)) : [];
  const pool = Array.isArray(assets) ? assets.filter(Boolean) : [];
  const v = voices && typeof voices === "object" ? voices : {};
  const shots = list.map((beat, i) => {
    const present = chars.filter((c) => beat.includes(clean(c.name)));
    const asset = pool.find((a) => nameOf(a).some((n) => beat.includes(n))) ?? null;
    return {
      n: i + 1,
      beat,
      narration: beat,
      characters: present.map((c) => ({
        id: c.id ?? null,
        name: clean(c.name),
        prompt: c.prompt ?? null,
        voice: v[c.id] ?? v[c.name] ?? null,
      })),
      asset: asset ? { id: asset.id ?? null, name: nameOf(asset)[0] ?? null } : null,
      durationSec: Math.min(12, Math.max(3, Math.round(beat.length / 15))), // estimate only
    };
  });
  return {
    title: clean(title),
    total: shots.length,
    durationSec: shots.reduce((a, s) => a + s.durationSec, 0),
    shots,
  };
}
