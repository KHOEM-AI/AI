// src/camera/useCamera.ts
// Live camera access for Camera Studio.
// Nothing here uploads or stores media: frames stay in the browser.

import { useCallback, useEffect, useRef, useState } from "react";

export type Facing = "user" | "environment";
export type CameraStatus = "idle" | "starting" | "live" | "error";
export type CameraProblem =
  | "insecure"
  | "unsupported"
  | "denied"
  | "not_found"
  | "busy"
  | "failed";

export type CameraFailure = { code: CameraProblem; detail?: string };

export const CAMERA_PROBLEM_KM: Record<CameraProblem, string> = {
  insecure:
    "កាមេរ៉ាដំណើរការតែលើ HTTPS ឬ localhost ប៉ុណ្ណោះ។ សូមបើកតាម http://localhost:5175 ក្នុងទូរសព្ទនេះ។",
  unsupported: "កម្មវិធីរុករកនេះមិនគាំទ្រការចូលប្រើកាមេរ៉ាទេ។",
  denied:
    "មិនទាន់បានអនុញ្ញាតកាមេរ៉ា។ សូមអនុញ្ញាតក្នុងការកំណត់គេហទំព័រ រួចព្យាយាមម្ដងទៀត។",
  not_found: "រកមិនឃើញកាមេរ៉ាលើឧបករណ៍នេះទេ។",
  busy: "កាមេរ៉ាកំពុងត្រូវបានប្រើដោយកម្មវិធីផ្សេង ឬត្រូវបានផ្ដាច់។ សូមបិទវាសិន រួចព្យាយាមម្ដងទៀត។",
  failed: "មិនអាចបើកកាមេរ៉ាបានទេ។",
};

function classify(error: unknown): CameraFailure {
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name: unknown }).name)
      : "";
  const detail = error instanceof Error ? error.message.slice(0, 200) : undefined;

  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
    case "PermissionDeniedError":
      return { code: "denied", detail };
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return { code: "not_found", detail };
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return { code: "busy", detail };
    case "NotSupportedError":
    case "TypeError":
      return { code: "unsupported", detail };
    default:
      return { code: "failed", detail };
  }
}

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Bumped on every open/stop so a slow getUserMedia() that finishes late is discarded.
  const tokenRef = useRef(0);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [failure, setFailure] = useState<CameraFailure | null>(null);
  const [facing, setFacing] = useState<Facing>("environment");
  const [withAudio, setWithAudio] = useState(false);

  const release = useCallback(() => {
    stopTracks(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStream(null);
  }, []);

  const open = useCallback(
    async (wantFacing: Facing, wantAudio: boolean) => {
      const token = ++tokenRef.current;
      release();
      setFailure(null);

      if (typeof window === "undefined" || !window.isSecureContext) {
        setFailure({ code: "insecure" });
        setStatus("error");
        return;
      }
      const devices = typeof navigator === "undefined" ? undefined : navigator.mediaDevices;
      if (!devices || typeof devices.getUserMedia !== "function") {
        setFailure({ code: "unsupported" });
        setStatus("error");
        return;
      }

      setStatus("starting");
      try {
        const next = await devices.getUserMedia({
          video: {
            facingMode: { ideal: wantFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: wantAudio,
        });

        if (token !== tokenRef.current) {
          stopTracks(next);
          return;
        }

        streamRef.current = next;
        const videoTrack = next.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            if (streamRef.current !== next) return;
            release();
            setFailure({ code: "busy" });
            setStatus("error");
          };
        }

        const video = videoRef.current;
        if (video) {
          video.srcObject = next;
          void video.play().catch(() => undefined);
        }
        setStream(next);
        setStatus("live");
      } catch (error) {
        if (token !== tokenRef.current) return;
        setFailure(classify(error));
        setStatus("error");
      }
    },
    [release],
  );

  const start = useCallback(() => open(facing, withAudio), [open, facing, withAudio]);

  const stop = useCallback(() => {
    tokenRef.current += 1;
    release();
    setFailure(null);
    setStatus("idle");
  }, [release]);

  const flip = useCallback(() => {
    const next: Facing = facing === "user" ? "environment" : "user";
    setFacing(next);
    if (status === "live") void open(next, withAudio);
  }, [facing, status, open, withAudio]);

  const toggleAudio = useCallback(() => {
    const next = !withAudio;
    setWithAudio(next);
    if (status === "live") void open(facing, next);
  }, [withAudio, status, open, facing]);

  /** Current frame as a JPEG (not mirrored, even when the preview is). */
  const snapshot = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0);
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
    });
  }, []);

  // Always release the camera when the studio closes.
  useEffect(() => {
    return () => {
      tokenRef.current += 1;
      stopTracks(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  return {
    videoRef,
    stream,
    status,
    failure,
    facing,
    withAudio,
    start,
    stop,
    flip,
    toggleAudio,
    snapshot,
  };
}
