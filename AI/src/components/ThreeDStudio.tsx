import ModelViewer from "./ModelViewer";
import MenuGlyph from "./MenuGlyph";
import "./DayExtras.css";

type Props = {
  onClose: () => void;
  onSwitch?: () => void;
};

export default function ThreeDStudio({ onClose, onSwitch }: Props) {
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

      <ModelViewer />
    </section>
  );
}
