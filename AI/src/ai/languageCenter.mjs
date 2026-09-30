import { detectLanguage, LANGUAGE_REGISTRY } from "./languageRegistry.mjs";
import { getKhoemLanguages, getKhoemLocales, khoemTranslate } from "./khoemApi.mjs";

let khoemLanguagesCache = null;
let khoemLocalesCache = null;
let khoemRetryAt = 0;

async function getKhoemRegistry() {
  if (khoemLanguagesCache && khoemLocalesCache) {
    return { languages: khoemLanguagesCache, locales: khoemLocalesCache };
  }

  if (Date.now() < khoemRetryAt) return { languages: [], locales: [] };
  let languages = null;
  let locales = null;
  try {
    [languages, locales] = await Promise.all([
      getKhoemLanguages(),
      getKhoemLocales(),
    ]);
  } catch {
    // KHOEM_AI offline: fall back to the local 4-language registry.
  }

  if (!Array.isArray(languages) || !Array.isArray(locales)) khoemRetryAt = Date.now() + 60000;
  if (Array.isArray(languages)) khoemLanguagesCache = languages;
  if (Array.isArray(locales)) khoemLocalesCache = locales;

  return {
    languages: khoemLanguagesCache ?? [],
    locales: khoemLocalesCache ?? [],
  };
}

export async function routeLanguage(text, learned = {}, onStage = null, honorific = "បង") {
  const input = String(text ?? "").trim();
  if (!input) return null;

  // KHOEM_AI is the central language/locale source.
  // The local 4-language registry remains a fallback for AI-specific replies.
  void getKhoemRegistry().catch(() => {});

  const language = detectLanguage(input);
  const entry = LANGUAGE_REGISTRY[language];

  if (!entry?.module || !entry?.replyExport) return null;

  const languageModule = await import(entry.module);
  const reply = languageModule[entry.replyExport];

  if (typeof reply !== "function") return null;

  onStage?.(
    "RETRIEVING",
    language === "en"
      ? "english module"
      : language === "zh"
        ? "chinese module"
        : `${language} module`
  );

  return reply(input, learned, honorific);
}

export async function getCentralLanguageRegistry() {
  return getKhoemRegistry();
}

export async function translateFromKhoem(locale, key, params) {
  return khoemTranslate(locale, key, params);
}

export function isLanguageSupported(language) {
  if (LANGUAGE_REGISTRY[language]?.status === "active") return true;

  if (khoemLanguagesCache?.some((entry) =>
    entry?.languageId === language ||
    entry?.bcp47 === language ||
    entry?.code === language ||
    entry?.language === language ||
    entry?.id === language
  )) return true;

  return false;
}

export function listSupportedLanguages() {
  if (Array.isArray(khoemLanguagesCache) && khoemLanguagesCache.length > 0) {
    return Object.freeze(
      khoemLanguagesCache
        .map((entry) => entry?.languageId ?? entry?.code ?? entry?.language ?? entry?.id)
        .filter(Boolean)
    );
  }

  return Object.freeze(
    Object.keys(LANGUAGE_REGISTRY).filter(
      (language) => LANGUAGE_REGISTRY[language]?.status === "active"
    )
  );
}
