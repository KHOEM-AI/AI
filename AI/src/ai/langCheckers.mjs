// src/ai/langCheckers.mjs
// One file holding every language's syntax checker (Python, C/C++, Go, Rust,
// Ruby, JSON now; Java/C#/PHP report NOT_AVAILABLE since those toolchains
// are not installed). JS/TS files keep using the tsc/build/vitest pipeline
// in sandbox.mjs and never reach this file. Adding a language later just
// means adding one entry to EXT_MAP and one function to CHECKERS here.

import { execSync } from "node:child_process";
import fs from "node:fs";

function run(cmd, timeout) {
  try {
    const output = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], timeout }).toString();
    return { ok: true, output: output.slice(-2000) };
  } catch (e) {
    return {
      ok: false,
      output: String(e.stdout || "").slice(-2000),
      error: String(e.stderr || e.message || "").slice(-2000),
    };
  }
}

function hasCommand(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: ["ignore", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

function unavailable(tool) {
  return { ok: false, available: false, output: "", error: `NOT_AVAILABLE: ${tool} is not installed in this environment` };
}

const EXT_MAP = {
  py: "python",
  cpp: "cpp", cc: "cpp", cxx: "cpp", c: "cpp", h: "cpp", hpp: "cpp", hxx: "cpp",
  go: "go",
  rs: "rust",
  rb: "ruby",
  java: "java",
  cs: "csharp",
  php: "php",
  json: "json",
  html: "html", htm: "html",
  css: "css",
};

const CHECKERS = {
  python: (file, timeout) => hasCommand("python3") ? run(`python3 -m py_compile "${file}"`, timeout) : unavailable("python3"),
  cpp: (file, timeout) => hasCommand("g++") ? run(`g++ -fsyntax-only "${file}"`, timeout) : unavailable("g++"),
  go: (file, timeout) => hasCommand("gofmt") ? run(`gofmt -e "${file}" > /dev/null`, timeout) : unavailable("gofmt (part of go)"),
  rust: (file, timeout) => hasCommand("rustc")
    ? run(`rustc --edition 2021 --crate-type lib --emit=metadata -o /tmp/khoem-rustc-check.out "${file}"`, timeout)
    : unavailable("rustc"),
  ruby: (file, timeout) => hasCommand("ruby") ? run(`ruby -c "${file}"`, timeout) : unavailable("ruby"),
  json: (file) => {
    try {
      JSON.parse(fs.readFileSync(file, "utf8"));
      return { ok: true, output: "valid JSON" };
    } catch (e) {
      return { ok: false, output: "", error: e.message };
    }
  },
  java: () => unavailable("javac"),
  csharp: () => unavailable("dotnet or mono csc"),
  php: () => unavailable("php"),
  // No compiler installed for these — accepted but flagged as unverified
  // rather than silently claiming a pass that never actually ran.
  html: () => ({ ok: true, output: "no syntax checker installed for HTML — accepted without verification", unverified: true }),
  css: () => ({ ok: true, output: "no syntax checker installed for CSS — accepted without verification", unverified: true }),
};

// Returns null for JS/TS/unrecognized extensions — caller then falls back
// to the tsc/build/vitest pipeline.
export function detectLanguage(relPath) {
  const ext = String(relPath).split(".").pop().toLowerCase();
  return EXT_MAP[ext] || null;
}

export function checkLanguage(lang, absFilePath, timeout = 30000) {
  const checker = CHECKERS[lang];
  if (!checker) return unavailable(`checker for "${lang}"`);
  return checker(absFilePath, timeout);
}

const TOOL_FOR = { python: "python3", cpp: "g++", go: "gofmt", rust: "rustc", ruby: "ruby", java: "javac", csharp: "dotnet", php: "php" };

export function listSupportedLanguages() {
  return Object.keys(CHECKERS).map((lang) => ({
    lang,
    available: lang === "json" || lang === "html" || lang === "css" ? true : hasCommand(TOOL_FOR[lang]),
  }));
}
