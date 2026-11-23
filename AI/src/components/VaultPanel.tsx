import { useEffect } from "react";

const VAULT_URL = "https://khoem-ai.github.io/VTH/";

type Props = { onClose: () => void };

export default function VaultPanel({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        background: "#05070d",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          borderBottom: "1px solid #1d3b57",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid #4fd1ff",
            background: "#0b1530",
            color: "#e8ecff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← ត្រឡប់ទៅកម្មវិធី
        </button>
        <strong style={{ color: "#4fd1ff" }}>Data Storage</strong>
        <a
          href={VAULT_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: "auto", color: "#8fa8c0", fontSize: 13 }}
        >
          បើកក្នុង tab ថ្មី
        </a>
      </div>
      <iframe
        title="Data Storage"
        src={VAULT_URL}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
        style={{ flex: 1, width: "100%", border: 0, background: "#05070d" }}
      />
    </div>
  );
}
