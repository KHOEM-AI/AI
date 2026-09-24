import { detectLanguage, LANGUAGE_REGISTRY } from "./languageRegistry.mjs";

export async function routeLanguage(text, learned = {}, onStage = null) {
  const input = String(text ?? "").trim();
  if (!input) return null;

  const language = detectLanguage(input);
  const entry = LANGUAGE_REGISTRY[language];

  if (!entry?.module || !entry?.replyExport) return null;

  const languageModule = await import(entry.module);
  const reply = languageModule[entry.replyExport];

  if (typeof reply !== "function") return null;

  onStage?.("RETRIEVING", language === "en" ? "english module" : language === "zh" ? "chinese module" : `${language} module`);
  return reply(input, learned);
}

export function isLanguageSupported(language) {
  return LANGUAGE_REGISTRY[language]?.status === "active";
}

export function listSupportedLanguages() {
  return Object.freeze(Object.keys(LANGUAGE_REGISTRY).filter((language) => LANGUAGE_REGISTRY[language]?.status === "active"));
}
