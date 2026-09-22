export type LanguageCode =
  | "km" | "en" | "th" | "lo" | "my" | "vi"
  | "fr" | "es" | "ar" | "pt" | "zh" | "hi" | "ru";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nameEn: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "km", label: "ខ្មែរ", nameEn: "Khmer", flag: "🇰🇭" },
  { code: "en", label: "English", nameEn: "English", flag: "🇬🇧" },
  { code: "th", label: "ไทย", nameEn: "Thai", flag: "🇹🇭" },
  { code: "lo", label: "ລາວ", nameEn: "Lao", flag: "🇱🇦" },
  { code: "my", label: "မြန်မာ", nameEn: "Myanmar", flag: "🇲🇲" },
  { code: "vi", label: "Tiếng Việt", nameEn: "Vietnamese", flag: "🇻🇳" },
  { code: "fr", label: "Français", nameEn: "French", flag: "🇫🇷" },
  { code: "es", label: "Español", nameEn: "Spanish", flag: "🇪🇸" },
  { code: "ar", label: "العربية", nameEn: "Arabic", flag: "🇸🇦" },
  { code: "pt", label: "Português", nameEn: "Portuguese", flag: "🇵🇹" },
  { code: "zh", label: "中文", nameEn: "Chinese", flag: "🇨🇳" },
  { code: "hi", label: "हिन्दी", nameEn: "Hindi", flag: "🇮🇳" },
  { code: "ru", label: "Русский", nameEn: "Russian", flag: "🇷🇺" },
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
