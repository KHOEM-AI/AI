import { policyCheck } from "./permission.mjs";

const TOOLS = new Map();

export function registerTool({
  id,
  action,
  name,
  description,
  capabilities = [],
}) {
  if (!id || !action) {
    throw Object.assign(
      new Error("id and action are required"),
      { status: 400 },
    );
  }

  if (TOOLS.has(id)) {
    throw Object.assign(
      new Error(`Tool already registered: ${id}`),
      { status: 409 },
    );
  }

  const tool = {
    id,
    action,
    name: name || id,
    description: description || "",
    capabilities: Array.isArray(capabilities) ? capabilities : [],
  };

  TOOLS.set(id, tool);
  return tool;
}

export function unregisterTool(id) {
  return TOOLS.delete(id);
}

export function listTools() {
  return [...TOOLS.values()];
}

export function getTool(id) {
  return TOOLS.get(id) || null;
}

export function findTools(query) {
  const q = String(query || "").toLowerCase().trim();
  if (!q) return [];

  return listTools().filter((tool) =>
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    tool.capabilities.some((capability) =>
      String(capability).toLowerCase().includes(q),
    ),
  );
}

export function describeToolRisk(id, actor = "user") {
  const tool = getTool(id);
  if (!tool) return null;

  return {
    tool,
    policy: policyCheck(tool.action, actor),
  };
}
