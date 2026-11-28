// KHOEM-AI: story text -> series.json (for IQ-AI scripts/series-runner.mjs)
// usage: node scripts/story-to-series.mjs story.txt [--photos DIR] [--max-photos N] [--per-episode N]
//                [--voice ID] [--cast "name=voice,name=voice"] [--title TEXT] [--out FILE]
// story.txt: narration, plus optional dialogue lines "name: words" and a line "@cast name=voice, name=voice".
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, extname } from 'node:path';
import { buildShotList } from '../src/ai/shotlist.mjs';

const home = homedir();
const expand = (p) => (typeof p === 'string' && p.startsWith('~/') ? home + p.slice(1) : p);
const die = (m) => { console.error('STOP: ' + m); process.exit(1); };
const args = process.argv.slice(2);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d; };
const file = args[0];
if (!file || file.startsWith('--')) die('usage: node scripts/story-to-series.mjs story.txt [--photos DIR] [--max-photos N] [--per-episode N] [--voice ID] [--cast "name=voice,..."] [--title TEXT] [--out FILE]');

let text;
try { text = readFileSync(expand(file), 'utf8'); } catch (e) { die('cannot read ' + file + ': ' + e.message); }
if (!text.trim()) die('the story file is empty');
if (text.length > 20000) die('the story is too long (max 20000 characters per run)');

const photos = [];
const dir = val('--photos');
if (dir) {
  const d = expand(dir);
  if (!existsSync(d)) die('photo folder not found: ' + dir);
  const max = Math.max(1, Number(val('--max-photos', 12)) || 12);
  readdirSync(d).filter((n) => ['.jpg', '.jpeg', '.png', '.webp'].includes(extname(n).toLowerCase())).sort().slice(0, max)
    .forEach((n) => photos.push(join(d, n)));
}

// cast: "name=voice, name=voice" from --cast and from "@cast ..." lines in the story
const castMap = {};
const addCast = (str) => String(str || '').split(/[,;]/).map((x) => x.trim()).filter(Boolean).forEach((p) => {
  const i = p.indexOf('=');
  if (i > 0) castMap[p.slice(0, i).trim()] = p.slice(i + 1).trim();
});
addCast(val('--cast'));
const body = [];
for (const line of text.replace(/\r/g, '').split('\n')) {
  const m = /^@cast\s+(.+)$/u.exec(line.trim());
  if (m) addCast(m[1]); else body.push(line);
}

// narration: sentences (Khmer "។" "៕" and Latin . ! ?) grouped into beats of about 60..220 characters
const MIN = 60, MAX = 220;
function narrate(lines) {
  const sentences = lines.flatMap((l) => l.split(/(?<=[។៕.!?])\s*/u)).map((s) => s.trim()).filter(Boolean);
  const out = [];
  let buf = '';
  for (const s of sentences) {
    if (buf && (buf + ' ' + s).length > MAX) { out.push(buf); buf = ''; }
    buf = buf ? buf + ' ' + s : s;
    if (buf.length >= MIN) { out.push(buf); buf = ''; }
  }
  if (buf) { if (out.length && buf.length < 25) out[out.length - 1] += ' ' + buf; else out.push(buf); }
  return out;
}

const beats = []; // { text, voice|null }
let pending = [];
const flush = () => { narrate(pending).forEach((t) => beats.push({ text: t, voice: null })); pending = []; };
for (const raw of body) {
  const line = raw.trim();
  if (!line) continue;
  const m = /^([^:：]{1,40})[:：]\s*(.+)$/u.exec(line);
  const who = m && m[1].trim();
  if (m && Object.hasOwn(castMap, who)) { flush(); beats.push({ text: m[2].trim(), voice: castMap[who] }); }
  else pending.push(line);
}
flush();
if (!beats.length) die('no text found in the story');
if (beats.length > 300) die('too many beats (' + beats.length + ', max 300): split the story');

const title = val('--title', 'KHOEM-AI story');
const list = buildShotList({ title, beats: beats.map((b) => b.text), maxShots: 300 });
if (!list.total) die('no shots were made from this story');

const per = Math.min(30, Math.max(1, Number(val('--per-episode', 10)) || 10));
const voice = val('--voice');
const episodes = [];
let cut = 0;
list.shots.forEach((shot, i) => {
  const e = Math.floor(i / per);
  if (!episodes[e]) episodes[e] = { title: 'Episode ' + (e + 1), scenes: [] };
  let say = String(shot.narration || '');
  if (say.length > 1000) { say = say.slice(0, 1000); cut++; }
  const scene = { say, seconds: shot.durationSec };
  if (beats[i].voice) scene.voice = beats[i].voice;
  if (photos.length) scene.image = photos[i % photos.length];
  else scene.text = say.slice(0, 600);
  episodes[e].scenes.push(scene);
});

const out = expand(val('--out', '~/series-story.json'));
writeFileSync(out, JSON.stringify({ title: list.title || title, width: 1280, height: 720, ...(voice ? { voice } : {}), episodes }, null, 2));
console.log(`OK ${out}`);
console.log(`${list.total} shots | ${episodes.length} episodes | ~${list.durationSec}s (scenes grow to fit the speech) | ${photos.length} photos`);
console.log('cast: ' + (Object.keys(castMap).length ? Object.entries(castMap).map(([k, v]) => k + '=' + v).join(', ') : '(none, narrator only)') + ' | voiced characters: ' + beats.filter((b) => b.voice).length);
if (photos.length && photos.length < list.total) console.log('note: the photos are reused in turn (' + photos.length + ' photos for ' + list.total + ' shots)');
if (!photos.length) console.log('note: no photos given, so every shot is a text card');
if (cut) console.log('note: ' + cut + ' spoken line(s) were cut to 1000 characters');
