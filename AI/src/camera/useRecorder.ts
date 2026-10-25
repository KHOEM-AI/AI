// src/camera/useRecorder.ts
// Video recording from a live MediaStream. The result stays in memory as a Blob
// URL and is only saved when the person presses download.

import { useCallback, useEffect, useRef, useState } from "react";
import { stamp } from "./format";

const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

export function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  if (typeof MediaRecorder.isTypeSupported !== "function") return undefined;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

export type RecordingResult = {
  url: string;
  blob: Blob;
  mime: string;
  ext: "mp4" | "webm";
  bytes: number;
  seconds: number;
  name: string;
};

export type RecorderError = "unsupported" | "start_failed" | "record_failed";

export const RECORDER_ERROR_KM: Record<RecorderError, string> = {
  unsupported: "ឧបករណ៍នេះមិនគាំទ្រការថតវីដេអូក្នុងកម្មវិធីរុករកទេ។",
  start_failed: "មិនអាចចាប់ផ្ដើមថតបានទេ។",
  record_failed: "ការថតមានបញ្ហា ហើយត្រូវបានបញ្ឈប់។",
};

/** maxSeconds caps memory use on phones: chunks are kept in RAM until saved. */
export function useRecorder(maxSeconds = 600) {
  const supported = typeof MediaRecorder !== "undefined";

  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const urlRef = useRef<string | null>(null);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<RecordingResult | null>(null);
  const [error, setError] = useState<RecorderError | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const start = useCallback(
    (stream: MediaStream): boolean => {
      if (!supported) {
        setError("unsupported");
        return false;
      }
      if (recorderRef.current) return false;

      setError(null);
      const chunks: Blob[] = [];
      let recorder: MediaRecorder;
      try {
        const mime = pickRecorderMime();
        recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch {
        setError("start_failed");
        return false;
      }

      const startedAt = Date.now();

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };

      recorder.onerror = () => {
        setError("record_failed");
        if (recorder.state !== "inactive") recorder.stop();
      };

      recorder.onstop = () => {
        clearTimer();
        const type = recorder.mimeType || "video/webm";
        const ext = type.includes("mp4") ? "mp4" : "webm";
        const elapsed = Math.round((Date.now() - startedAt) / 1000);
        recorderRef.current = null;
        setRecording(false);

        if (chunks.length === 0) return;
        const blob = new Blob(chunks, { type });
        revokeUrl();
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setResult({
          url,
          blob,
          mime: type.split(";")[0],
          ext,
          bytes: blob.size,
          seconds: elapsed,
          name: `khoem-video-${stamp()}.${ext}`,
        });
      };

      try {
        recorder.start(1000);
      } catch {
        setError("start_failed");
        return false;
      }

      recorderRef.current = recorder;
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(elapsed);
        if (elapsed >= maxSeconds) stop();
      }, 250);
      return true;
    },
    [supported, maxSeconds, clearTimer, revokeUrl, stop],
  );

  const clear = useCallback(() => {
    revokeUrl();
    setResult(null);
  }, [revokeUrl]);

  // Closing the studio mid-recording discards it; nothing is left running.
  useEffect(() => {
    return () => {
      clearTimer();
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onerror = null;
        recorder.onstop = null;
        if (recorder.state !== "inactive") recorder.stop();
        recorderRef.current = null;
      }
      revokeUrl();
    };
  }, [clearTimer, revokeUrl]);

  return { supported, recording, seconds, result, error, maxSeconds, start, stop, clear };
}
