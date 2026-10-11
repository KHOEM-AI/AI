// src/ai/storyboard.mjs
// Storyboard: រឿង → ឈុតៗ. ឈុតនីមួយៗយោងទៅតួអង្គ (characters.mjs) និងធនធាន (assets.mjs/library.mjs)
// តាម ID ដូច្នេះអត្តសញ្ញាណមិនប្រែប្រួលពីឈុតមួយទៅឈុតមួយ។ មិនបង្កើតរូប/វីដេអូទេ — ផលិតតែ prompt
// និងរបាយការណ៍ភាពស៊ីសង្វាក់ ដើម្បីបញ្ជូនទៅម៉ូដែល (នៅពេលមាន)។
// កាមេរ៉ា: shot + movement + rig + speed + degrees (orbit 360°, drone, crane, fpv...)។
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { getItem } from "./library.mjs";
import { getCharacter, buildPrompt } from "./characters.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const sbFile = () =>
  process.env.STORYBOARD_FILE || path.join(HERE, "..", "..", "data", "storyboards.json");

// ការពារ id ដូច "constructor" / "__proto__" ដែលជា property ក្នុង Object.prototype
const own = (o, k) => (Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined);

export const STYLES = Object.freeze(["animation", "3d", "realistic", "cinematic"]);
export const ASPECTS = Object.freeze(["16:9", "9:16", "1:1"]);
export const SHOTS = Object.freeze(["wide", "medium", "close", "extreme_close", "aerial", "top_down", "over_the_shoulder"]);
export const MOVES = Object.freeze([
  "static", "pan", "tilt", "zoom", "dolly", "tracking", "handheld", "whip_pan",
  "orbit", "crane_up", "crane_down", "drone_flyover", "drone_follow", "fpv_dive", "spiral_up",
]);
export const RIGS = Object.freeze(["tripod", "handheld", "gimbal", "drone", "crane", "cable_cam", "vehicle_mount"]);
export const SPEEDS = Object.freeze(["slow", "normal", "fast"]);
export const TIMES = Object.freeze(["dawn", "morning", "noon", "afternoon", "golden_hour", "dusk", "night"]);
export const WEATHERS = Object.freeze(["clear", "cloudy", "rain", "storm", "fog", "snow"]);
export const SEASONS = Object.freeze(["dry", "rainy", "cool", "hot"]);
export const STATUSES = Object.freeze(["draft", "approved", "needs_regen"]);
export const OPTIONS = Object.freeze({
  styles: STYLES, aspects: ASPECTS, shots: SHOTS, moves: MOVES, rigs: RIGS, speeds: SPEEDS,
  timesOfDay: TIMES, weathers: WEATHERS, seasons: SEASONS, statuses: STATUSES,
});

const MAX_SCENES = 200, MAX_TEXT = 500;
const EDITABLE = ["title", "location", "characters", "assets", "action", "camera", "lighting",
  "durationSec", "dialogue", "notes", "outfitChangeReason", "timeOfDay", "weather", "season"];

const err = (reason, detail) => ({ ok: false, reason, ...(detail ? { detail } : {}) });
const str = (v, n = MAX_TEXT) => String(v ?? "").normalize("NFC").trim().slice(0, n);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function load() {
  try {
    const j = JSON.parse(fs.readFileSync(sbFile(), "utf8"));
    return j && j.items && !Array.isArray(j.items) ? j.items : {};
  } catch { return {}; }
}
function save(items) {
  const f = sbFile();
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f + ".tmp", JSON.stringify({ version: 1, items }, null, 2));
  fs.renameSync(f + ".tmp", f);
}

// rig លំនាំដើមតាមចលនា: ដ្រូន → drone, ក្រែន → crane, orbit/tracking → gimbal
function defaultRig(shot, movement) {
  if (shot === "aerial" || /^(drone|fpv|spiral)/.test(movement)) return "drone";
  if (movement.startsWith("crane")) return "crane";
  if (movement === "handheld") return "handheld";
  if (["orbit", "tracking", "dolly", "whip_pan"].includes(movement)) return "gimbal";
  return "tripod";
}

