import { createContext, useContext } from "react";
import type { LanguageCode } from "../language";
import type { Translations } from "./types";
import { KHOEM_LANG } from "./khoemLang.generated";

import km from "./km";
import en from "./en";

export const DICTIONARIES: Partial<Record<LanguageCode, Translations>> = {
  km,
  en,
};

export function getTranslations(code: LanguageCode): Translations {
  return DICTIONARIES[code] ?? km;
}

export function pickText(code: LanguageCode, km: string, en: string): string {
  return code === "km" ? km : en;
}

const LanguageContext = createContext<LanguageCode>("km");
export const LanguageProvider = LanguageContext.Provider;

export function useT(): Translations {
  const code = useContext(LanguageContext);
  return getTranslations(code);
}

export function useLanguageCode(): LanguageCode {
  return useContext(LanguageContext);
}

// Text pulled from the KHOEM_AI localization app (falls back to en, then to the key)
export function useKhoem(): (key: string) => string {
  const code = useContext(LanguageContext);
  return (key) => KHOEM_LANG[code]?.[key] ?? KHOEM_LANG.en?.[key] ?? key;
}
