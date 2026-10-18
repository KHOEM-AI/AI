import { registerApi } from "./api.mjs";
import { registerCharactersApi } from "./charactersApi.mjs";
import { registerLearnedApi } from "./learnedApi.mjs";
import { registerShotlistApi } from "./shotlistApi.mjs";
import { registerCharacterRefsApi } from "./characterRefsApi.mjs";
import { registerKhoemBridgeApi } from "./khoemBridgeApi.mjs";
import { registerRouteListApi } from "./routeList.mjs";

export const API_MODULES = [
  { name: "api", register: registerApi },
  { name: "characters", register: registerCharactersApi },
  { name: "learned", register: registerLearnedApi },
  { name: "shotlist", register: registerShotlistApi },
  { name: "characterRefs", register: registerCharacterRefsApi },
  { name: "khoemBridge", register: registerKhoemBridgeApi },
];

export function registerAllApis(app, modules = API_MODULES) {
  const loaded = [];
  const failed = [];
  for (const m of modules) {
    try {
      m.register(app);
      loaded.push(m.name);
    } catch (e) {
      failed.push({ name: m.name, error: String(e?.message ?? e) });
      console.error(`[registerAll] ${m.name} failed:`, e);
    }
  }
  app.get("/api/registry", (req, res) => res.json({ ok: true, loaded, failed }));
  registerRouteListApi(app);
  return { loaded, failed };
}
