// KHOEM AI — local FFmpeg storyboard renderer.
// Renders approved storyboard scenes to MP4.
// This is an animatic renderer, not an AI character-animation model.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getStoryboard } from "./storyboard.mjs";
import { planFromStoryboard } from "./videoPlan.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RENDER_DIR = path.join(ROOT, "data", "renders");
const FONT = "/system/fonts/NotoSansKhmer-Regular.ttf";
const FPS = 25;

const exists = (p) => {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
};

function inside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function resolveImage(input) {
  if (typeof input !== "string" || !input || input.length > 300) return null;
  if (input.includes("\0")) return null;

  const allowedRoots = [
    path.join(ROOT, "data", "refs"),
    path.join(ROOT, "data", "media"),
  ];

  let candidate = path.isAbsolute(input) ? input : path.join(ROOT, input);

  try {
    candidate = fs.realpathSync(candidate);
  } catch {
    return null;
  }

  if (!allowedRoots.some((root) => {
    try {
      return inside(fs.realpathSync(root), candidate);
    } catch {
      return false;
    }
  })) return null;

  if (!exists(candidate)) return null;
  if (!/\.(png|jpe?g|webp)$/i.test(candidate)) return null;
  return candidate;
}

function runFfmpeg(args, ffmpegPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (buf) => {
      if (stderr.length < 12000) stderr += buf.toString();
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg_exit_${code}: ${stderr.slice(-2500)}`));
    });
  });
}

function safeText(value, max = 1200) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .slice(0, max);
}

function drawTextFilter(textFile, fontSize, y) {
  // Text is read from a file, not inserted into FFmpeg filter syntax.
  return `drawtext=fontfile=${FONT}:textfile=${textFile}:expansion=none:fontsize=${fontSize}:fontcolor=white:box=1:boxcolor=black@0.60:boxborderw=18:x=(w-text_w)/2:y=${y}`;
}

export async function renderStoryboardVideo(
  storyboardId,
  {
    mediaByScene = {},
    resolution = "720p",
    ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg",
  } = {},
) {
  if (typeof storyboardId !== "string" ||
      !/^sb_[A-Za-z0-9_-]{1,80}$/.test(storyboardId)) {
    return { ok: false, reason: "bad_storyboard_id" };
  }

  const sb = getStoryboard(storyboardId);
  if (!sb) return { ok: false, reason: "not_found" };

  const plan = planFromStoryboard(sb, { onlyApproved: true, resolution });
  if (!plan.ok) return plan;

  if (!exists(FONT)) {
    return { ok: false, reason: "khmer_font_not_found", font: FONT };
  }

  // Validate supplied scene media before starting FFmpeg.
  const sceneMedia = new Map();
  for (const scene of plan.scenes) {
    const requested = mediaByScene[scene.sceneId];
    if (requested === undefined) continue;
    const image = resolveImage(requested);
    if (!image) {
      return {
        ok: false,
        reason: "invalid_scene_media",
        sceneId: scene.sceneId,
      };
    }
    sceneMedia.set(scene.sceneId, image);
  }

  fs.mkdirSync(RENDER_DIR, { recursive: true });
  const jobDir = fs.mkdtempSync(path.join(os.tmpdir(), "khoem-render-"));
  const output = path.join(
    RENDER_DIR,
    `${storyboardId}_${crypto.randomUUID().slice(0, 8)}.mp4`,
  );
  const parts = [];

  try {
    for (let i = 0; i < plan.scenes.length; i++) {
      const scene = plan.scenes[i];
      const part = path.join(jobDir, `scene-${i}.mp4`);
      const titleFile = path.join(jobDir, `title-${i}.txt`);
      const captionFile = path.join(jobDir, `caption-${i}.txt`);
      const image = sceneMedia.get(scene.sceneId);

      fs.writeFileSync(titleFile, safeText(scene.title || `Scene ${scene.index}`, 180));
      fs.writeFileSync(captionFile, safeText(scene.caption, 1200));

      const args = ["-hide_banner", "-loglevel", "error", "-y"];
      if (image) {
        args.push("-loop", "1", "-framerate", String(FPS), "-i", image);
      } else {
        args.push(
          "-f", "lavfi", "-i",
          `color=c=${i % 2 ? "0x172033" : "0x243447"}:s=${plan.width}x${plan.height}:r=${FPS}`,
        );
      }

      const vf = [
        `scale=${plan.width}:${plan.height}:force_original_aspect_ratio=increase`,
        `crop=${plan.width}:${plan.height}`,
        "setsar=1",
        drawTextFilter(titleFile, Math.max(24, Math.round(plan.width / 22)), "h*0.12"),
        ...(scene.caption ? [drawTextFilter(captionFile, Math.max(20, Math.round(plan.width / 34)), "h*0.72")] : []),
        "format=yuv420p",
      ].join(",");

      args.push(
        "-t", String(scene.durationSec),
        "-vf", vf,
        "-r", String(FPS),
        "-an",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-movflags", "+faststart",
        part,
      );

      await runFfmpeg(args, ffmpegPath);
      parts.push(part);
    }

    const concatFile = path.join(jobDir, "concat.txt");
    fs.writeFileSync(
      concatFile,
      parts.map((p) => `file '${p}'`).join("\n") + "\n",
    );

    await runFfmpeg([
      "-hide_banner", "-loglevel", "error", "-y",
      "-f", "concat", "-safe", "0", "-i", concatFile,
      "-c", "copy", "-movflags", "+faststart",
      output,
    ], ffmpegPath);

    if (!exists(output) || fs.statSync(output).size === 0) {
      throw new Error("render_output_missing");
    }

    return {
      ok: true,
      storyboardId,
      output: path.relative(ROOT, output),
      scenes: plan.scenes.length,
      durationSec: plan.totalSec,
      width: plan.width,
      height: plan.height,
      resolution: plan.resolution,
      fps: FPS,
      kind: "storyboard_animatic",
      note: "No generated character motion or speech audio is included.",
    };
  } catch (error) {
    try { fs.rmSync(output, { force: true }); } catch {}
    return {
      ok: false,
      reason: "render_failed",
      message: String(error?.message || error).slice(0, 3000),
    };
  } finally {
    fs.rmSync(jobDir, { recursive: true, force: true });
  }
}
