// CIDC tools for the AI. Every call goes through executeTool (policy + approval + audit).
//   cidc-search   : search CIDC registries (read-only)               LOW, auto-allow
//   cidc-scaffold : fetch rendered template files, no disk write     LOW, auto-allow
//   cidc-write    : save a template under CIDC_OUT_ROOT               HIGH, needs human approval
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { executeTool } from "./toolExecutor.mjs";
import { cidcClient, saveFiles } from "./cidc.mjs";

const NAME_RE = /^[a-z][a-z0-9-]{0,40}$/;
export const OUT_ROOT = path.resolve(process.env.CIDC_OUT_ROOT || path.join(os.homedir(), "ai-project", "generated"));

function readToken() {
  if (process.env.CIDC_TOKEN) return process.env.CIDC_TOKEN;
  try {
    const m = fs.readFileSync(path.join(os.homedir(), ".cidc_env"), "utf8").match(/CIDC_TOKEN=([^\s'"]+)/);
    return m ? m[1] : undefined;
  } catch {
    return undefined;
  }
}

const client = () => cidcClient({ token: readToken() });

export function resolveOut(name) {
  if (typeof name !== "string" || !NAME_RE.test(name)) {
    throw Object.assign(new Error("invalid project name"), { status: 400 });
  }
  const dir = path.resolve(OUT_ROOT, name);
  if (!dir.startsWith(OUT_ROOT + path.sep)) {
    throw Object.assign(new Error("output outside allowed folder"), { status: 400 });
  }
  return dir;
}

export async function cidcSearch({ collection, filters = {}, actor = "ai" }) {
  const out = await executeTool({
    toolId: "cidc-search",
    actor,
    input: { resource: collection },
    execute: () => client().search(collection, filters),
  });
  return out.result;
}

export async function cidcScaffold({ templateId, name, actor = "ai" }) {
  const out = await executeTool({
    toolId: "cidc-scaffold",
    actor,
    input: { resource: templateId },
    execute: () => client().scaffold(templateId, name),
  });
  return out.result;
}

// First call returns { status: "REQUIRES_APPROVAL", approvalId }. After a human approves, call again with approvalId.
export async function cidcWrite({ templateId, name, actor = "ai", approvalId = null }) {
  const target = resolveOut(name);
  return executeTool({
    toolId: "cidc-write",
    actor,
    approvalId,
    input: { target, resource: templateId },
    execute: async () => {
      if (fs.existsSync(target) && fs.readdirSync(target).length) {
        throw Object.assign(new Error("output folder is not empty"), { status: 409 });
      }
      const s = await client().scaffold(templateId, name);
      const files = await saveFiles(s.files, target);
      return { target, files, run: s.run, build: s.build, test: s.test };
    },
  });
}
