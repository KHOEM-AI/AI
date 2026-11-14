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

export default function ThreeDStudio({ onClose, onSwitch }: Props) {
  const [tab, setTab] = useState<"cars" | "people" | "glb" | "mannequin" | "phones" | "aircraft">("cars");
  // Back: first step back inside the studio (tab -> Cars), then leave the panel
  useBackStep(() => { if (tab !== "cars") { setTab("cars"); return true; } return false; });
  const goBack = () => { if (tab !== "cars") setTab("cars"); else onClose(); };
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
          <h2>🚗 KHOEM-AI 3D Studio</h2>
          <p>Three.js · Vehicle Model Viewer · 360°</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="three-studio__button" onClick={goBack} aria-label="Back">‹ ថយក្រោយ</button>
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

      <div style={{ padding: "0 8px", display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button className="three-studio__button" style={{ opacity: tab === "cars" ? 1 : 0.6 }} onClick={() => setTab("cars")}>🚗 ឡាន · Cars</button>
        <button className="three-studio__button" style={{ opacity: tab === "people" ? 1 : 0.6 }} onClick={() => setTab("people")}>🧍 មនុស្ស · People</button>
        <button className="three-studio__button" style={{ opacity: tab === "glb" ? 1 : 0.6 }} onClick={() => setTab("glb")}>📦 .glb · Import</button>
        <button className="three-studio__button" style={{ opacity: tab === "mannequin" ? 1 : 0.6 }} onClick={() => setTab("mannequin")}>🧍 Mannequin</button>
        <button className="three-studio__button" style={{ opacity: tab === "phones" ? 1 : 0.6 }} onClick={() => setTab("phones")}>📱 Phone Gallery</button>
        <button className="three-studio__button" style={{ opacity: tab === "aircraft" ? 1 : 0.6 }} onClick={() => setTab("aircraft")}>✈️ Aircraft Gallery</button>
      </div>
      <div style={{ padding: "8px" }}>
        {(tab === "cars" || tab === "people") && <Procedural3D mode={tab} />}
      </div>
      {tab === "glb" && <ModelViewer />}
      {tab === "mannequin" && <HumanViewer />}
      {(tab === "phones" || tab === "aircraft") && <TransportGallery initialTab={tab} />}
    </section>
  );
}
