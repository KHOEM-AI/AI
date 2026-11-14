// KHOEM-AI 3D Studio panel: procedural cars (V99 + S1–S15) and people (female / male).
// Self-contained: only needs `three`. Mount it anywhere: <Procedural3D />
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { CAR_LIST, LED_NAMES, animateCar, buildCar, disposeObject, setCarLed, type CarId, type LedMode } from "../lib/procCars";
import Ico from "./UiIcon";
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
  const sceneRef = useRef<{ set: (o: THREE.Object3D | null, refit?: boolean) => void; fit: () => void; obj: THREE.Object3D | null; dirty: boolean } | null>(null);

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
    ctl.target.set(0, 0.9, 0); ctl.enableDamping = true; ctl.addEventListener("change", () => { holder.dirty = true; }); ctl.maxPolarAngle = Math.PI * 0.49;
    const FILL = 0.7; // model fills 70% of the viewer (30% smaller than before)
    const fit = () => {
      const o = holder.obj; if (!o) return;
      o.updateMatrixWorld(true);
      const box = new THREE.Box3(), tmp = new THREE.Box3();
      o.traverse((m) => { // measure real geometry only (skip the big additive underglow plane)
        const me = m as THREE.Mesh; if (!me.isMesh || (me.material as THREE.Material).blending === THREE.AdditiveBlending) return;
        if (!me.geometry.boundingBox) me.geometry.computeBoundingBox();
        tmp.copy(me.geometry.boundingBox!).applyMatrix4(me.matrixWorld); box.union(tmp);
      });
      if (box.isEmpty()) return;
      const sz = box.getSize(new THREE.Vector3());
      const sph = new THREE.Sphere(box.getCenter(new THREE.Vector3()), Math.max(Math.hypot(sz.x, sz.z) * 0.42, sz.y * 0.5));
      const vf = THREE.MathUtils.degToRad(cam.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
      const dist = sph.radius / (FILL * Math.sin(Math.min(vf, hf) / 2));
      const dir = new THREE.Vector3(0.55, 0.3, 0.78).normalize();
      ctl.target.copy(sph.center); ctl.target.y = Math.max(sph.center.y * 0.9, 0.5);
      cam.position.copy(ctl.target).addScaledVector(dir, dist);
      ctl.minDistance = dist * 0.35; ctl.maxDistance = dist * 3; ctl.update(); holder.dirty = true;
    };
    const holder = { obj: null as THREE.Object3D | null, dirty: true, fit, set(o: THREE.Object3D | null, refit = true) {
      if (holder.obj) { scene.remove(holder.obj); if (holder.obj.userData.car) disposeObject(holder.obj); else disposePerson(holder.obj); }
      holder.obj = o; holder.dirty = true; if (o) { scene.add(o); if (refit) fit(); }
    } };
    sceneRef.current = holder;
    const resize = () => { const w = el.clientWidth || 600, h = el.clientHeight || 420; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); holder.dirty = true; if (holder.obj) holder.fit(); };
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
    padding: "8px 14px", borderRadius: 999, border: "1px solid " + (on ? "#a78bfa" : "#2c3040"),
    background: on ? "#3b2a6e" : "#1a1d29", color: "#e8eaf2", cursor: "pointer", fontSize: 14, minHeight: 38,
  });
  const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 6 };
  const step = (n: number, title: string, children: unknown) => (
    <section key={n} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#b9bdd0" }}>
        <span style={{ width: 22, height: 22, borderRadius: 11, background: "#3b2a6e", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12 }}>{n}</span>
        {title}
      </div>
      <div style={row}>{children as never}</div>
    </section>
  );
  return (
    <div className="p3d" style={{ color: "#e8eaf2" }}>
      <style>{`
        .p3d{display:grid;grid-template-columns:1fr;gap:10px;width:100%;min-height:0}
        .p3d-view{width:100%;height:clamp(260px,46dvh,560px);border-radius:14px;overflow:hidden;touch-action:none}
        .p3d-ctl{display:flex;flex-direction:column;gap:12px;min-width:0}
        @media (min-width:900px){
          .p3d{grid-template-columns:minmax(0,1fr) minmax(300px,380px);gap:16px;align-items:start}
          .p3d-view{height:calc(100dvh - 190px);min-height:380px;max-height:1100px}
          .p3d-ctl{max-height:calc(100dvh - 190px);overflow:auto;padding-right:4px}
        }
        @media (min-width:1800px){ .p3d{grid-template-columns:minmax(0,1fr) 460px} .p3d button{font-size:17px!important} }
        @media (max-height:520px) and (orientation:landscape){
          .p3d{grid-template-columns:minmax(0,1fr) minmax(240px,320px)} .p3d-view{height:calc(100dvh - 120px);min-height:200px}
        }
      `}</style>
      <div ref={host} className="p3d-view" />
      <div className="p3d-ctl">
        {tab === "cars" ? (
          <>
            {step(1, "ជ្រើសរើសឡាន · Choose car", <>
              {CAR_LIST.map((c) => <button key={c.id} style={btn(c.id === carId)} onClick={() => setCarId(c.id)} title={c.kind}>{c.id.toUpperCase()}</button>)}
            </>)}
            {step(2, "ភ្លើង LED · Lights", <>
              {LEDS.map((m) => <button key={m} style={btn(m === led)} onClick={() => setLed(m)}>{m ? `${m} · ${LED_NAMES[m]}` : "LED off"}</button>)}
            </>)}
            {step(3, "ចលនា · Motion", <>
              <button style={btn(drive)} onClick={() => setDrive(!drive)}><Ico n="wheel" />Wheels</button>
            </>)}
          </>
        ) : (
          <>
            {step(1, "ជ្រើសរើសតួ · Choose person", <>
              {Object.entries(PEOPLE_PRESETS).map(([k, v]) => <button key={k} style={btn(k === preset)} onClick={() => setPreset(k)}>{v.name}</button>)}
              <button style={btn(preset === "random")} onClick={() => { setPreset("random"); setSeed((x) => x + 1); }}><Ico n="dice" />Random</button>
            </>)}
            {step(2, "ពណ៌សម្បុរ · Skin", <>
              <button style={btn(skin === "preset")} onClick={() => setSkin("preset")}>Preset</button>
              {(Object.keys(SKIN_TONES) as SkinName[]).map((k) => (
                <button key={k} style={{ ...btn(skin === k), display: "flex", alignItems: "center", gap: 6 }} onClick={() => setSkin(k)}>
                  <span style={{ width: 12, height: 12, borderRadius: 6, background: "#" + SKIN_TONES[k].toString(16).padStart(6, "0") }} />{k}
                </button>
              ))}
            </>)}
            {step(3, "ចលនា · Motion", <>
              {MOTIONS.map((m) => <button key={m} style={btn(m === motion)} onClick={() => setMotion(m)}>{m}</button>)}
            </>)}
          </>
        )}
        {!mode && step(4, "ប្រភេទ · Type", <>
            <button style={btn(tab === "cars")} onClick={() => setTab("cars")}><Ico n="car" />Cars</button>
            <button style={btn(tab === "people")} onClick={() => setTab("people")}><Ico n="person" />People</button>
          </>)}
      </div>
    </div>
  );
}
