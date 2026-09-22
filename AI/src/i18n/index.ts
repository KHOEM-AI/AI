import { createContext, useContext } from "react";
import type { LanguageCode } from "../language";
import type { Translations } from "./types";
import km from "./km";
import en from "./en";

// មានតែ km + en ពេញលេញ។ ១១ភាសាដែលនៅសល់ (th, lo, my, vi, fr, es, ar, pt, zh, hi, ru)
// នឹងបន្ថែមក្នុងជំហានទី៣ — ដរាបណាមិនទាន់មាន dictionary, getTranslations() fallback ទៅខ្មែរ (មិនមែន crash/blank)។
export const DICTIONARIES: Partial<Record<LanguageCode, Translations>> = {
  km,
  en,
};

export function getTranslations(code: LanguageCode): Translations {
  return DICTIONARIES[code] ?? km;
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