// ពិនិត្យ + ធ្វើឱ្យទម្រង់ឈុតស្តង់ដារ; ត្រឡប់ {error} បើយោងទៅអ្វីដែលមិនមាន ឬតម្លៃមិនត្រឹមត្រូវ
function normalizeFields(p) {
  const out = {};
  if ("title" in p) out.title = str(p.title, 120);
  if ("location" in p) out.location = str(p.location, 120);
  if ("action" in p) out.action = str(p.action);
  if ("lighting" in p) out.lighting = str(p.lighting, 120);
  if ("notes" in p) out.notes = str(p.notes);
  if ("outfitChangeReason" in p) out.outfitChangeReason = str(p.outfitChangeReason, 200);
  if ("durationSec" in p) out.durationSec = Math.max(1, Math.min(Number(p.durationSec) || 5, 60));

  for (const [k, list] of [["timeOfDay", TIMES], ["weather", WEATHERS], ["season", SEASONS]]) {
    if (k in p) {
      const v = p[k] || "";
      if (v && !list.includes(v)) return { error: err(`bad_${k}`, String(v)) };
      out[k] = v;
    }
  }

  if ("camera" in p) {
    const c = p.camera || {};
    if (c.shot && !SHOTS.includes(c.shot)) return { error: err("bad_camera", "shot") };
    if (c.movement && !MOVES.includes(c.movement)) return { error: err("bad_camera", "movement") };
    if (c.rig && !RIGS.includes(c.rig)) return { error: err("bad_camera", "rig") };
    if (c.speed && !SPEEDS.includes(c.speed)) return { error: err("bad_camera", "speed") };
    const shot = c.shot || "medium", movement = c.movement || "static";
    const dflt = movement === "orbit" || movement === "spiral_up" ? 360 : 0;
    const degrees = c.degrees === undefined ? dflt : Math.max(0, Math.min(Number(c.degrees) || 0, 720));
    out.camera = {
      shot, angle: str(c.angle, 40) || "eye-level", movement,
      rig: c.rig || defaultRig(shot, movement), speed: c.speed || "normal", degrees,
    };
  }
  if ("characters" in p) {
    const list = Array.isArray(p.characters) ? p.characters : [];
    for (const c of list) if (!getCharacter(c?.id)) return { error: err("unknown_character", String(c?.id)) };
    out.characters = list.map((c) => ({ id: c.id, ...(c.outfit ? { outfit: str(c.outfit, 60) } : {}) }));
  }
  if ("assets" in p) {
    const list = Array.isArray(p.assets) ? p.assets : [];
    for (const id of list) {
      const it = getItem(id);
      if (!it || !it.tags.includes("asset")) return { error: err("unknown_asset", String(id)) };
    }
    out.assets = [...new Set(list)];
  }
  if ("dialogue" in p) {
    const list = Array.isArray(p.dialogue) ? p.dialogue : [];
    for (const d of list)
      if (d.speaker !== "narrator" && !getCharacter(d.speaker)) return { error: err("unknown_character", String(d.speaker)) };
    out.dialogue = list.map((d) => ({ speaker: d.speaker, text: str(d.text), emotion: str(d.emotion, 40) }));
  }
  return { out };
}

