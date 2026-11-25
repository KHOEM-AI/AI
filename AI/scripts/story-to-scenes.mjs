// KHOEM-AI: series.json (from story-to-series) -> 3D Studio "All Scenes" JSON (one scene per story scene)
// usage: node scripts/story-to-scenes.mjs series.json [--out FILE]
// Import in 3D Studio with "Import All Scenes". The extra "shot" field (camera, lighting, seconds) is ignored by Studio.
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

const home = homedir();
const expand = (p) => (typeof p === 'string' && p.startsWith('~/') ? home + p.slice(1) : p);
const die = (m) => { console.error('STOP: ' + m); process.exit(1); };
const args = process.argv.slice(2);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d; };
const file = args[0];
if (!file || file.startsWith('--')) die('usage: node scripts/story-to-scenes.mjs series.json [--out FILE]');

let series;
try { series = JSON.parse(readFileSync(expand(file), 'utf8')); } catch (e) { die('cannot read ' + file + ': ' + e.message); }
if (!series || !Array.isArray(series.episodes) || !series.episodes.length) die('series.json needs a non-empty "episodes" array');

// shape, x, y, z, color, scale
const RULES = [
  { re: /ភូមិ|ផ្ទះ|village|house/i, add: [['house', -3, 0, -2, '#c9a26b', 1.2], ['tree', 3, 0, -3, '#2f7d3b', 1]] },
  { re: /វាល|ស្រែ|field|rice/i, add: [['grass', -1, 0, 1, '#5fae4b', 1], ['grass', 1.5, 0, 0.5, '#5fae4b', 1], ['hill', 0, 0, -6, '#4f8f3f', 2]] },
  { re: /ព្រៃ|ដើមឈើ|forest|tree/i, add: [['bigtree', -4, 0, -1, '#2f7d3b', 1], ['palmtree', 4, 0, -1, '#3a8f45', 1]] },
  { re: /ផ្កាយ|ព្រះច័ន្ទ|star|moon/i, add: [['star', -2, 4, -4, '#fff3a0', 0.6], ['moon', 3, 4.5, -5, '#e8e8ff', 0.8]] },
  { re: /ធ្លាក់|meteor/i, add: [['meteor', 2, 2.5, -2, '#ff9a3c', 0.8]] },
  { re: /ចម្លែក|ភ្ញៀវ|alien|glow/i, add: [['ufo', 0, 1.2, 0, '#9fe6ff', 0.8]] },
  { re: /ដំណើរ|ដើរ|journey|road|walk/i, add: [['palmtree', -3, 0, -3, '#3a8f45', 1], ['bench', 2, 0, 0, '#8b5a2b', 1]] },
];
const NIGHT = /យប់|ផ្កាយ|ព្រះច័ន្ទ|night|star|moon/i;
const CAMERAS = { front: { position: [0, 0, 10], target: [0, 0, 0] }, iso: { position: [4, 3, 7], target: [0, 0, 0] } };
const ONE = { x: 1, y: 1, z: 1 };

const scenes = [];
const now = Date.now();
series.episodes.forEach((ep, ei) => {
  (ep.scenes || []).forEach((sc, si) => {
    const text = String(sc.say || sc.text || '');
    const base = `ep${ei + 1}-s${si + 1}`;
    const objects = [];
    const mk = (shape, x, y, z, color, s, name) => objects.push({
      id: `${base}-${objects.length + 1}`, name: name || `${shape} ${objects.length + 1}`, shape, color,
      metalness: 0.1, roughness: 0.8, position: { x, y, z }, rotation: { x: 0, y: 0, z: 0 },
      scale: { x: s, y: s, z: s }, visible: true, locked: false, textureData: null,
    });
    mk('groundpatch', 0, 0, 0, '#3a7d44', 4, 'ground');
    for (const r of RULES) if (r.re.test(text)) r.add.forEach((a) => mk(...a));
    if (objects.length === 1) { mk('tree', 3, 0, -2, '#2f7d3b', 1); }
    const night = NIGHT.test(text);
    scenes.push({
      id: base,
      name: `Ep${ei + 1} S${si + 1} ${text.slice(0, 24)}`,
      objects,
      ambientIntensity: night ? 0.3 : 2.0,
      directionalIntensity: night ? 1.0 : 3.0,
      backgroundColor: night ? '#050a14' : '#87ceeb',
      thumbnail: null,
      createdAt: now,
      updatedAt: now,
      shot: { episode: ei + 1, scene: si + 1, seconds: sc.seconds || 4, lighting: night ? 'night' : 'day', voice: sc.voice || null, say: text, camera: sc.voice ? CAMERAS.front : CAMERAS.iso },
    });
  });
});
if (!scenes.length) die('no scenes found');

const out = expand(val('--out', '~/scenes-story.json'));
writeFileSync(out, JSON.stringify({ version: 1, exportedAt: now, app: 'KHOEM-AI 3D Studio', type: 'all-scenes', scenes }, null, 2));
console.log(`OK ${out}`);
scenes.forEach((s) => console.log(`${s.id} | ${s.shot.lighting} | cam ${s.shot.voice ? 'front' : 'iso'} | ${s.shot.seconds}s | ${s.objects.map((o) => o.shape).join(',')}`));
