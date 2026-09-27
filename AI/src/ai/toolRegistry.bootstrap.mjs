import { registerTool } from "./toolRegistry.mjs";

registerTool({
  id: "scan-repo",
  action: "tool.scan",
  name: "Scan Repository",
  description: "scan the repo for files/symbols/findings",
  capabilities: ["scan", "code", "repository"],
});
registerTool({
  id: "find-symbol",
  action: "tool.find",
  name: "Find Symbol",
  description: "search for a symbol or text in code",
  capabilities: ["find", "search", "symbol"],
});
registerTool({
  id: "propose-patch",
  action: "code.proposePatch",
  name: "Propose Code Patch",
  description: "propose a code change, sandbox-tested before approval queue",
  capabilities: ["patch", "edit", "code"],
});
registerTool({
  id: "apply-patch",
  action: "code.applyPatch",
  name: "Apply Code Patch",
  description: "write a patch to a production file, always requires human approval",
  capabilities: ["patch", "apply", "write", "production"],
});
registerTool({
  id: "run-verification",
  action: "code.verify",
  name: "Run Verification",
  description: "run the test/build/tsc verification pipeline",
  capabilities: ["verify", "test", "build"],
});
