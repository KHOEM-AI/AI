// KHOEM-AI 3D Studio panel: procedural cars (V99 + S1–S15) and people (female / male).
// Self-contained: only needs `three`. Mount it anywhere: <Procedural3D />
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { CAR_LIST, LED_NAMES, animateCar, buildCar, disposeObject, setCarLed, type CarId, type LedMode } from "../lib/procCars";
import { PEOPLE_PRESETS, SKIN_TONES, animatePerson, buildPerson, disposePerson, randomPerson, type Motion, type SkinName } from "../lib/procPeople";

type Tab = "cars" | "people";
const MOTIONS: Motion[] = ["idle", "walk", "wave", "pose"];
const LEDS: LedMode[] = [0, 3, 6, 9];

export default function Procedural3D({ mode }: { mode?: Tab }) {
  const host = useRef<HTMLDivElement>(null);
  const [tabState, setTab] = useState<Tab>("cars");
  const tab = mode ?? tabState;
  const [carId, setCarId] = useState<CarId>("v99");
  const [led, setLed] = useState<LedMode>(3);
  const [drive, setDrive] = useState(false);
  const [preset, setPreset] = useState<string>("khmerModelF");
  const [skin, setSkin] = useState<SkinName | "preset">("preset");
  const [motion, setMotion] = useState<Motion>("idle");
  const [seed, setSeed] = useState(0);
  const live = useRef({ tab, drive, motion, led });
  live.current = { tab, drive, motion, led };
  const sceneRef = useRef<{ set: (o: THREE.Object3D | null) => void; obj: THREE.Object3D | null; dirty: boolean } | null>(null);

  // renderer lifecycle (once)
  useEffect(() => {
    const el = host.current; if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // phone-friendly
    renderer.shadowMap.enabled = true; renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x12141c);
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.MeshStandardMaterial({ color: 0x171a24, roughness: 0.45, metalness: 0.3 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(5, 9, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); scene.add(sun);
    const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 200); cam.position.set(6, 2.6, 7);
    const ctl = new OrbitControls(cam, renderer.domElement);
    ctl.target.set(0, 0.9, 0); ctl.enableDamping = true; ctl.addEventListener("change", () => { holder.dirty = true; }); ctl.maxPolarAngle = Math.PI * 0.49; ctl.minDistance = 1.5; ctl.maxDistance = 20;
    const holder = { obj: null as THREE.Object3D | null, dirty: true, set(o: THREE.Object3D | null) {
      if (holder.obj) { scene.remove(holder.obj); if (holder.obj.userData.car) disposeObject(holder.obj); else disposePerson(holder.obj); }
      holder.obj = o; holder.dirty = true; if (o) scene.add(o);
    } };
    sceneRef.current = holder;
    const resize = () => { const w = el.clientWidth || 600, h = el.clientHeight || 420; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); holder.dirty = true; };
    resize(); const ro = new ResizeObserver(resize); ro.observe(el);
    const clock = new THREE.Clock(); let raf = 0, acc = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime, o = holder.obj, L = live.current;
      const animating = !!o && (L.tab === "people" ? L.motion !== "pose" : (L.drive || ((o.userData.car?.strobe?.length ?? 0) > 0)));
      acc += dt;
      if (animating && acc < 1 / 30) { ctl.update(); return; } // 30 fps while animating
      const step = acc; acc = 0;
      if (o && animating) { if (L.tab === "cars") animateCar(o, step, L.drive ? 6 : 0, t); else animatePerson(o, L.motion, t); holder.dirty = true; }
      if (ctl.update()) holder.dirty = true;
      if (holder.dirty) { holder.dirty = false; renderer.render(scene, cam); } // idle = no GPU work
    };
    loop();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); ctl.dispose(); holder.set(null);
      scene.environment?.dispose(); pm.dispose(); renderer.dispose(); renderer.domElement.remove(); sceneRef.current = null;
    };
  }, []);

  // swap the model
  useEffect(() => {
    const h = sceneRef.current; if (!h) return;
    if (tab === "cars") { h.set(buildCar(carId, { led })); }
    else {
      const base = preset === "random" ? randomPerson(seed) : PEOPLE_PRESETS[preset];
      h.set(buildPerson(base, skin === "preset" ? {} : { skin: SKIN_TONES[skin] }));
    }
  }, [tab, carId, preset, skin, seed]);
  useEffect(() => { const h = sceneRef.current; const o = h?.obj; if (o && tab === "cars") setCarLed(o, led); if (h) h.dirty = true; }, [led, tab]);
  useEffect(() => { const h = sceneRef.current; if (h) h.dirty = true; }, [motion, drive]);

  const btn = (on: boolean): React.CSSProperties => ({
    padding: "6px 12px", borderRadius: 999, border: "1px solid " + (on ? "#a78bfa" : "#2c3040"),
    background: on ? "#3b2a6e" : "#1a1d29", color: "#e8eaf2", cursor: "pointer", fontSize: 13,
  });
  const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, color: "#e8eaf2" }}>
      {!mode && (
        <div style={row}>
          <button style={btn(tab === "cars")} onClick={() => setTab("cars")}>🚗 Cars</button>
          <button style={btn(tab === "people")} onClick={() => setTab("people")}>🧍 People</button>
        </div>
      )}
      <div ref={host} style={{ width: "100%", height: "calc(100dvh - 440px)", minHeight: 340, borderRadius: 14, overflow: "hidden", touchAction: "none" }} />
      {tab === "cars" ? (
        <>
          <div style={row}>{CAR_LIST.map((c) => <button key={c.id} style={btn(c.id === carId)} onClick={() => setCarId(c.id)} title={c.kind}>{c.id.toUpperCase()}</button>)}</div>
          <div style={row}>
            {LEDS.map((m) => <button key={m} style={btn(m === led)} onClick={() => setLed(m)}>{m ? `${m} · ${LED_NAMES[m]}` : "LED off"}</button>)}
            <button style={btn(drive)} onClick={() => setDrive(!drive)}>⚙ Wheels</button>
          </div>
        </>
      ) : (
        <>
          <div style={row}>
            {Object.entries(PEOPLE_PRESETS).map(([k, v]) => <button key={k} style={btn(k === preset)} onClick={() => setPreset(k)}>{v.name}</button>)}
            <button style={btn(preset === "random")} onClick={() => { setPreset("random"); setSeed((x) => x + 1); }}>🎲 Random</button>
          </div>
          <div style={row}>
            <button style={btn(skin === "preset")} onClick={() => setSkin("preset")}>Skin: preset</button>
            {(Object.keys(SKIN_TONES) as SkinName[]).map((k) => (
              <button key={k} style={{ ...btn(skin === k), display: "flex", alignItems: "center", gap: 6 }} onClick={() => setSkin(k)}>
                <span style={{ width: 12, height: 12, borderRadius: 6, background: "#" + SKIN_TONES[k].toString(16).padStart(6, "0") }} />{k}
              </button>
            ))}
          </div>
          <div style={row}>{MOTIONS.map((m) => <button key={m} style={btn(m === motion)} onClick={() => setMotion(m)}>{m}</button>)}</div>
        </>
      )}
    </div>
  );
}
