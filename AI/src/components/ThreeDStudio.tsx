import { useState } from "react";
import ModelViewer from "./ModelViewer";
import HumanViewer from "./HumanViewer";
import Procedural3D from "./Procedural3D";
import TransportGallery from "./TransportGallery";
import { useBackStep } from "../lib/useBackClose";
import MenuGlyph from "./MenuGlyph";
import "./DayExtras.css";

type Props = {
  onClose: () => void;
  onSwitch?: () => void;
};

type IconKey = "car" | "people" | "glb" | "mannequin" | "phone" | "plane";

// Sky-blue line icons drawn in code (same style as the menu icons)
function TabIcon({ k }: { k: IconKey }) {
  let vb = "0 0 32 32";
  let body: JSX.Element;
  if (k === "car") body = <><path d="M3 17l2.2-6.2A3 3 0 018 9h16a3 3 0 012.8 1.8L29 17v4h-3.5v-2h-19v2H3z" /><circle cx="9.5" cy="19" r="1.6" /><circle cx="22.5" cy="19" r="1.6" /></>;
  else if (k === "people") body = <><circle cx="12" cy="9" r="3.5" /><path d="M5 26v-3a7 7 0 0114 0v3" /><circle cx="23" cy="11" r="3" /><path d="M21 19.5a6 6 0 016 5.5v1" /></>;
  else if (k === "glb") body = <><path d="M16 3l11 6v14l-11 6-11-6V9z" /><path d="M5 9l11 6 11-6M16 15v14" /></>;
  else if (k === "mannequin") body = <><circle cx="16" cy="6" r="3.5" /><path d="M16 10v10M8 14l8-3 8 3M12 29l4-9 4 9" /></>;
  else if (k === "phone") body = <><rect x="9" y="2" width="14" height="28" rx="3" /><path d="M14 5h4" /><circle cx="16" cy="26.5" r="1" /><path d="M12 21l3-4 3 2 3-6" /></>;
  else { vb = "0 0 44 40"; body = <><path d="M2 21L18 17L25 3L29 3L27 16L40 19Q43 20 40 22L27 24L29 36L25 36L18 26L2 23Z" /><path d="M18 17L22 20L18 26" /></>; }
  return (
    <svg width="20" height="20" viewBox={vb} fill="none" stroke="#45d9ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "middle", marginRight: 6, flexShrink: 0 }}>
      {body}
    </svg>
  );
}

export default function ThreeDStudio({ onClose, onSwitch }: Props) {
  const [tab, setTab] = useState<"vehicles" | "people" | "glb">("vehicles");
  const [vSub, setVSub] = useState<"cars" | "aircraft" | "phones">("cars");
  const [pSub, setPSub] = useState<"people" | "mannequin">("people");
  const atHome = tab === "vehicles" && vSub === "cars";
  const home = () => { setTab("vehicles"); setVSub("cars"); };
  // Back: first step back inside the studio (-> Cars), then leave the panel
  useBackStep(() => { if (!atHome) { home(); return true; } return false; });
  const goBack = () => { if (!atHome) home(); }; // Back stays inside 3D; only X leaves
  const sub = (on: boolean) => ({ opacity: on ? 1 : 0.6, fontSize: 12, padding: "6px 10px" });
  return (
    <section
      className="three-studio"
      role="dialog"
      aria-modal="true"
      aria-label="3D Studio"
      style={{ overflowY: "auto" }}
    >
      <header className="three-studio__header">
        <div>
          <h2><TabIcon k="car" />KHOEM-AI 3D Studio</h2>
          <p>Three.js · Vehicle Model Viewer · 360°</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="three-studio__button" disabled={atHome} style={{ opacity: atHome ? 0.4 : 1 }} onClick={goBack} aria-label="Back">‹ ថយក្រោយ</button>
          {onSwitch && (
            <button className="three-studio__button" onClick={onSwitch}>
              <span className="dx-icon">
                <MenuGlyph name="camera" />
              </span>
              Camera
            </button>
          )}

          <button
            className="three-studio__close"
            onClick={onClose}
            aria-label="Close 3D Studio"
          >
            <span className="dx-icon">
              <MenuGlyph name="close" />
            </span>
          </button>
        </div>
      </header>

      <div style={{ padding: "8px" }}>
        {tab === "vehicles" && vSub === "cars" && <Procedural3D mode="cars" />}
        {tab === "people" && pSub === "people" && <Procedural3D mode="people" />}
        {tab === "vehicles" && vSub === "phones" && <TransportGallery initialTab="phones" />}
        {tab === "vehicles" && vSub === "aircraft" && <TransportGallery initialTab="aircraft" />}
      </div>
      {tab === "glb" && <ModelViewer />}
      {tab === "people" && pSub === "mannequin" && <HumanViewer />}
      <nav className="td-bottomnav" aria-label="3D navigation" style={{ position: "sticky", bottom: 0, zIndex: 5, marginTop: 8, padding: "8px 8px calc(8px + env(safe-area-inset-bottom))", background: "rgba(14,16,24,.94)", backdropFilter: "blur(8px)", borderTop: "1px solid #2c3040", display: "flex", flexDirection: "column", gap: 6 }}>
        <style>{`.td-bottomnav .three-studio__button{flex:1 1 0;min-width:0;justify-content:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .td-bottomnav .td-n{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:10px;background:#3b2a6e;color:#fff;font-size:12px;font-weight:700;margin-right:6px;flex-shrink:0}
        @media (min-width:900px){.td-bottomnav{flex-direction:row;align-items:center;justify-content:center}.td-bottomnav>div{flex:0 1 560px}}`}</style>
        {tab === "vehicles" && (
          <div style={{ display: "flex", gap: 6 }}>
            <button className="three-studio__button" style={sub(vSub === "cars")} onClick={() => setVSub("cars")}><span className="td-n">1</span><TabIcon k="car" />Cars</button>
            <button className="three-studio__button" style={sub(vSub === "aircraft")} onClick={() => setVSub("aircraft")}><span className="td-n">2</span><TabIcon k="plane" />Aircraft</button>
            <button className="three-studio__button" style={sub(vSub === "phones")} onClick={() => setVSub("phones")}><span className="td-n">3</span><TabIcon k="phone" />Phone</button>
          </div>
        )}
        {tab === "people" && (
          <div style={{ display: "flex", gap: 6 }}>
            <button className="three-studio__button" style={sub(pSub === "people")} onClick={() => setPSub("people")}><span className="td-n">1</span><TabIcon k="people" />Characters</button>
            <button className="three-studio__button" style={sub(pSub === "mannequin")} onClick={() => setPSub("mannequin")}><span className="td-n">2</span><TabIcon k="mannequin" />Mannequin</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <button className="three-studio__button" style={{ opacity: tab === "vehicles" ? 1 : 0.6 }} onClick={() => setTab("vehicles")}><span className="td-n">1</span><TabIcon k="car" />ឡាន</button>
          <button className="three-studio__button" style={{ opacity: tab === "people" ? 1 : 0.6 }} onClick={() => setTab("people")}><span className="td-n">2</span><TabIcon k="people" />មនុស្ស</button>
          <button className="three-studio__button" style={{ opacity: tab === "glb" ? 1 : 0.6 }} onClick={() => setTab("glb")}><span className="td-n">3</span><TabIcon k="glb" />.glb</button>
        </div>
      </nav>
    </section>
  );
}
