// src/ai/videoPlan.mjs
// storyboard → render plan (pure). យកតែ scene ដែល approved ដោយមនុស្ស។
import { getStoryboard } from "./storyboard.mjs";

export const FPS = 25;
const SIZES = { "16:9": [1280, 720], "9:16": [720, 1280], "1:1": [720, 720] };
const ZOOM_IN = new Set(["zoom", "dolly", "crane_down", "drone_follow", "fpv_dive"]);
const ZOOM_OUT = new Set(["crane_up", "drone_flyover"]);
const PAN = new Set(["pan", "whip_pan", "tracking", "orbit", "spiral_up"]);
const AMOUNT = { slow: 0.15, normal: 0.3, fast: 0.5 };

export function motionFor(camera = {}) {
  const m = camera.movement || "static";
  const amount = AMOUNT[camera.speed] ?? AMOUNT.normal;
  if (ZOOM_IN.has(m)) return { type: "zoom_in", amount };
  if (ZOOM_OUT.has(m)) return { type: "zoom_out", amount };
  if (PAN.has(m)) return { type: "pan_right", amount };
  return { type: "static", amount: 0 };
}

export function planFromStoryboard(sb, { onlyApproved = true } = {}) {
  if (!sb || !Array.isArray(sb.scenes)) return { ok: false, reason: "bad_storyboard" };
  const [width, height] = SIZES[sb.aspect] || SIZES["16:9"];
  const scenes = [], skipped = [];
  let start = 0;
  sb.scenes.forEach((sc, i) => {
    if (onlyApproved && sc.status !== "approved") {
      skipped.push({ sceneId: sc.id, index: i + 1, reason: `status_${sc.status}` });
      return;
    }
    const durationSec = Math.max(1, Math.min(Number(sc.durationSec) || 5, 60));
    scenes.push({
      index: i + 1, sceneId: sc.id, title: sc.title || "",
      startSec: start, durationSec, frames: Math.round(durationSec * FPS),
      camera: sc.camera || {}, motion: motionFor(sc.camera),
      dialogue: Array.isArray(sc.dialogue) ? sc.dialogue : [],
      caption: (sc.dialogue || []).map((d) => d.text).filter(Boolean).join(" "),
    });
    start += durationSec;
  });
  if (!scenes.length) return { ok: false, reason: "no_approved_scenes", skipped };
  return { ok: true, storyboardId: sb.id, title: sb.title || "", aspect: sb.aspect,
    width, height, fps: FPS, totalSec: start, scenes, skipped };
}

export function buildVideoPlan(sbId, opts) {
  const sb = getStoryboard(sbId);
  if (!sb) return { ok: false, reason: "not_found" };
  return planFromStoryboard(sb, opts);
}
