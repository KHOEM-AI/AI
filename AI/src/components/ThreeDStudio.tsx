import { useState } from "react";
import ModelViewer from "./ModelViewer";
import HumanViewer from "./HumanViewer";
import MenuGlyph from "./MenuGlyph";
import "./DayExtras.css";

type Props = {
  onClose: () => void;
  onSwitch?: () => void;
};

export default function ThreeDStudio({ onClose, onSwitch }: Props) {
  const [tab, setTab] = useState<"cars" | "people">("cars");
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

      <div style={{ padding: "0 8px" }}>
        <button className="three-studio__button" style={{ marginRight: 8, opacity: tab === "cars" ? 1 : 0.6 }} onClick={() => setTab("cars")}>🚗 ឡាន · Vehicles</button>
        <button className="three-studio__button" style={{ opacity: tab === "people" ? 1 : 0.6 }} onClick={() => setTab("people")}>🧍 មនុស្ស · People</button>
      </div>
      {tab === "cars" ? <ModelViewer /> : <HumanViewer />}
    </section>
  );
}
