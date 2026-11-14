import { useEffect, useRef, useState } from "react";
import type { AnimationAction, AnimationMixer, Group, Material, Mesh, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { uploadMedia } from "../api/client";
import { VEHICLES, vehicleById } from "../ai/vehicles.mjs";
import {
  CAMERA_PRESETS, LED_MODES, cameraPreset, fitDistance, guessBodyMaterial, isGlb, isLedName, isOneShotClip, isWheelName, turntableAngle,
} from "../ai/modelTools.mjs";

// 3D model viewer for the KHOEM-AI vehicles (any .glb works): turn it 360°, change the camera angle and the
// body colour, switch the 369 LED colours, play the animations the model has, spin wheels the model names,
// take a PNG and record a 360° turntable video into the library.
// The animation, door and wheel features only work when the .glb really contains such clips / named parts.

const box: React.CSSProperties = { background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 10, marginTop: 10 };
const input: React.CSSProperties = { borderRadius: 8, padding: 8, fontSize: 15, marginRight: 6, marginBottom: 6 };
const btn: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: "none", background: "#4f7cff", color: "#fff", fontSize: 14, marginRight: 6, marginTop: 4 };
const soft: React.CSSProperties = { ...btn, background: "rgba(255,255,255,0.14)" };

const RECORD_SECONDS = 8;
const VIEW_LABELS: Record<string, string> = { threeQuarter: "3/4", front: "មុខ · front", side: "ខាង · side", rear: "ក្រោយ · rear", top: "លើ · top" };
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

type Api = {
  load: (buf: ArrayBuffer) => Promise<{ materials: string[]; body: string; clips: string[]; leds: number; wheels: number }>;
  clear: () => void;
  setColor: (material: string, hex: string) => void;
  resetColors: () => void;
  setLed: (mode: string) => number;
  togglePlay: (clip: string) => boolean;
  view: (name: string) => void;
  snapshot: () => Promise<Blob | null>;
  record: () => Promise<Blob>;
};

