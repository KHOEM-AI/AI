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
