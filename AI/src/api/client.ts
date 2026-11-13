export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const r = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new ApiError(r.status, body?.error ?? `HTTP ${r.status}`);
  return body as T;
}

export const get = <T = any>(path: string) => api<T>(path);
export const post = <T = any>(path: string, data?: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(data ?? {}) });
export const del = <T = any>(path: string, data?: unknown) =>
  api<T>(path, { method: "DELETE", body: data ? JSON.stringify(data) : undefined });

// ---- IQ-AI media service (via Vite proxy /iqai -> :8799/api/v1) ----
export interface IqaiMedia {
  id: string;
  type: "image" | "audio" | "video";
  mime: string;
  size: number;
  filename: string;
  status: string;
  createdAt: string;
}

async function iqai<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`/iqai${path}`, init);
  const body = await r.json().catch(() => null);
  if (!r.ok || !body?.ok) throw new ApiError(r.status, body?.error?.message ?? `HTTP ${r.status}`);
  return body.data as T;
}

export const uploadMedia = (file: File | Blob, filename?: string) =>
  iqai<IqaiMedia>("/media", {
    method: "POST",
    headers: {
      "Content-Type": file.type,
      "X-Filename": encodeURIComponent(filename ?? (file as File).name ?? "upload"),
    },
    body: file,
  });

export const listMedia = async () => (await iqai<{ items: IqaiMedia[] }>("/media")).items;

export const deleteMedia = (id: string) =>
  iqai<{ id: string; deleted: boolean }>(`/media/${encodeURIComponent(id)}`, { method: "DELETE" });

export const iqaiContentUrl = (id: string) => `/iqai/media/${encodeURIComponent(id)}/content`;

// ---- IQ-AI sound library (/iqai/sounds -> :8799/api/v1/sounds) ----
// Separate response shape from the /media helpers above: /sounds returns
// plain JSON directly (no {ok,data,error} envelope), and upload/edit take
// X-Filename/X-Category/X-Tags headers rather than query params.
export interface IqaiSound {
  id: string;
  name: string;
  category: string;
  tags: string[];
  source: string;
  license: string;
  mime: string;
  format: string;
  size: number;
  favorite: boolean;
  createdAt: string;
  updatedAt?: string;
}

async function soundsApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`/iqai/sounds${path}`, init);
  const body = await r.json().catch(() => null);
  if (!r.ok || !body) {
    const message = (body && (body.message ?? body.error)) ?? `HTTP ${r.status}`;
    throw new ApiError(r.status, String(message));
  }
  return body as T;
}

export const listSounds = (q = "") =>
  soundsApi<{ items: IqaiSound[]; total: number }>(`?limit=200${q ? `&q=${encodeURIComponent(q)}` : ""}`)
    .then((r) => r.items);

export const iqaiSoundContentUrl = (id: string) => `/iqai/sounds/${encodeURIComponent(id)}/content`;

export const uploadSound = (file: File | Blob, filename: string, category = "unknown", tags = "") =>
  soundsApi<IqaiSound>("/upload", {
    method: "POST",
    headers: {
      "Content-Type": file.type || "audio/wav",
      "X-Filename": encodeURIComponent(filename),
      "X-Category": encodeURIComponent(category),
      ...(tags ? { "X-Tags": encodeURIComponent(tags) } : {}),
    },
    body: file,
  });

