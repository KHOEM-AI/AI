import { useEffect, useRef, useState } from "react";
import type { Mesh } from "three";
import { createThreeScene } from "../ai/threeScene.mjs";

type ThreeSceneModule = ReturnType<typeof createThreeScene>;

type Props = {
  onClose: () => void;
  /** When given, shows a button that switches to the Camera Studio. */
  onSwitch?: () => void;
};

// The angle label only needs ~10 updates per second; re-rendering React every
// animation frame is wasted work on a phone.
const UI_INTERVAL_MS = 100;

export default function ThreeDStudio({ onClose, onSwitch }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(0.5);
  const [angle, setAngle] = useState(0);
  const [failed, setFailed] = useState(false);
  const sceneRef = useRef<ThreeSceneModule | null>(null);
  const runningRef = useRef(true);
  const speedRef = useRef(0.5);
  // Shared with turnTo(): the animation clock lives in a ref so Reset can rewind it.
  const elapsedRef = useRef(0);

  useEffect(() => {
    let renderer: import("three").WebGLRenderer | undefined;
    let observer: ResizeObserver | undefined;
    let frame = 0;
    let lastTime = 0;
    let lastUi = 0;
    let lastShown = -1;
    let disposed = false;

    async function start() {
      try {
        const THREE = await import("three");
        const host = hostRef.current;
        if (disposed || !host) return;

        const data = createThreeScene();
        sceneRef.current = data;

        const gl = new THREE.WebGLRenderer({
          antialias: true,
          alpha: false,
          powerPreference: "low-power",
        });
        renderer = gl;
        gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        gl.setClearColor(0x101827, 1);
        host.appendChild(gl.domElement);
        gl.domElement.style.width = "100%";
        gl.domElement.style.height = "100%";
        gl.domElement.style.display = "block";

        const resize = () => {
          const width = Math.max(1, host.clientWidth);
          const height = Math.max(1, host.clientHeight);
          gl.setSize(width, height, false);
          data.camera.aspect = width / height;
          data.camera.updateProjectionMatrix();
        };

        observer = new ResizeObserver(resize);
        observer.observe(host);
        resize();

        const animate = (now: number) => {
          if (disposed) return;
          if (lastTime) {
            const delta = Math.min((now - lastTime) / 1000, 0.05);
            if (runningRef.current) elapsedRef.current += delta;
          }
          lastTime = now;

          data.setOrbitSpeed(speedRef.current);
          data.update(elapsedRef.current);
          gl.render(data.scene, data.camera);

          if (now - lastUi >= UI_INTERVAL_MS) {
            lastUi = now;
            const degrees =
              (((elapsedRef.current * speedRef.current * 180) / Math.PI) % 360 + 360) % 360;
            const shown = Math.round(degrees);
            if (shown !== lastShown) {
              lastShown = shown;
              setAngle(degrees);
            }
          }
          frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
      } catch (error) {
        console.error("[ThreeDStudio] WebGL initialization failed:", error);
        if (!disposed) setFailed(true);
      }
    }

    void start();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      if (sceneRef.current) {
        sceneRef.current.scene.traverse((object) => {
          const mesh = object as Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => material.dispose());
        });
        sceneRef.current = null;
      }
      if (renderer) {
        renderer.dispose();
        // Frees the GPU context right away, so switching to Camera Studio is cheap.
        renderer.forceContextLoss();
        renderer.domElement.remove();
      }
    };
  }, []);

  function toggleRunning() {
    runningRef.current = !runningRef.current;
    setRunning(runningRef.current);
  }

  function changeSpeed(value: number) {
    speedRef.current = value;
    setSpeed(value);
  }

  function turnTo(degrees: number) {
    const safeDegrees = ((degrees % 360) + 360) % 360;
    // update() is driven by elapsed time, so rewind the clock to the chosen angle;
    // otherwise the next frame would overwrite setOrbitAngle() and Reset would do nothing.
    if (speedRef.current > 0) {
      elapsedRef.current = (safeDegrees * Math.PI) / 180 / speedRef.current;
    }
    sceneRef.current?.setOrbitAngle(safeDegrees);
    setAngle(safeDegrees);
  }

  return (
    <section className="three-studio" role="dialog" aria-modal="true" aria-label="3D Studio">
      <header className="three-studio__header">
        <div>
          <h2>3D Studio</h2>
          <p>Three.js · Camera Orbit 360°</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onSwitch && (
            <button className="three-studio__button" onClick={onSwitch}>
              📷 Camera
            </button>
          )}
          <button className="three-studio__close" onClick={onClose} aria-label="Close 3D Studio">
            ✕
          </button>
        </div>
      </header>

      <div className="three-studio__viewport" ref={hostRef}>
        <div className="three-studio__angle">{Math.round(angle)}°</div>
        {failed && (
          <p className="three-studio__note" role="alert">
            មិនអាចចាប់ផ្ដើម WebGL លើឧបករណ៍នេះបានទេ។
          </p>
        )}
      </div>

      <div className="three-studio__controls">
        <button onClick={toggleRunning} className="three-studio__button">
          {running ? "Ⅱ Pause orbit" : "▶ Resume orbit"}
        </button>
        <button onClick={() => turnTo(0)} className="three-studio__button">
          Reset 0°
        </button>
        <label className="three-studio__speed">
          <span>Orbit speed: {speed.toFixed(1)} rad/s</span>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.1"
            value={speed}
            onChange={(event) => changeSpeed(Number(event.target.value))}
          />
        </label>
      </div>
      <p className="three-studio__note">
        Preview uses your device's WebGL capabilities. Rendering quality depends on the device.
      </p>
    </section>
  );
}
