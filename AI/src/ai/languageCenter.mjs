import { detectLanguage } from "./languageRegistry.mjs";

const LANGUAGE_MODULES = Object.freeze({
  en: "./english.mjs",
  zh: "./chinese.mjs",
});

export async function routeLanguage(text, learned = {}, onStage = null) {
  const input = String(text ?? "").trim();
  if (!input) return null;

  const language = detectLanguage(input);
  const modulePath = LANGUAGE_MODULES[language];

  if (!modulePath) return null;

  const languageModule = await import(modulePath);

  if (language === "en" && typeof languageModule.englishReply === "function") {
    onStage?.("RETRIEVING", "english module");
    return languageModule.englishReply(input, learned);
  }

  if (language === "zh" && typeof languageModule.chineseReply === "function") {
    onStage?.("RETRIEVING", "chinese module");
    return languageModule.chineseReply(input, learned);
  }

  return null;
}

export function isLanguageSupported(language) {
  return Object.prototype.hasOwnProperty.call(LANGUAGE_MODULES, language);
}

export function listSupportedLanguages() {
  return Object.freeze(Object.keys(LANGUAGE_MODULES));
}
