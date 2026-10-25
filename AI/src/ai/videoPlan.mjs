// src/ai/videoPlan.mjs
// Storyboard -> render plan. Only human-approved scenes are rendered.
import { getStoryboard } from "./storyboard.mjs";

export const FPS = 25;

const SIZES = {
  "720p": {
    "16:9": [1280, 720],
    "9:16": [720, 1280],
    "1:1": [720, 720],
  },
  "1080p": {
    "16:9": [1920, 1080],
    "9:16": [1080, 1920],
    "1:1": [1080, 1080],
  },
  "4k": {
    "16:9": [3840, 2160],
    "9:16": [2160, 3840],
    "1:1": [2160, 2160],
  },
  "5k": {
    "16:9": [5120, 2880],
    "9:16": [2880, 5120],
    "1:1": [2880, 2880],
  },
  "6k": {
    "16:9": [6144, 3456],
    "9:16": [3456, 6144],
    "1:1": [3456, 3456],
  },
  "8k": {
    "16:9": [7680, 4320],
    "9:16": [4320, 7680],
    "1:1": [4320, 4320],
  },
  "10k": {
    "16:9": [10240, 5760],
    "9:16": [5760, 10240],
    "1:1": [5760, 5760],
  },
  "12k": {
    "16:9": [11520, 6480],
    "9:16": [6480, 11520],
    "1:1": [6480, 6480],
  },
  "16k": {
    "16:9": [15360, 8640],
    "9:16": [8640, 15360],
    "1:1": [8640, 8640],
  },
  "18k": {
    "16:9": [17280, 9720],
    "9:16": [9720, 17280],
    "1:1": [9720, 9720],
  },
  "20k": {
    "16:9": [19200, 10800],
    "9:16": [10800, 19200],
    "1:1": [10800, 10800],
  },
  "22k": {
    "16:9": [22000, 12375],
    "9:16": [12375, 22000],
    "1:1": [12375, 12375],
  },
  "36k": {
    "16:9": [36000, 20250],
    "9:16": [20250, 36000],
    "1:1": [20250, 20250],
  },
};

export const RESOLUTIONS = Object.freeze(Object.keys(SIZES));

const ZOOM_IN = new Set([
  "zoom", "dolly", "crane_down", "drone_follow", "fpv_dive",
]);
const ZOOM_OUT = new Set(["crane_up", "drone_flyover"]);
const PAN = new Set(["pan", "whip_pan", "tracking", "orbit", "spiral_up"]);
const AMOUNT = { slow: 0.15, normal: 0.3, fast: 0.5 };

export function motionFor(camera = {}) {
  const movement = camera.movement || "static";
  const amount = AMOUNT[camera.speed] ?? AMOUNT.normal;

  if (ZOOM_IN.has(movement)) return { type: "zoom_in", amount };
  if (ZOOM_OUT.has(movement)) return { type: "zoom_out", amount };
  if (PAN.has(movement)) return { type: "pan_right", amount };

  return { type: "static", amount: 0 };
}

export function planFromStoryboard(
  sb,
  { onlyApproved = true, resolution = "720p" } = {},
) {
  if (!sb || !Array.isArray(sb.scenes)) {
    return { ok: false, reason: "bad_storyboard" };
  }

  if (!Object.hasOwn(SIZES, resolution)) {
    return {
      ok: false,
      reason: "unsupported_resolution",
      supported: RESOLUTIONS,
    };
  }

  const aspect = SIZES[resolution][sb.aspect]
    ? sb.aspect
    : "16:9";
  const [width, height] = SIZES[resolution][aspect];
  const scenes = [];
  const skipped = [];
  let start = 0;

  sb.scenes.forEach((sc, i) => {
    if (onlyApproved && sc.status !== "approved") {
      skipped.push({
        sceneId: sc.id,
        index: i + 1,
        reason: `status_${sc.status}`,
      });
      return;
    }

    const durationSec = Math.max(
      1,
      Math.min(Number(sc.durationSec) || 5, 60),
    );

    scenes.push({
      index: i + 1,
      sceneId: sc.id,
      title: sc.title || "",
      startSec: start,
      durationSec,
      frames: Math.round(durationSec * FPS),
      camera: sc.camera || {},
      motion: motionFor(sc.camera),
      dialogue: Array.isArray(sc.dialogue) ? sc.dialogue : [],
      caption: (sc.dialogue || [])
        .map((d) => d.text)
        .filter(Boolean)
        .join(" "),
    });

    start += durationSec;
  });

  if (!scenes.length) {
    return { ok: false, reason: "no_approved_scenes", skipped };
  }

  return {
    ok: true,
    storyboardId: sb.id,
    title: sb.title || "",
    aspect,
    resolution,
    width,
    height,
    fps: FPS,
    totalSec: start,
    scenes,
    skipped,
  };
}

export function buildVideoPlan(sbId, opts) {
  const sb = getStoryboard(sbId);
  if (!sb) return { ok: false, reason: "not_found" };
  return planFromStoryboard(sb, opts);
}
