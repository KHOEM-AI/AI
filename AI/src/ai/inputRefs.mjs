// src/ai/inputRefs.mjs — safe "$from" references between agent steps.
// { "$from": "step1.scan-repo-data.fileCount" } -> value from an earlier step's real result.
// No eval, no templates. Only string/number/boolean values may be injected.

const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);
const REF = /^step([1-9]\d*)\.([a-z0-9-]+)\.([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*)$/;
const MAX_DEPTH = 5;

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

export function isRef(v) {
  return isPlainObject(v) && Object.hasOwn(v, "$from");
}

export function parseRef(v) {
  if (Object.keys(v).length !== 1 || typeof v.$from !== "string") {
    throw new Error("$from must be the only key and must be a string");
  }
  const m = REF.exec(v.$from);
  if (!m) throw new Error("invalid $from reference: " + v.$from);
  const path = m[3].split(".");
  if (path.some((k) => FORBIDDEN.has(k))) throw new Error("forbidden key in $from: " + v.$from);
  return { step: Number(m[1]), toolId: m[2], path, raw: v.$from };
}

export function mapInput(value, fn, depth = 0) {
  if (depth > MAX_DEPTH) throw new Error("input nesting too deep");
  if (Array.isArray(value)) return value.map((x) => mapInput(x, fn, depth + 1));
  if (isPlainObject(value)) {
    if (isRef(value)) return fn(parseRef(value));
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapInput(v, fn, depth + 1)]));
  }
  return value;
}

// Checked BEFORE any tool runs: refs must point to an earlier step that really uses that tool.
export function validateRefs(input, stepNo, plannedSteps) {
  mapInput(input, (ref) => {
    if (ref.step >= stepNo) throw new Error(ref.raw + ": must reference an earlier step");
    const target = plannedSteps[ref.step - 1];
    if (!target || !Array.isArray(target.tools) || !target.tools.includes(ref.toolId)) {
      throw new Error(ref.raw + ": step " + ref.step + " does not use tool " + ref.toolId);
    }
    return null;
  });
}

// Replaces each ref with the real value from results [{ step, toolId, result }].
export function resolveInput(input, results) {
  return mapInput(input, (ref) => {
    const hit = results.find((r) => r.step === ref.step && r.toolId === ref.toolId);
    if (!hit) throw new Error(ref.raw + ": no result for that step/tool");
    if (
      hit.result !== null &&
      typeof hit.result === "object" &&
      !Array.isArray(hit.result) &&
      Object.hasOwn(hit.result, "ok") &&
      hit.result.ok === false
    ) {
      throw new Error(ref.raw + ": source tool returned ok:false");
    }
    if (!["EXECUTED", "SUCCESS"].includes(hit.status)) {
      throw new Error(ref.raw + ": source tool did not succeed");
    }
    let cur = hit.result;
    for (const k of ref.path) {
      if (cur === null || typeof cur !== "object" || !Object.hasOwn(cur, k)) {
        throw new Error(ref.raw + ": field not found");
      }
      cur = cur[k];
    }
    if (!["string", "number", "boolean"].includes(typeof cur)) {
      throw new Error(ref.raw + ": must resolve to a string, number or boolean");
    }
    return cur;
  });
}