export default function ModelViewer({ onClose }: { onClose?: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const autoRef = useRef(true);
  const speedRef = useRef(0.6);
  const wheelRef = useRef(false);
  const axisRef = useRef<"x" | "y" | "z">("x");

  const [ready, setReady] = useState(false);
  const [vehicleId, setVehicleId] = useState(VEHICLES[0].id);
  const [hasModel, setHasModel] = useState(false);
  const [auto, setAuto] = useState(true);
  const [speed, setSpeed] = useState(0.6);
  const [materials, setMaterials] = useState<string[]>([]);
  const [material, setMaterial] = useState("");
  const [color, setColor] = useState("#c0c8d8");
  const [clips, setClips] = useState<string[]>([]);
  const [playing, setPlaying] = useState<Record<string, boolean>>({});
  const [leds, setLeds] = useState(0);
  const [ledMode, setLedMode] = useState("");
  const [wheels, setWheels] = useState(0);
  const [spin, setSpin] = useState(false);
  const [axis, setAxis] = useState<"x" | "y" | "z">("x");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  const vehicle = vehicleById(vehicleId) || VEHICLES[0];

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let renderer: WebGLRenderer | undefined;
    let observer: ResizeObserver | undefined;
    let dispose = () => {};

    async function start() {
      try {
        const THREE = await import("three");
        const { OrbitControls: Orbit } = await import("three/examples/jsm/controls/OrbitControls.js");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        const host = hostRef.current;
        if (disposed || !host) return;

        const gl = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
        renderer = gl;
        gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        host.appendChild(gl.domElement);
        Object.assign(gl.domElement.style, { width: "100%", height: "100%", display: "block", touchAction: "none" });

        const scene: Scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b1220);
        const pm = new THREE.PMREMGenerator(gl);
        scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
        const sun = new THREE.DirectionalLight(0xffffff, 2);
        sun.position.set(3, 5, 4);
        scene.add(sun, new THREE.HemisphereLight(0xaaccff, 0x223344, 0.6));
        const floor = new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.MeshStandardMaterial({ color: 0x1b2438, roughness: 0.9 }));
        floor.rotation.x = -Math.PI / 2;
        floor.visible = false;
    scene.add(floor);
        const pivot: Group = new THREE.Group();
        scene.add(pivot);

        const camera: PerspectiveCamera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        camera.position.set(4, 2, 4);
        const controls: OrbitControls = new Orbit(camera, gl.domElement);
        gl.domElement.style.touchAction = "pan-y"; // vertical swipe scrolls the page, horizontal rotates
        controls.enableDamping = true;
        controls.target.set(0, 0.6, 0);

        const resize = () => {
          const w = Math.max(1, host.clientWidth);
          const h = Math.max(1, host.clientHeight);
          gl.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        observer = new ResizeObserver(resize);
        observer.observe(host);
        resize();

        // ---- the loaded model ----
        let model: Object3D | null = null;
        let mixer: AnimationMixer | null = null;
        let radius = 3;
        let height = 1;
        const actions = new Map<string, AnimationAction>();
        const groups = new Map<string, Material[]>();
        const original = new Map<Material, { color?: string; emissive?: string; intensity?: number }>();
        let wheelNodes: Object3D[] = [];
        let angle = 0;
        const rec = { active: false, start: 0, done: null as null | (() => void) };

        const freeModel = () => {
          if (model) {
            pivot.remove(model);
            model.traverse((o) => {
              const m = o as Mesh;
              if (!m.isMesh) return;
              m.geometry.dispose();
              (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => {
                Object.values(mat as unknown as Record<string, unknown>).forEach((v) => {
                  const t = v as { isTexture?: boolean; dispose?: () => void };
                  if (t && t.isTexture && t.dispose) t.dispose();
                });
                mat.dispose();
              });
            });
          }
          floor.visible = false; model = null; mixer = null; actions.clear(); groups.clear(); original.clear(); wheelNodes = [];
        };

        const place = (name: string) => {
          const [x, y, z] = cameraPreset(name, fitDistance(radius, camera.fov)) as number[];
          camera.position.set(x, y + height / 2, z);
          controls.target.set(0, height / 2, 0);
          controls.update();
        };

        const api: Api = {
          async load(buf) {
            const loader = new GLTFLoader();
            const gltf: GLTF = await new Promise((res, rej) => loader.parse(buf, "", res, (e) => rej(e instanceof Error ? e : new Error("The model could not be read"))));
            freeModel();
            const m = gltf.scene;
            const b0 = new THREE.Box3().setFromObject(m);
            const s0 = b0.getSize(new THREE.Vector3());
            m.scale.multiplyScalar(3 / (Math.max(s0.x, s0.y, s0.z) || 1)); // fit: longest side = 3 units
            m.updateMatrixWorld(true);
            const b = new THREE.Box3().setFromObject(m);
            const c = b.getCenter(new THREE.Vector3());
            m.position.set(m.position.x - c.x, m.position.y - b.min.y, m.position.z - c.z); // centred, standing on the floor
            pivot.add(m);
        floor.visible = true;
            model = m;
            const size = b.getSize(new THREE.Vector3());
            height = size.y;
            radius = size.length() / 2;

            const areas = new Map<string, number>();
            const wheelSet = new Set<Object3D>();
            m.traverse((o) => {
              if (isWheelName(o.name)) wheelSet.add(o);
              const mesh = o as Mesh;
              if (!mesh.isMesh) return;
              mesh.geometry.computeBoundingBox();
              const gs = mesh.geometry.boundingBox ? mesh.geometry.boundingBox.getSize(new THREE.Vector3()) : new THREE.Vector3();
              const area = gs.x * gs.y + gs.y * gs.z + gs.x * gs.z;
              (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((mat, i) => {
                const name = mat.name || `material_${i}`;
                const list = groups.get(name) || [];
                if (!list.includes(mat)) list.push(mat);
                groups.set(name, list);
                areas.set(name, (areas.get(name) || 0) + area);
                const any = mat as unknown as { color?: { getHexString: () => string }; emissive?: { getHexString: () => string }; emissiveIntensity?: number };
                original.set(mat, {
                  color: any.color ? `#${any.color.getHexString()}` : undefined,
                  emissive: any.emissive ? `#${any.emissive.getHexString()}` : undefined,
                  intensity: any.emissiveIntensity,
                });
              });
            });
            wheelNodes = [...wheelSet].filter((n) => {
              for (let p = n.parent; p; p = p.parent) if (wheelSet.has(p)) return false; // top-most only: no double spin
              return true;
            });

            if (gltf.animations.length) mixer = new THREE.AnimationMixer(m);
            gltf.animations.forEach((clip, i) => { if (mixer) actions.set(clip.name || `clip_${i + 1}`, mixer.clipAction(clip)); });

            place("threeQuarter");
            const names = [...groups.keys()];
            return {
              materials: names,
              body: guessBodyMaterial(names.map((n) => ({ name: n, area: areas.get(n) || 0 }))) || "",
              clips: [...actions.keys()],
              leds: names.filter(isLedName).length,
              wheels: wheelNodes.length,
            };
          },
          clear: freeModel,
          setColor(materialName, hex) {
            (groups.get(materialName) || []).forEach((mat) => {
              const c = (mat as unknown as { color?: { set: (v: string) => void } }).color;
              if (c) c.set(hex);
            });
          },
          resetColors() {
            original.forEach((o, mat) => {
              const any = mat as unknown as { color?: { set: (v: string) => void }; emissive?: { set: (v: string) => void }; emissiveIntensity?: number };
              if (o.color && any.color) any.color.set(o.color);
              if (o.emissive && any.emissive) any.emissive.set(o.emissive);
              if (o.intensity !== undefined) any.emissiveIntensity = o.intensity;
            });
          },
          setLed(mode) {
            let changed = 0;
            groups.forEach((mats, name) => {
              if (!isLedName(name)) return;
              mats.forEach((mat) => {
                const o = original.get(mat);
                const any = mat as unknown as { emissive?: { set: (v: string) => void }; emissiveIntensity?: number };
                if (!any.emissive) return;
                if (mode && (LED_MODES as Record<string, { hex: string }>)[mode]) {
                  any.emissive.set((LED_MODES as Record<string, { hex: string }>)[mode].hex);
                  any.emissiveIntensity = 2.5;
                } else if (o) {
                  if (o.emissive) any.emissive.set(o.emissive);
                  any.emissiveIntensity = o.intensity ?? 1;
                }
                changed++;
              });
            });
            return changed;
          },
          togglePlay(name) {
            const a = actions.get(name);
            if (!a) return false;
            if (a.isRunning()) { a.stop(); return false; }
            if (isOneShotClip(name)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
            a.reset().play();
            return true;
          },
          view: place,
          snapshot: () => new Promise((res) => { gl.render(scene, camera); gl.domElement.toBlob((b) => res(b), "image/png"); }),
          record() {
            return new Promise<Blob>((resolve, reject) => {
              if (typeof MediaRecorder === "undefined") { reject(new Error("This browser cannot record video")); return; }
              const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t));
              if (!mime) { reject(new Error("This browser cannot record WebM video")); return; }
              const chunks: Blob[] = [];
              const recorder = new MediaRecorder(gl.domElement.captureStream(30), { mimeType: mime, videoBitsPerSecond: 2_500_000 });
              recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
              recorder.onerror = () => reject(new Error("Recording failed"));
              recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
              rec.done = () => recorder.stop();
              rec.start = performance.now();
              rec.active = true;
              recorder.start();
            });
          },
        };
        apiRef.current = api;

        let last = performance.now();
        const frame = (now: number) => {
          raf = requestAnimationFrame(frame);
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          if (rec.active) {
            const el = (now - rec.start) / 1000;
            pivot.rotation.y = turntableAngle(Math.min(el, RECORD_SECONDS), RECORD_SECONDS);
            if (el >= RECORD_SECONDS) { rec.active = false; if (rec.done) rec.done(); rec.done = null; }
          } else if (autoRef.current) {
            angle += speedRef.current * dt;
            pivot.rotation.y = angle;
          }
          if (mixer) mixer.update(dt);
          if (wheelRef.current) wheelNodes.forEach((w) => { w.rotation[axisRef.current] += 6 * dt; });
          controls.update();
          gl.render(scene, camera);
        };
        raf = requestAnimationFrame(frame);

        dispose = () => { freeModel(); pm.dispose(); controls.dispose(); };
        setReady(true);
      } catch (e) { if (!disposed) setErr(msg(e)); }
    }

    void start();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      dispose();
      if (observer) observer.disconnect();
      if (renderer) { renderer.dispose(); renderer.domElement.remove(); }
      apiRef.current = null;
    };
  }, []);

  function applyLoaded(r: { materials: string[]; body: string; clips: string[]; leds: number; wheels: number }) {
    setMaterials(r.materials); setMaterial(r.body); setClips(r.clips); setPlaying({}); setLeds(r.leds); setLedMode("");
    setWheels(r.wheels); setSpin(false); wheelRef.current = false; setHasModel(true);
  }

  async function loadBuffer(buf: ArrayBuffer, label: string) {
    const api = apiRef.current;
    if (!api) return;
    setBusy(true); setErr(""); setNote("");
    try {
      if (!isGlb(buf)) throw new Error("This is not a .glb model (binary glTF)");
      applyLoaded(await api.load(buf));
      setNote(`✅ ${label}`);
    } catch (e) { setErr(msg(e)); }
    setBusy(false);
  }

  function clearModel() {
    if (apiRef.current) apiRef.current.clear();
    setHasModel(false); setMaterials([]); setClips([]); setLeds(0); setWheels(0);
  }

  // Load /models/<id>.glb when it exists (a dev server answers a missing file with an HTML page, so check the bytes).
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      setErr(""); setNote("");
      try {
        const r = await fetch(vehicle.glb);
        const buf = r.ok ? await r.arrayBuffer() : null;
        if (cancelled) return;
        if (buf && isGlb(buf)) await loadBuffer(buf, `${vehicle.name} (${vehicle.glb})`);
        else { clearModel(); setNote(`មិនទាន់មានម៉ូដែល 3D · No 3D model yet. Put it at public${vehicle.glb} or import a .glb.`); }
      } catch { if (!cancelled) { clearModel(); setNote("មិនទាន់មានម៉ូដែល 3D · No 3D model yet."); } }
    })();
    return () => { cancelled = true; };
  }, [ready, vehicleId]);

  const changeColor = (hex: string) => { setColor(hex); if (apiRef.current && material) apiRef.current.setColor(material, hex); };
  function led(mode: string) {
    if (!apiRef.current) return;
    const n = apiRef.current.setLed(mode);
    setLedMode(mode);
    setNote(n ? "" : "ម៉ូដែលនេះគ្មានផ្នែកភ្លើង (LED) ដាច់ដោយឡែក · This model has no separate LED parts.");
  }
  async function shot() {
    if (!apiRef.current) return;
    const b = await apiRef.current.snapshot();
    if (!b) { setErr("Could not make the picture"); return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = `${vehicle.id}.png`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function record() {
    if (!apiRef.current) return;
    setBusy(true); setErr(""); setNote(`🎥 កំពុងថត ${RECORD_SECONDS} វិនាទី · Recording ${RECORD_SECONDS} s...`);
    try {
      const blob = await apiRef.current.record();
      setNote("☁ កំពុងរក្សាទុក · Saving...");
      await uploadMedia(blob, `${vehicle.id}-turntable.webm`);
      setNote("✅ បានរក្សាទុកក្នុងបណ្ណាល័យ · Saved to the library (Create ▸ Finish / Merge)");
    } catch (e) { setErr(msg(e)); setNote(""); }
    setBusy(false);
  }

  return (
    <div style={{ padding: 8 }}>
      <div>
        {onClose && <button style={soft} onClick={onClose}>← ត្រឡប់ · Back</button>}
        <b>🚗 KHOEM-AI 3D</b>
      </div>
      <select style={{ ...input, width: "100%", marginTop: 8 }} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
        {VEHICLES.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.kind}</option>)}
      </select>

      <div style={{ position: "relative", width: "100%", height: "46vh", minHeight: 260, borderRadius: 10, overflow: "hidden", background: "#0b1220" }}>
        <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />
        {!hasModel && (
          <img src={vehicle.image} alt={vehicle.name}
            style={{ position: "absolute", left: "5%", top: "20%", width: "90%", objectFit: "contain", opacity: 0.9, pointerEvents: "none" }} />
        )}
      </div>
      {busy && <div>កំពុងដំណើរការ... · Working...</div>}
      {note && <div style={{ marginTop: 6 }}>{note}</div>}
      {err && <div style={{ color: "#ff8a8a", marginTop: 6 }}>⚠ {err}</div>}

      <div style={box}>
        <label style={{ ...soft, display: "inline-block", cursor: "pointer" }}>
          📂 នាំចូល .glb · Import
          <input type="file" accept=".glb,model/gltf-binary" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void f.arrayBuffer().then((b) => loadBuffer(b, f.name)); }} />
        </label>
        <button style={soft} disabled={!hasModel || busy} onClick={() => void shot()}>📸 PNG</button>
        <button style={soft} disabled={!hasModel || busy} onClick={() => void record()}>🎥 360° → Library</button>
      </div>

      <div style={box}>
        <div>🔄 បង្វិល · Turntable</div>
        <label><input type="checkbox" checked={auto} onChange={(e) => { setAuto(e.target.checked); autoRef.current = e.target.checked; }} /> បង្វិលស្វ័យប្រវត្តិ · Auto-turn</label>
        <div>
          <input type="range" min={0.1} max={2} step={0.1} value={speed}
            onChange={(e) => { const v = Number(e.target.value); setSpeed(v); speedRef.current = v; }} /> {speed.toFixed(1)} rad/s
        </div>
        <div>📷 {CAMERA_PRESETS.map((p: string) => (
          <button key={p} style={soft} disabled={!hasModel} onClick={() => apiRef.current && apiRef.current.view(p)}>{VIEW_LABELS[p]}</button>
        ))}</div>
      </div>

      <div style={box}>
        <div>🎨 ពណ៌ · Colour</div>
        <select style={input} disabled={!hasModel} value={material} onChange={(e) => setMaterial(e.target.value)}>
          {materials.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="color" disabled={!hasModel || !material} value={color} onChange={(e) => changeColor(e.target.value)} />
        <button style={soft} disabled={!hasModel} onClick={() => { if (apiRef.current) apiRef.current.resetColors(); setLedMode(""); }}>↺ ដើម · Reset</button>
        <div>💡 369 LED{leds === 0 && hasModel ? " (no LED parts found)" : ""}</div>
        {Object.entries(LED_MODES).map(([k, v]) => (
          <button key={k} style={ledMode === k ? btn : soft} disabled={!hasModel} onClick={() => led(k)}>{(v as { n: number }).n} {(v as { label: string }).label}</button>
        ))}
        <button style={soft} disabled={!hasModel} onClick={() => led("")}>OFF</button>
      </div>

      <div style={box}>
        <div>🎬 ចលនា · Animations ({clips.length})</div>
        {clips.length === 0 && <div style={{ opacity: 0.75, fontSize: 13 }}>ម៉ូដែលនេះគ្មាន Animation (បើកទ្វារ ។ល។) · This model has no animation clips.</div>}
        {clips.map((c) => (
          <button key={c} style={playing[c] ? btn : soft} onClick={() => { if (apiRef.current) { const on = apiRef.current.togglePlay(c); setPlaying((p) => ({ ...p, [c]: on })); } }}>
            {playing[c] ? "■" : "▶"} {c}
          </button>
        ))}
        <div>🛞 កង់ · Wheels ({wheels})</div>
        {wheels === 0 && hasModel && <div style={{ opacity: 0.75, fontSize: 13 }}>គ្មានកង់ដាច់ដោយឡែក · No separate wheel parts named wheel/tyre/tire.</div>}
        <label><input type="checkbox" disabled={wheels === 0} checked={spin} onChange={(e) => { setSpin(e.target.checked); wheelRef.current = e.target.checked; }} /> បង្វិលកង់ · Spin wheels</label>{" "}
        <select style={input} disabled={wheels === 0} value={axis} onChange={(e) => { const a = e.target.value as "x" | "y" | "z"; setAxis(a); axisRef.current = a; }}>
          <option value="x">axis X</option><option value="y">axis Y</option><option value="z">axis Z</option>
        </select>
      </div>
    </div>
  );
}