export function createStoryboard({ title, style = "cinematic", aspect = "16:9" } = {}) {
  const t = str(title, 120);
  if (!t) return err("empty_title");
  if (!STYLES.includes(style)) return err("bad_style");
  if (!ASPECTS.includes(aspect)) return err("bad_aspect");
  const items = load();
  const id = `sb_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  items[id] = { id, title: t, style, aspect, createdAt: now, updatedAt: now, scenes: [] };
  save(items);
  return { ok: true, storyboard: items[id] };
}

export const getStoryboard = (id) => own(load(), id) ?? null;
export const listStoryboards = () => Object.values(load()).map(({ scenes, ...s }) => ({ ...s, sceneCount: scenes.length }));

export function addScene(sbId, input = {}) {
  const items = load(), sb = own(items, sbId);
  if (!sb) return err("not_found");
  if (sb.scenes.length >= MAX_SCENES) return err("too_many_scenes");
  const n = normalizeFields({ camera: {}, durationSec: 5, characters: [], assets: [], dialogue: [], ...input });
  if (n.error) return n.error;
  const scene = {
    id: `sc_${crypto.randomUUID().slice(0, 8)}`, status: "draft", history: [],
    title: "", location: "", action: "", lighting: "", notes: "", outfitChangeReason: "",
    timeOfDay: "", weather: "", season: "", ...n.out,
  };
  sb.scenes.push(scene);
  sb.updatedAt = new Date().toISOString();
  save(items);
  return { ok: true, scene, index: sb.scenes.length };
}

// កែតែវាលដែលផ្លាស់ប្តូរ និងកត់ before/after; បើឈុតបានអនុម័តហើយត្រូវកែរូបភាព → needs_regen
// camera ជា partial patch: បើប្តូរ shot/movement ដោយមិនប្រាប់ rig/degrees វាគណនាលំនាំដើមឡើងវិញ
export function updateScene(sbId, scId, patch = {}) {
  const items = load(), sb = own(items, sbId);
  const sc = sb?.scenes.find((s) => s.id === scId);
  if (!sc) return err("not_found");
  const picked = Object.fromEntries(Object.entries(patch).filter(([k]) => EDITABLE.includes(k)));
  if (picked.camera) {
    const pc = picked.camera, merged = { ...sc.camera, ...pc };
    if (!("rig" in pc)) delete merged.rig;
    if (!("degrees" in pc)) delete merged.degrees;
    picked.camera = merged;
  }
  const n = normalizeFields(picked);
  if (n.error) return n.error;
  const at = new Date().toISOString();
  let visual = false, changed = 0;
  for (const [k, v] of Object.entries(n.out)) {
    if (same(sc[k], v)) continue;
    sc.history.push({ at, field: k, before: sc[k], after: v });
    sc[k] = v; changed++;
    if (k !== "notes") visual = true;
  }
  if (visual && sc.status === "approved") sc.status = "needs_regen";
  if (changed) { sb.updatedAt = at; save(items); }
  return { ok: true, scene: sc, changed };
}

export function setSceneStatus(sbId, scId, status) {
  if (!STATUSES.includes(status)) return err("bad_status");
  const items = load(), sc = own(items, sbId)?.scenes.find((s) => s.id === scId);
  if (!sc) return err("not_found");
  sc.history.push({ at: new Date().toISOString(), field: "status", before: sc.status, after: status });
  sc.status = status;
  save(items);
  return { ok: true, scene: sc };
}

const describe = (it) => `${it.data.nameEn || it.name}${it.data.appearance ? ` (${it.data.appearance})` : ""}`;

// prompt ដាច់ដោយឡែកក្នុងមួយឈុត → បង្កើតឡើងវិញតែឈុតដែលមិនពេញចិត្ត
export function buildScenePrompt(sbId, scId) {
  const sb = getStoryboard(sbId), idx = sb ? sb.scenes.findIndex((s) => s.id === scId) : -1;
  if (idx < 0) return err("not_found");
  const sc = sb.scenes[idx], c = sc.camera;
  const loc = getItem(sc.location);
  const env = [sc.season && `${sc.season} season`, sc.timeOfDay, sc.weather].filter(Boolean).join(", ");
  const parts = [
    `${sb.style} style, aspect ${sb.aspect}`,
    `Scene ${idx + 1}${sc.title ? `: ${sc.title}` : ""}`,
    `Location: ${loc ? describe(loc) : sc.location || "unspecified"}`,
    ...(env ? [`Environment: ${env}`] : []),
    ...sc.characters.map((x) => `Character: ${buildPrompt(x.id, { outfit: x.outfit }) ?? x.id}`),
    ...sc.assets.map((id) => { const a = getItem(id); return a ? `Object: ${describe(a)}` : null; }).filter(Boolean),
    `Action: ${sc.action}`,
    `Camera: ${c.shot} shot, ${c.angle}, ${c.movement}${c.degrees ? ` ${c.degrees}deg` : ""}, ${c.speed} speed, ${c.rig} rig`,
    `Lighting: ${sc.lighting || "natural"}`,
    `Duration: ${sc.durationSec}s`,
  ];
  return { ok: true, prompt: parts.join("\n"), dialogue: sc.dialogue };
}

// ព្រមានពេលតួអង្គប្តូរសម្លៀកបំពាក់ដោយគ្មានមូលហេតុ (outfitChangeReason) ឬយោងទៅអ្វីដែលត្រូវបានលុប
export function continuityReport(sbId) {
  const sb = getStoryboard(sbId);
  if (!sb) return err("not_found");
  const last = new Map(), warnings = [];
  sb.scenes.forEach((sc, i) => {
    for (const c of sc.characters) {
      if (!getCharacter(c.id)) warnings.push({ scene: i + 1, type: "missing_character", id: c.id });
      if (c.outfit && last.has(c.id) && last.get(c.id) !== c.outfit && !sc.outfitChangeReason)
        warnings.push({ scene: i + 1, type: "outfit_changed_without_reason", id: c.id, from: last.get(c.id), to: c.outfit });
      if (c.outfit) last.set(c.id, c.outfit);
    }
    for (const id of sc.assets) if (!getItem(id)) warnings.push({ scene: i + 1, type: "missing_asset", id });
  });
  return { ok: true, scenes: sb.scenes.length, warnings };
}
