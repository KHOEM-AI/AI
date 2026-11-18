// Small SVG icons for KEI screens. Colour follows the button text (currentColor).
const base = {
  width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
  style: { verticalAlign: "-3px", marginInlineEnd: 6 },
};

export function BackIcon() {
  return (
    <svg {...base}>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </svg>
  );
}

export function RefreshIcon() {
  return (
    <svg {...base}>
      <path d="M20 11a8 8 0 0 0-14.9-3" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.9 3" />
      <path d="M20 20v-4h-4" />
    </svg>
  );
}
