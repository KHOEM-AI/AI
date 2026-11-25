// KHOEM-AI: story text -> series.json (for IQ-AI scripts/series-runner.mjs)
// usage: node scripts/story-to-series.mjs story.txt [--photos DIR] [--max-photos N] [--per-episode N]
//                                         [--voice ID] [--title TEXT] [--out FILE]
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
if (!file || file.startsWith('--')) die('usage: node scripts/story-to-series.mjs story.txt [--photos DIR] [--max-photos N] [--per-episode N] [--voice ID] [--title TEXT] [--out FILE]');

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

// 1) sentences (Khmer "។" "៕" and Latin . ! ?), 2) group them into beats of about 60..220 characters
const sentences = text.replace(/\r/g, '').split('\n')
  .flatMap((line) => line.split(/(?<=[។៕.!?])\s*/u))
  .map((s) => s.trim()).filter(Boolean);
const MIN = 60, MAX = 220;
const beats = [];
let buf = '';
for (const s of sentences) {
  if (buf && (buf + ' ' + s).length > MAX) { beats.push(buf); buf = ''; }
  buf = buf ? buf + ' ' + s : s;
  if (buf.length >= MIN) { beats.push(buf); buf = ''; }
}
if (buf) { if (beats.length && buf.length < 25) beats[beats.length - 1] += ' ' + buf; else beats.push(buf); }

const title = val('--title', 'KHOEM-AI story');
const list = buildShotList({ title, beats, maxShots: 300 });
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
  if (photos.length) scene.image = photos[i % photos.length];
  else scene.text = say.slice(0, 600);
  episodes[e].scenes.push(scene);
});

const out = expand(val('--out', '~/series-story.json'));
writeFileSync(out, JSON.stringify({ title: list.title || title, width: 1280, height: 720, ...(voice ? { voice } : {}), episodes }, null, 2));
console.log(`OK ${out}`);
console.log(`${list.total} shots | ${episodes.length} episodes | ~${list.durationSec}s (scenes grow to fit the speech) | ${photos.length} photos`);
if (photos.length && photos.length < list.total) console.log('note: the photos are reused in turn (' + photos.length + ' photos for ' + list.total + ' shots)');
if (!photos.length) console.log('note: no photos given, so every shot is a text card');
if (cut) console.log('note: ' + cut + ' spoken line(s) were cut to 1000 characters');
