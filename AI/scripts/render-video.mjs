#!/usr/bin/env node
// ប្រើ: node scripts/render-video.mjs <storyboardId> [--images dir] [--confirm]
// គ្មាន --confirm = dry-run (បង្ហាញតែ plan)។ សរសេរតែក្នុង output/
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { buildVideoPlan } from "../src/ai/videoPlan.mjs";

const [sbId, ...rest] = process.argv.slice(2);
const val = (n, d) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : d; };
if (!sbId || !/^[\w-]+$/.test(sbId)) { console.error("usage: render-video.mjs <storyboardId> [--images dir] [--confirm]"); process.exit(1); }

const plan = buildVideoPlan(sbId);
if (!plan.ok) { console.error("plan failed:", plan.reason, JSON.stringify(plan.skipped || [])); process.exit(1); }
console.log(`Plan: ${plan.scenes.length} scenes, ${plan.totalSec}s, ${plan.width}x${plan.height}; skipped ${plan.skipped.length}`);
if (!rest.includes("--confirm")) { console.log("DRY-RUN: បន្ថែម --confirm ដើម្បី render ពិត"); process.exit(0); }

const imgDir = path.resolve(val("--images", "input"));
const outDir = path.resolve("output");
const tmp = path.join(outDir, `tmp-${sbId}`);
fs.mkdirSync(tmp, { recursive: true });
const { width: W, height: H, fps } = plan;

function findImage(id) {
  for (const ext of ["png", "jpg", "jpeg"]) {
    const f = path.join(imgDir, `${id}.${ext}`);
    if (fs.existsSync(f)) return f;
  }
  return null;
}
function zoomExpr({ type, amount: a }, N) {
  const mid = { x: "iw/2-(iw/zoom/2)", y: "ih/2-(ih/zoom/2)" };
  if (type === "zoom_in") return { z: `1+${a}*on/${N}`, ...mid };
  if (type === "zoom_out") return { z: `${1 + a}-${a}*on/${N}`, ...mid };
  if (type === "pan_right") return { z: `${1 + a}`, x: `(iw-iw/zoom)*on/${N}`, y: mid.y };
  return { z: "1", ...mid };
}

const clips = [];
for (const s of plan.scenes) {
  const img = findImage(s.sceneId);
  const src = img ? ["-i", img]
    : ["-f", "lavfi", "-i", `color=c=0x101820:s=${W}x${H}:r=${fps}:d=0.04`];
  const e = zoomExpr(s.motion, s.frames);
  const vf = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,` +
    `zoompan=z='${e.z}':x='${e.x}':y='${e.y}':d=${s.frames}:s=${W}x${H}:fps=${fps}`;
  const clip = path.join(tmp, `${String(s.index).padStart(3, "0")}.mp4`);
  const args = ["-y", ...src, "-vf", vf, "-frames:v", String(s.frames),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", clip];
  console.log(`Scene ${s.index} (${s.sceneId}) ${img ? "image" : "placeholder"} ${s.motion.type}`);
  const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (r.status !== 0) { console.error("ffmpeg failed at scene", s.index); process.exit(1); }
  clips.push(clip);
}
const list = path.join(tmp, "list.txt");
fs.writeFileSync(list, clips.map((c) => `file '${c}'`).join("\n"));
const out = path.join(outDir, `${sbId}.mp4`);
const r = spawnSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", out], { stdio: "inherit" });
if (r.status !== 0) process.exit(1);
console.log("DONE:", out);
