import { createContext, useContext } from "react";
import type { LanguageCode } from "../language";
import type { Translations } from "./types";
import km from "./km";
import en from "./en";
import th from "./th";
import vi from "./vi";
import my from "./my";
import lo from "./lo";
import hi from "./hi"; // ភាសាហិន្ទី
import ar from "./ar"; // ភាសាអារ៉ាប់
import ur from "./ur"; // ភាសាអូរទុ

export const DICTIONARIES: Partial<Record<LanguageCode, Translations>> = {
  km,
  en,
  th,
  vi,
  my,
  lo,
  hi, // Hindi
  ar, // Arabic
  ur, // Urdu
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
