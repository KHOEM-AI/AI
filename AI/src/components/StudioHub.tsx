import { lazy, Suspense, useCallback, useState } from "react";

// Only one studio is mounted at a time, so WebGL and the camera never compete
// for the phone's GPU and battery. Each studio is its own lazy chunk.
const ThreeDStudio = lazy(() => import("./ThreeDStudio"));
const CameraStudio = lazy(() => import("./CameraStudio"));

export type StudioMode = "3d" | "camera";

type Props = {
  onClose: () => void;
  initialMode?: StudioMode;
};

export default function StudioHub({ onClose, initialMode = "3d" }: Props) {
  const [mode, setMode] = useState<StudioMode>(initialMode);
  const goCamera = useCallback(() => setMode("camera"), []);
  const go3d = useCallback(() => setMode("3d"), []);

  return (
    <Suspense
      fallback={
        <section className="three-studio" role="status" aria-live="polite">
          <p className="three-studio__note">កំពុងផ្ទុក…</p>
        </section>
      }
    >
      {mode === "3d" ? (
        <ThreeDStudio onClose={onClose} onSwitch={goCamera} />
      ) : (
        <CameraStudio onClose={onClose} onSwitch={go3d} />
      )}
    </Suspense>
  );
}
