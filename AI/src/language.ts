export type LanguageCode =
  | "km" | "en" | "th" | "lo" | "my" | "vi"
  | "fr" | "es" | "ar" | "pt" | "zh" | "hi" | "ru"
  | "ur" | "ta" | "tr" | "fa"
  | "ja" | "ko" | "de" | "it" | "nl" | "pl" | "uk" | "sv"
  | "el" | "he" | "ro" | "cs" | "hu" | "id" | "ms" | "tl"
  | "bn" | "ne" | "si" | "mn";

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
  { code: "ur", label: "اردو", nameEn: "Urdu", flag: "🇵🇰" },
  { code: "ta", label: "தமிழ்", nameEn: "Tamil", flag: "🇮🇳" },
  { code: "tr", label: "Türkçe", nameEn: "Turkish", flag: "🇹🇷" },
  { code: "fa", label: "فارسی", nameEn: "Persian", flag: "🇮🇷" },
  { code: "ja", label: "日本語", nameEn: "Japanese", flag: "🇯🇵" },
  { code: "ko", label: "한국어", nameEn: "Korean", flag: "🇰🇷" },
  { code: "de", label: "Deutsch", nameEn: "German", flag: "🇩🇪" },
  { code: "it", label: "Italiano", nameEn: "Italian", flag: "🇮🇹" },
  { code: "nl", label: "Nederlands", nameEn: "Dutch", flag: "🇳🇱" },
  { code: "pl", label: "Polski", nameEn: "Polish", flag: "🇵🇱" },
  { code: "uk", label: "Українська", nameEn: "Ukrainian", flag: "🇺🇦" },
  { code: "sv", label: "Svenska", nameEn: "Swedish", flag: "🇸🇪" },
  { code: "el", label: "Ελληνικά", nameEn: "Greek", flag: "🇬🇷" },
  { code: "he", label: "עברית", nameEn: "Hebrew", flag: "🇮🇱" },
  { code: "ro", label: "Română", nameEn: "Romanian", flag: "🇷🇴" },
  { code: "cs", label: "Čeština", nameEn: "Czech", flag: "🇨🇿" },
  { code: "hu", label: "Magyar", nameEn: "Hungarian", flag: "🇭🇺" },
  { code: "id", label: "Bahasa Indonesia", nameEn: "Indonesian", flag: "🇮🇩" },
  { code: "ms", label: "Bahasa Melayu", nameEn: "Malay", flag: "🇲🇾" },
  { code: "tl", label: "Filipino", nameEn: "Filipino", flag: "🇵🇭" },
  { code: "bn", label: "বাংলা", nameEn: "Bengali", flag: "🇧🇩" },
  { code: "ne", label: "नेपाली", nameEn: "Nepali", flag: "🇳🇵" },
  { code: "si", label: "සිංහල", nameEn: "Sinhala", flag: "🇱🇰" },
  { code: "mn", label: "Монгол", nameEn: "Mongolian", flag: "🇲🇳" },
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
