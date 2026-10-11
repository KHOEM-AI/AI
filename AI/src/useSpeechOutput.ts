export interface VoicePreset {
  id: string;
  label: string;
  pitch: number;
  rate: number;
  ageMin: number;
  ageMax: number;
  gender: "female" | "male";
  role: "general" | "lead" | "supporting";
  style: string;
}

const makePreset = (
  id: string, label: string, pitch: number, rate: number,
  ageMin: number, ageMax: number, gender: "female" | "male",
  role: "general" | "lead" | "supporting" = "general",
  style = "ធម្មជាតិ និងច្បាស់",
): VoicePreset => ({ id, label, pitch, rate, ageMin, ageMax, gender, role, style });

/** 14 profiles. Actual timbre depends on voices installed in the browser/device. */
export const VOICE_PRESETS: VoicePreset[] = [
  makePreset("age_0_10_female", "អាយុ ≤១០ • ស្រី", 1.55, 1.08, 0, 10, "female", "general", "ស្រាល និងរីករាយ"),
  makePreset("age_0_10_male", "អាយុ ≤១០ • ប្រុស", 1.42, 1.08, 0, 10, "male", "general", "ស្រាល និងរីករាយ"),
  makePreset("age_11_20_female", "អាយុ ១១–២០ • ស្រី", 1.28, 1.04, 11, 20, "female"),
  makePreset("age_11_20_male", "អាយុ ១១–២០ • ប្រុស", 1.12, 1.04, 11, 20, "male"),
  makePreset("age_21_30_female", "អាយុ ២១–៣០ • ស្រី", 1.16, 1.02, 21, 30, "female"),
  makePreset("age_21_30_male", "អាយុ ២១–៣០ • ប្រុស", 0.96, 1.02, 21, 30, "male"),
  makePreset("age_31_40_female", "អាយុ ៣១–៤០ • ស្រី", 1.08, 1.00, 31, 40, "female"),
  makePreset("age_31_40_male", "អាយុ ៣១–៤០ • ប្រុស", 0.88, 0.98, 31, 40, "male"),
  makePreset("age_41_50_female", "អាយុ ៤១–៥០ • ស្រី", 1.00, 0.97, 41, 50, "female"),
  makePreset("age_41_50_male", "អាយុ ៤១–៥០ • ប្រុស", 0.82, 0.95, 41, 50, "male"),
  makePreset("age_51_60_female", "អាយុ ៥១–៦០ • ស្រី", 0.94, 0.93, 51, 60, "female"),
  makePreset("age_51_60_male", "អាយុ ៥១–៦០ • ប្រុស", 0.76, 0.91, 51, 60, "male"),
  makePreset("age_61_70_female", "អាយុ ៦១–៧០ • ស្រី", 0.88, 0.89, 61, 70, "female"),
  makePreset("age_61_70_male", "អាយុ ៦១–៧០ • ប្រុស", 0.70, 0.86, 61, 70, "male"),
];

const KEY = "khoem.voicePreset";
const DEFAULT_PRESET = "age_21_30_female";

export function getVoicePreset(): string {
  try {
    const saved = localStorage.getItem(KEY);
    return saved && VOICE_PRESETS.some((preset) => preset.id === saved)
      ? saved
      : DEFAULT_PRESET;
  } catch {
    return DEFAULT_PRESET;
  }
}

export function setVoicePreset(id: string): void {
  if (!VOICE_PRESETS.some((preset) => preset.id === id)) return;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* Storage may be disabled; speech can still work for this session. */
  }
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}

export function speakText(text: string, presetId: string, onEnd?: () => void): boolean {
  if (!speechSupported()) return false;

  const preset =
    VOICE_PRESETS.find((item) => item.id === presetId) ??
    VOICE_PRESETS.find((item) => item.id === DEFAULT_PRESET)!;
  const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();
  if (!clean) return false;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  const khmerVoice = window.speechSynthesis.getVoices().find((voice) =>
    voice.lang.toLowerCase().startsWith("km"),
  );
  if (khmerVoice) utterance.voice = khmerVoice;
  utterance.lang = "km-KH";
  utterance.pitch = preset.pitch;
  utterance.rate = preset.rate;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
  return true;
}
