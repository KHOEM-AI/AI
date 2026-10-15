export interface VoicePreset {
  id: string;
  label: string;
  pitch: number;
  rate: number;
  gender: "female" | "male";
  ageMin: number;
  ageMax: number;
}

export interface Emotion {
  id: string;
  label: string;
  dPitch: number;
  dRate: number;
  volume: number;
}

const P = (
  id: string, label: string, pitch: number, rate: number,
  gender: "female" | "male", ageMin: number, ageMax: number,
): VoicePreset => ({ id, label, pitch, rate, gender, ageMin, ageMax });

/** 18 characters. Real timbre depends on the voices installed on the device. */
export const VOICE_PRESETS: VoicePreset[] = [
  P("child_boy", "ក្មេងប្រុស", 1.55, 1.10, "male", 5, 10),
  P("child_girl", "ក្មេងស្រី", 1.75, 1.10, "female", 5, 10),
  P("teen_boy", "ជំទង់ប្រុស", 1.30, 1.05, "male", 13, 17),
  P("teen_girl", "ជំទង់ស្រី", 1.50, 1.05, "female", 13, 17),
  P("young_man", "យុវជន", 1.00, 1.03, "male", 20, 30),
  P("young_woman", "យុវតី", 1.30, 1.02, "female", 20, 30),
  P("husband", "ប្ដី", 0.85, 0.98, "male", 30, 45),
  P("wife", "ប្រពន្ធ", 1.15, 1.00, "female", 30, 45),
  P("father", "ឪពុក", 0.72, 0.93, "male", 45, 60),
  P("mother", "ម្ដាយ", 1.02, 0.95, "female", 45, 60),
  P("grandfather", "តា", 0.60, 0.82, "male", 65, 90),
  P("grandmother", "យាយ", 0.82, 0.84, "female", 65, 90),
  P("big_brother", "បងប្រុស", 0.92, 1.02, "male", 22, 35),
  P("big_sister", "បងស្រី", 1.22, 1.00, "female", 22, 35),
  P("male_friend", "មិត្តភក្តិប្រុស", 1.05, 1.12, "male", 18, 35),
  P("female_friend", "មិត្តភក្តិស្រី", 1.38, 1.12, "female", 18, 35),
  P("foreman", "មេការ", 0.68, 0.90, "male", 35, 55),
  P("worker", "កម្មករ", 0.88, 1.10, "male", 20, 45),
];

export const EMOTIONS: Emotion[] = [
  { id: "normal", label: "ធម្មតា", dPitch: 0, dRate: 0, volume: 1 },
  { id: "happy", label: "រីករាយ", dPitch: 0.12, dRate: 0.08, volume: 1 },
  { id: "scared", label: "ភ័យ", dPitch: 0.28, dRate: 0.20, volume: 0.85 },
  { id: "angry", label: "ខឹង", dPitch: -0.10, dRate: 0.14, volume: 1 },
  { id: "sad", label: "ស្រងូតស្រងាត់", dPitch: -0.14, dRate: -0.16, volume: 0.8 },
];

const KEY = "khoem.voicePreset";
const EKEY = "khoem.voiceEmotion";
const DEFAULT_PRESET = "young_woman";
const DEFAULT_EMOTION = "normal";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function getVoicePreset(): string {
  try {
    const saved = localStorage.getItem(KEY);
    return saved && VOICE_PRESETS.some((p) => p.id === saved) ? saved : DEFAULT_PRESET;
  } catch {
    return DEFAULT_PRESET;
  }
}

export function setVoicePreset(id: string): void {
  if (!VOICE_PRESETS.some((p) => p.id === id)) return;
  try { localStorage.setItem(KEY, id); } catch { /* storage may be disabled */ }
}

export function getEmotion(): string {
  try {
    const saved = localStorage.getItem(EKEY);
    return saved && EMOTIONS.some((e) => e.id === saved) ? saved : DEFAULT_EMOTION;
  } catch {
    return DEFAULT_EMOTION;
  }
}

export function setEmotion(id: string): void {
  if (!EMOTIONS.some((e) => e.id === id)) return;
  try { localStorage.setItem(EKEY, id); } catch { /* storage may be disabled */ }
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}

export function speakText(text: string, presetId: string, onEnd?: () => void, emotionId?: string): boolean {
  if (!speechSupported()) return false;
  const preset = VOICE_PRESETS.find((p) => p.id === presetId) ?? VOICE_PRESETS.find((p) => p.id === DEFAULT_PRESET)!;
  const emo = EMOTIONS.find((e) => e.id === (emotionId ?? getEmotion())) ?? EMOTIONS[0];
  const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();
  if (!clean) return false;

  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  const km = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("km"));
  const voice = preset.gender === "male" && km.length > 1 ? km[1] : km[0];
  if (voice) u.voice = voice;
  u.lang = "km-KH";
  u.pitch = clamp(preset.pitch + emo.dPitch, 0.1, 2);
  u.rate = clamp(preset.rate + emo.dRate, 0.5, 1.6);
  u.volume = emo.volume;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
  return true;
}
