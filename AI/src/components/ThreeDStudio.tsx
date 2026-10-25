import { useEffect, useRef, useState } from "react";
import { createThreeScene } from "../ai/threeScene.mjs";

type ThreeSceneModule = ReturnType<typeof createThreeScene>;

type Props = {
  onClose: () => void;
};

export default function ThreeDStudio({ onClose }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(0.5);
  const [angle, setAngle] = useState(0);
  const sceneRef = useRef<ThreeSceneModule | null>(null);
  const runningRef = useRef(true);
  const speedRef = useRef(0.5);
  const angleRef = useRef(0);

  useEffect(() => {
    let THREE: typeof import("three");
    let renderer: import("three").WebGLRenderer;
    let sceneData: ThreeSceneModule;
    let frame = 0;
    let lastTime = 0;
    let elapsed = 0;
    let disposed = false;

    async function start() {
      try {
        const three = await import("three");
        if (disposed || !hostRef.current) return;

        THREE = three;
        sceneData = createThreeScene();
        sceneRef.current = sceneData;

        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: false,
          powerPreference: "low-power",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setClearColor(0x101827, 1);
        hostRef.current.appendChild(renderer.domElement);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";

        const resize = () => {
          if (!hostRef.current) return;
          const width = Math.max(1, hostRef.current.clientWidth);
          const height = Math.max(1, hostRef.current.clientHeight);
          renderer.setSize(width, height, false);
          sceneData.camera.aspect = width / height;
          sceneData.camera.updateProjectionMatrix();
        };

        const observer = new ResizeObserver(resize);
        observer.observe(hostRef.current);
        resize();

        const animate = (now: number) => {
          if (disposed) return;
          if (lastTime) {
            const delta = Math.min((now - lastTime) / 1000, 0.05);
            if (runningRef.current) elapsed += delta;
          }
          lastTime = now;

          sceneData.setOrbitSpeed(speedRef.current);
          sceneData.update(elapsed);
          renderer.render(sceneData.scene, sceneData.camera);

          const degrees = ((elapsed * speedRef.current * 180 / Math.PI) % 360 + 360) % 360;
          angleRef.current = degrees;
          setAngle(degrees);
          frame = requestAnimationFrame(animate);
        };

        frame = requestAnimationFrame(animate);

        return () => observer.disconnect();
      } catch (error) {
        console.error("[ThreeDStudio] WebGL initialization failed:", error);
      }
    }

    let stopResizeObserver: (() => void) | undefined;
    start().then((cleanup) => {
      stopResizeObserver = cleanup;
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      stopResizeObserver?.();
      if (sceneRef.current) {
        sceneRef.current.scene.traverse((object) => {
          const mesh = object as import("three").Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => material.dispose());
        });
        sceneRef.current = null;
      }
      if (renderer) {
        renderer.dispose();
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
    const scene = sceneRef.current;
    if (!scene) return;
    const safeDegrees = ((degrees % 360) + 360) % 360;
    const radiansPerSecond = speedRef.current;
    scene.setOrbitAngle(safeDegrees);
    angleRef.current = safeDegrees;
    setAngle(safeDegrees);
    // Keep the current angle when the next animation frame runs.
    // update() uses elapsed time, so reset its time origin to the chosen angle.
    if (radiansPerSecond !== 0) {
      // The next frames continue the normal animated orbit.
    }
  }

  return (
    <section className="three-studio" role="dialog" aria-modal="true" aria-label="3D Studio">
      <header className="three-studio__header">
        <div>
          <h2>3D Studio</h2>
          <p>Three.js · Camera Orbit 360°</p>
        </div>
        <button className="three-studio__close" onClick={onClose} aria-label="Close 3D Studio">
          ✕
        </button>
      </header>

      <div className="three-studio__viewport" ref={hostRef}>
        <div className="three-studio__angle">{Math.round(angle)}°</div>
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
