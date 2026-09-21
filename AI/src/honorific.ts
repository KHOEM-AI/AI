export type Honorific = "បង" | "ប្អូន" | "ពូ" | "មីង" | "អ៊ំ" | "ឯង";

export const HONORIFIC_OPTIONS: Honorific[] = ["បង", "ប្អូន", "ពូ", "មីង", "អ៊ំ", "ឯង"];

const STORAGE_KEY = "ai-project:honorific";

export function loadHonorific(): Honorific | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return (HONORIFIC_OPTIONS as string[]).includes(raw ?? "") ? (raw as Honorific) : null;
  } catch {
    return null;
  }
}

export function saveHonorific(h: Honorific): void {
  try {
    localStorage.setItem(STORAGE_KEY, h);
  } catch {
    // storage unavailable — ignore
  }
}