// ---- IQ-AI emotion (rule-based, Khmer text) ----
export type IqaiEmotionName = "joy" | "sadness" | "anger" | "fear" | "love" | "surprise" | "neutral";
export interface IqaiEmotion {
  emotion: IqaiEmotionName;
  confidence: number;
  scores: Record<string, number>;
  matched: { emotion: string; word: string }[];
}
export const iqaiAnalyzeEmotion = (text: string) =>
  iqai<IqaiEmotion>("/emotion/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

// ---- IQ-AI audio / image inspect ----
export interface IqaiAudioInfo {
  audioFormat: number;
  channels: number;
  sampleRate: number;
  byteRate: number;
  bitsPerSample: number;
  dataBytes: number;
  durationSec: number;
}
export interface IqaiImageInfo {
  format: "png" | "jpeg" | "gif" | "webp";
  width: number;
  height: number;
  bytes: number;
}
export const iqaiInspectAudio = (file: Blob) =>
  iqai<IqaiAudioInfo>("/audio/inspect", {
    method: "POST",
    headers: { "Content-Type": file.type || "audio/wav" },
    body: file,
  });
export const iqaiInspectImage = (file: Blob) =>
  iqai<IqaiImageInfo>("/images/inspect", {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

// ---- IQ-AI video inspect ----
export interface IqaiVideoInfo {
  format: "mp4" | "webm";
  width: number;
  height: number;
  durationSec: number;
  bytes: number;
}
export const iqaiInspectVideo = (file: Blob) =>
  iqai<IqaiVideoInfo>("/videos/inspect", {
    method: "POST",
    headers: { "Content-Type": file.type || "video/mp4" },
    body: file,
  });

// ---- IQ-AI video creation (ffmpeg, offline, no AI model) ----
// /videos/text and /videos/photo return raw MP4 bytes; errors use the {ok,error} envelope.
export interface IqaiVideoOptions { effects: string[]; sfxTypes: string[] }
export const iqaiVideoOptions = async (): Promise<IqaiVideoOptions> => {
  const d = await iqai<{ effects: string[]; sfxTypes: string[] }>("/videos/effects");
  return { effects: d.effects ?? [], sfxTypes: d.sfxTypes ?? [] };
};

// IQ-AI text-to-speech: returns WAV audio bytes.
export const iqaiTts = async (text: string, lang: "km" | "en"): Promise<Blob> => {
  const r = await fetch("/iqai/audio/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang }),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => null);
    throw new ApiError(r.status, body?.error?.message ?? `TTS HTTP ${r.status}`);
  }
  return r.blob();
};

async function iqaiMp4(path: string, init: RequestInit): Promise<Blob> {
  const r = await fetch(`/iqai${path}`, init);
  if (!r.ok) {
    const body = await r.json().catch(() => null);
    throw new ApiError(r.status, body?.error?.message ?? `HTTP ${r.status}`);
  }
  return r.blob();
}

export interface IqaiTextVideoOpts {
  text: string;
  durationSec?: number;
  bgColor?: string;
  textColor?: string;
  sfx?: string | null;
}
export const iqaiTextVideo = (o: IqaiTextVideoOpts) =>
  iqaiMp4("/videos/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(o),
  });

export const iqaiPhotoVideo = (file: Blob, effect = "zoom-in", durationSec?: number, sfx?: string | null) => {
  const qs = new URLSearchParams({ effect });
  if (durationSec) qs.set("durationSec", String(durationSec));
  if (sfx) qs.set("sfx", sfx);
  return iqaiMp4(`/videos/photo?${qs}`, {
    method: "POST",
    headers: { "Content-Type": file.type || "image/png" },
    body: file,
  });
};

// Join stored videos (ids from /media) into one mp4 on the IQ-AI side (POST /videos/merge).
export const iqaiMergeVideos = (ids: string[], o: { width?: number; height?: number } = {}) =>
  iqaiMp4("/videos/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, ...o }),
  });

// Slideshow: stored image ids (+ captions, sound) -> mp4 (IQ-AI POST /videos/slideshow)
export const iqaiSlideshow = (o: {
  ids: string[];
  captions?: string[];
  secondsPerSlide?: number;
  effect?: string;
  width?: number;
  height?: number;
  sfx?: string | null;
  audioId?: string;
}) =>
  iqaiMp4("/videos/slideshow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...o, sfx: o.sfx || undefined }),
  });

// Story video: scenes (stored photo + caption, or a text card) -> mp4 (IQ-AI POST /videos/story)
export const iqaiStory = (o: {
  scenes: { imageId?: string; text?: string; seconds?: number }[];
  width?: number;
  height?: number;
  effect?: string;
  transition?: string;
  bgColor?: string;
  textColor?: string;
  sfx?: string | null;
}) =>
  iqaiMp4("/videos/story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...o, sfx: o.sfx || undefined }),
  });
