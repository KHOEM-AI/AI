export type LanguageCode = string;

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nameEn: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [];

const STORAGE_KEY = "ai-project:language";
const DEFAULT_LANGUAGE: LanguageCode = "km";

export function loadLanguage(): LanguageCode {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function saveLanguage(code: LanguageCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // storage unavailable — ignore
  }
}
