import { useEffect, useRef, useState } from "react";
import type { AnimationAction, AnimationMixer, BufferGeometry, Group, Material, Mesh, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { isGlb } from "../ai/modelTools.mjs";

// 3D people for the studio. Turn them 360° (auto-turn or drag), and make them idle / walk / wave.
// If /characters/<id>.glb exists it is used (and its own animation clips are listed). Otherwise a simple
// built-in mannequin is shown: it moves, but it is a test figure, NOT a realistic person.

type Three = typeof import("three");
type Mode = "idle" | "walk" | "wave";

interface Person {
  id: string; name: string; role: string; female: boolean; height: number;
  skin: number; top: number; bottom: number; hair: number;
  tie?: number; skirt?: boolean; longHair?: boolean; bun?: boolean; longSleeves?: boolean;
}

const PEOPLE: Person[] = [
  { id: "businessman", name: "សុភ័ក្រ", role: "Businessman", female: false, height: 180, skin: 0xc58e69, top: 0x1f2a44, bottom: 0x1f2a44, hair: 0x15110e, tie: 0xb3202a, longSleeves: true },
  { id: "fashion-model", name: "ដារ៉ា", role: "Fashion Model", female: false, height: 178, skin: 0xc99672, top: 0x86b9ea, bottom: 0x232b3a, hair: 0x1a1410 },
  { id: "doctor", name: "គុសល", role: "Doctor", female: false, height: 182, skin: 0xc08a66, top: 0xf1f4f6, bottom: 0x3b4a5c, hair: 0x15110e, longSleeves: true },
  { id: "businesswoman", name: "លីហ្សា", role: "Businesswoman", female: true, height: 168, skin: 0xd0a07c, top: 0x7a2d63, bottom: 0x24202c, hair: 0x120d0b, skirt: true, longHair: true, longSleeves: true },
  { id: "student", name: "ហ្សា", role: "Student", female: true, height: 162, skin: 0xd1a27d, top: 0xf4f6f8, bottom: 0x1b2f5e, hair: 0x120d0b, skirt: true, longHair: true },
  { id: "nurse", name: "ស្រីពៅ", role: "Nurse", female: true, height: 166, skin: 0xcf9f7b, top: 0x7fd0e0, bottom: 0x7fd0e0, hair: 0x120d0b, bun: true },
];

interface Rig {
  root: Group; hips: Group; torso: Group; head: Group;
  armL: Group; armR: Group; elbowL: Group; elbowR: Group;
  legL: Group; legR: Group; kneeL: Group; kneeR: Group;
}

// Body built from capsules. Units: metres for a 1.75 m person, then scaled to the person's height.
// The figure faces +z. A limb hangs down (-y) from its joint, so rotation.x > 0 swings it backwards.
function buildPerson(T: Three, p: Person): Rig {
  const mat = (color: number, rough: number): Material => new T.MeshStandardMaterial({ color, roughness: rough });
  const skin = mat(p.skin, 0.8), top = mat(p.top, 0.75), bottom = mat(p.bottom, 0.85);
  const hair = mat(p.hair, 0.6), shoe = mat(0x15171c, 0.7), dark = mat(0x0b0b0d, 0.5);
  const sleeve = p.longSleeves ? top : skin;
  const add = (parent: Object3D, geo: BufferGeometry, m: Material, x = 0, y = 0, z = 0): Mesh => {
    const mesh = new T.Mesh(geo, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const seg = (parent: Object3D, len: number, r: number, m: Material): Mesh =>
    add(parent, new T.CapsuleGeometry(r, Math.max(0.01, len - 2 * r), 4, 10), m, 0, -len / 2, 0);
  const joint = (parent: Object3D, x: number, y: number): Group => {
    const g = new T.Group();
    g.position.set(x, y, 0);
    parent.add(g);
    return g;
  };

  const rt = p.female ? 0.14 : 0.165;
  const root = new T.Group();
  const hips = joint(root, 0, 0.92);
  const torso = joint(hips, 0, 0);
  add(torso, new T.CapsuleGeometry(rt, 0.54 - 2 * rt, 4, 12), top, 0, 0.27, 0).scale.z = 0.7;
  add(hips, new T.CapsuleGeometry(rt * 0.95, 0.06, 4, 12), bottom, 0, 0, 0).scale.z = 0.75;
  if (p.skirt) {
    const skirt = new T.MeshStandardMaterial({ color: p.bottom, roughness: 0.85, side: T.DoubleSide });
    add(hips, new T.CylinderGeometry(rt * 0.9, rt * 1.55, 0.3, 20, 1, true), skirt, 0, -0.1, 0);
  }
  add(torso, new T.CylinderGeometry(0.045, 0.05, 0.09, 12), skin, 0, 0.58, 0);
  if (p.tie !== undefined) add(torso, new T.BoxGeometry(0.04, 0.3, 0.012), mat(p.tie, 0.6), 0, 0.33, rt * 0.7 + 0.004);

  const head = joint(torso, 0, 0.72);
  add(head, new T.SphereGeometry(0.105, 20, 16), skin).scale.y = 1.12;
  for (const s of [-1, 1]) add(head, new T.SphereGeometry(0.012, 8, 6), dark, s * 0.04, 0.015, 0.098);
  const cap = add(head, new T.SphereGeometry(0.113, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 0.012, -0.004);
  cap.rotation.x = -0.5;
  if (p.longHair) add(head, new T.CapsuleGeometry(0.085, 0.2, 4, 10), hair, 0, -0.12, -0.07);
  if (p.bun) add(head, new T.SphereGeometry(0.045, 10, 8), hair, 0, 0.1, -0.1);

  const arms: Group[] = [];
  const elbows: Group[] = [];
  for (const s of [-1, 1]) {
    const arm = joint(torso, s * (rt + 0.06), 0.5);
    seg(arm, 0.29, 0.05, top);
    const elbow = joint(arm, 0, -0.29);
    seg(elbow, 0.26, 0.042, sleeve);
    add(elbow, new T.SphereGeometry(0.043, 10, 8), skin, 0, -0.275, 0);
    arms.push(arm);
    elbows.push(elbow);
  }
  const legs: Group[] = [];
  const knees: Group[] = [];
  for (const s of [-1, 1]) {
    const leg = joint(hips, s * (p.female ? 0.08 : 0.09), 0);
    seg(leg, 0.44, 0.075, bottom);
    const knee = joint(leg, 0, -0.44);
    seg(knee, 0.44, 0.058, bottom);
    add(knee, new T.BoxGeometry(0.095, 0.06, 0.25), shoe, 0, -0.45, 0.05);
    legs.push(leg);
    knees.push(knee);
  }
  root.scale.setScalar(p.height / 175);
  return { root, hips, torso, head, armL: arms[0], armR: arms[1], elbowL: elbows[0], elbowR: elbows[1], legL: legs[0], legR: legs[1], kneeL: knees[0], kneeR: knees[1] };
}

// Every frame the pose is a pure function of the mode and the clock, so switching modes never leaves a stuck limb.
function pose(r: Rig, mode: Mode, t: number): void {
  const breath = Math.sin(t * 1.6);
  r.hips.position.y = 0.92;
  r.torso.scale.y = 1 + 0.008 * breath;
  r.torso.rotation.set(0, 0.04 * Math.sin(t * 0.7), 0);
  r.head.rotation.set(0, 0.15 * Math.sin(t * 0.5), 0);
  r.legL.rotation.set(0, 0, 0);
  r.legR.rotation.set(0, 0, 0);
  r.kneeL.rotation.set(0, 0, 0);
  r.kneeR.rotation.set(0, 0, 0);
  r.armL.rotation.set(0, 0, -0.08 - 0.015 * breath);
  r.armR.rotation.set(0, 0, 0.08 + 0.015 * breath);
  r.elbowL.rotation.set(-0.12, 0, 0);
  r.elbowR.rotation.set(-0.12, 0, 0);
  if (mode === "walk") {
    const w = t * 5.5;
    const s = Math.sin(w);
    r.hips.position.y = 0.91 + Math.abs(Math.cos(w)) * 0.018;
    r.legL.rotation.x = s * 0.55;
    r.legR.rotation.x = -s * 0.55;
    r.kneeL.rotation.x = (1 - Math.cos(w + 1.2)) * 0.32;
    r.kneeR.rotation.x = (1 - Math.cos(w + 1.2 + Math.PI)) * 0.32;
    r.armL.rotation.x = -s * 0.5;
    r.armR.rotation.x = s * 0.5;
    r.elbowL.rotation.x = -0.35;
    r.elbowR.rotation.x = -0.35;
    r.torso.rotation.y = s * 0.12;
  } else if (mode === "wave") {
    r.armR.rotation.set(0, 0, 2.5);
    r.elbowR.rotation.set(0, 0, 0.35 + Math.sin(t * 8) * 0.45);
    r.head.rotation.y = 0.25 * Math.sin(t * 1.2);
  }
}

const box: React.CSSProperties = { background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 10, marginTop: 10 };
const input: React.CSSProperties = { borderRadius: 8, padding: 8, fontSize: 15, marginRight: 6, marginBottom: 6 };
const btn: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: "none", background: "#4f7cff", color: "#fff", fontSize: 14, marginRight: 6, marginTop: 4 };
const soft: React.CSSProperties = { ...btn, background: "rgba(255,255,255,0.14)" };
const MODE_LABELS: Record<Mode, string> = { idle: "ឈរ · Idle", walk: "ដើរ · Walk", wave: "ដាក់ដៃ · Wave" };
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

type Api = { show: (p: Person) => Promise<{ real: boolean; clips: string[] } | null>; togglePlay: (clip: string) => boolean; resetView: () => void };

export default function HumanViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const autoRef = useRef(true);
  const speedRef = useRef(0.6);
  const modeRef = useRef<Mode>("idle");
  const [ready, setReady] = useState(false);
  const [id, setId] = useState(PEOPLE[0].id);
  const [filter, setFilter] = useState<"all" | "m" | "f">("all");
  const [auto, setAuto] = useState(true);
  const [speed, setSpeed] = useState(0.6);
  const [mode, setMode] = useState<Mode>("idle");
  const [real, setReal] = useState(false);
  const [clips, setClips] = useState<string[]>([]);
  const [playing, setPlaying] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState("");

  const person = PEOPLE.find((x) => x.id === id) || PEOPLE[0];
  const list = PEOPLE.filter((x) => filter === "all" || (filter === "f") === x.female);

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let renderer: WebGLRenderer | undefined;
    let observer: ResizeObserver | undefined;
    let dispose = () => {};

    async function start() {
      try {
        const T = await import("three");
        const { OrbitControls: Orbit } = await import("three/examples/jsm/controls/OrbitControls.js");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const host = hostRef.current;
        if (disposed || !host) return;

        const gl = new T.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
        renderer = gl;
        gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        host.appendChild(gl.domElement);
        Object.assign(gl.domElement.style, { width: "100%", height: "100%", display: "block", touchAction: "none" });

        const scene: Scene = new T.Scene();
        scene.background = new T.Color(0x0b1220);
        scene.add(new T.HemisphereLight(0xffffff, 0x34415d, 1.6));
        const key = new T.DirectionalLight(0xffffff, 2.2);
        key.position.set(3, 5, 4);
        const rim = new T.DirectionalLight(0x39cfff, 1.2);
        rim.position.set(-4, 2, -3);
        scene.add(key, rim);
        const floor = new T.Mesh(new T.CircleGeometry(1.6, 48), new T.MeshStandardMaterial({ color: 0x182945, roughness: 0.9 }));
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);
        const pivot: Group = new T.Group();
        scene.add(pivot);

        const camera: PerspectiveCamera = new T.PerspectiveCamera(35, 1, 0.1, 100);
        const controls: OrbitControls = new Orbit(camera, gl.domElement);
        gl.domElement.style.touchAction = "pan-y"; // vertical swipe scrolls the page, horizontal rotates
        controls.enableDamping = true;
        controls.minDistance = 1.8;
        controls.maxDistance = 8;
        controls.maxPolarAngle = Math.PI * 0.49;
        const resetView = () => {
          camera.position.set(0, 1.2, 4);
          controls.target.set(0, 0.9, 0);
          controls.update();
        };
        resetView();

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

        let current: Object3D | null = null;
        let rig: Rig | null = null;
        let mixer: AnimationMixer | null = null;
        let seq = 0;
        const actions = new Map<string, AnimationAction>();

        const free = () => {
          if (current) {
            pivot.remove(current);
            current.traverse((o) => {
              const m = o as Mesh;
              if (!m.isMesh) return;
              m.geometry.dispose();
              (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
            });
          }
          current = null; rig = null; mixer = null; actions.clear();
        };

        const api: Api = {
          async show(p) {
            const mine = ++seq;
            let buf: ArrayBuffer | null = null;
            try {
              const r = await fetch(`/characters/${p.id}.glb`);
              buf = r.ok ? await r.arrayBuffer() : null; // a dev server may answer a missing file with HTML, so check the bytes
            } catch { buf = null; }
            if (mine !== seq) return null;
            if (buf && isGlb(buf)) {
              const gltf: GLTF = await new Promise((res, rej) => new GLTFLoader().parse(buf as ArrayBuffer, "", res, (e) => rej(e instanceof Error ? e : new Error("The model could not be read"))));
              if (mine !== seq) return null;
              free();
              const m = gltf.scene;
              const s0 = new T.Box3().setFromObject(m).getSize(new T.Vector3());
              m.scale.multiplyScalar(p.height / 100 / (s0.y || 1));
              m.updateMatrixWorld(true);
              const b = new T.Box3().setFromObject(m);
              const c = b.getCenter(new T.Vector3());
              m.position.set(m.position.x - c.x, m.position.y - b.min.y, m.position.z - c.z);
              pivot.add(m);
              current = m;
              if (gltf.animations.length) mixer = new T.AnimationMixer(m);
              gltf.animations.forEach((clip, i) => { if (mixer) actions.set(clip.name || `clip_${i + 1}`, mixer.clipAction(clip)); });
              return { real: true, clips: [...actions.keys()] };
            }
            free();
            rig = buildPerson(T, p);
            current = rig.root;
            pivot.add(rig.root);
            return { real: false, clips: [] };
          },
          togglePlay(name) {
            const a = actions.get(name);
            if (!a) return false;
            if (a.isRunning()) { a.stop(); return false; }
            a.reset().play();
            return true;
          },
          resetView,
        };
        apiRef.current = api;

        let last = performance.now();
        const frame = (now: number) => {
          raf = requestAnimationFrame(frame);
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          if (autoRef.current) pivot.rotation.y += speedRef.current * dt;
          if (rig) pose(rig, modeRef.current, now / 1000);
          if (mixer) mixer.update(dt);
          controls.update();
          gl.render(scene, camera);
        };
        raf = requestAnimationFrame(frame);

        dispose = () => { free(); controls.dispose(); };
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

  useEffect(() => {
    if (!ready || !apiRef.current) return;
    let cancelled = false;
    setErr("");
    apiRef.current.show(person).then((r) => {
      if (cancelled || !r) return;
      setReal(r.real); setClips(r.clips); setPlaying({});
    }).catch((e) => { if (!cancelled) setErr(msg(e)); });
    return () => { cancelled = true; };
  }, [ready, id]);

  const pick = (m: Mode) => { setMode(m); modeRef.current = m; };

  return (
    <div style={{ padding: 8 }}>
      <b>🧍 KHOEM-AI 3D · តួអង្គ · Characters</b>
      <div style={{ marginTop: 6 }}>
        <button style={filter === "all" ? btn : soft} onClick={() => setFilter("all")}>ទាំងអស់ ({PEOPLE.length})</button>
        <button style={filter === "m" ? btn : soft} onClick={() => setFilter("m")}>♂ ប្រុស</button>
        <button style={filter === "f" ? btn : soft} onClick={() => setFilter("f")}>♀ ស្រី</button>
      </div>
      <select style={{ ...input, width: "100%", marginTop: 8 }} value={id} onChange={(e) => setId(e.target.value)}>
        {list.map((x) => <option key={x.id} value={x.id}>{x.female ? "♀" : "♂"} {x.name} · {x.role} · {x.height} cm</option>)}
        {!list.some((x) => x.id === id) && <option value={id}>{person.name} · {person.role}</option>}
      </select>

      <div style={{ position: "relative", width: "100%", height: "52vh", minHeight: 300, borderRadius: 10, overflow: "hidden", background: "#0b1220" }}>
        <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
        {real
          ? "✅ ម៉ូដែល .glb ពិត · Real .glb model"
          : `មនុស្សក្លែងសាកល្បង (មិនមែនមនុស្សពិត) · Test mannequin — real model: put it at public/characters/${person.id}.glb`}
      </div>
      {err && <div style={{ color: "#ff8a8a", marginTop: 6 }}>⚠ {err}</div>}

      <div style={box}>
        <div>🔄 បង្វិល 360° · Turn (អូសដើម្បីបង្វិលដោយដៃ · drag; pinch = zoom)</div>
        <label><input type="checkbox" checked={auto} onChange={(e) => { setAuto(e.target.checked); autoRef.current = e.target.checked; }} /> បង្វិលស្វ័យប្រវត្តិ · Auto-turn</label>
        <div>
          <input type="range" min={0.1} max={2} step={0.1} value={speed}
            onChange={(e) => { const v = Number(e.target.value); setSpeed(v); speedRef.current = v; }} /> {speed.toFixed(1)} rad/s
        </div>
        <button style={soft} onClick={() => apiRef.current && apiRef.current.resetView()}>↺ មើលពីមុខ · Reset view</button>
      </div>

      <div style={box}>
        <div>🎬 ចលនា · Motion</div>
        {!real && (Object.keys(MODE_LABELS) as Mode[]).map((m) => (
          <button key={m} style={mode === m ? btn : soft} onClick={() => pick(m)}>{MODE_LABELS[m]}</button>
        ))}
        {real && clips.length === 0 && <div style={{ opacity: 0.75, fontSize: 13 }}>ម៉ូដែលនេះគ្មាន Animation · This model has no animation clips.</div>}
        {real && clips.map((c) => (
          <button key={c} style={playing[c] ? btn : soft} onClick={() => { if (apiRef.current) { const on = apiRef.current.togglePlay(c); setPlaying((p) => ({ ...p, [c]: on })); } }}>
            {playing[c] ? "■" : "▶"} {c}
          </button>
        ))}
      </div>
    </div>
  );
}
