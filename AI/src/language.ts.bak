export type LanguageCode =
  | "km" | "en" | "th" | "lo" | "my" | "vi"
  | "fr" | "es" | "ar" | "pt" | "zh" | "hi" | "ru";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "km", label: "ខ្មែរ" },
  { code: "en", label: "English" },
  { code: "th", label: "ไทย" },
  { code: "lo", label: "ລາວ" },
  { code: "my", label: "မြန်မာ" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "ar", label: "العربية" },
  { code: "pt", label: "Português" },
  { code: "zh", label: "中文" },
  { code: "hi", label: "हिन्दी" },
  { code: "ru", label: "Русский" },
];

const STORAGE_KEY = "ai-project:language";
const DEFAULT_LANGUAGE: LanguageCode = "km";

export function loadLanguage(): LanguageCode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const valid = LANGUAGE_OPTIONS.some((o) => o.code === raw);
    return valid ? (raw as LanguageCode) : DEFAULT_LANGUAGE;
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

export function getLanguageLabel(code: LanguageCode): string {
  return LANGUAGE_OPTIONS.find((o) => o.code === code)?.label ?? code;
}
