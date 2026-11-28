// SVG icons for the sidebar menu (replaces emoji).
const ICONS = {
  status: "M4 20V11M10 20V4M16 20v-7M22 20H2",
  control: "M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0M16 4v4M8 10v4M18 16v4",
  observe: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  audit: "M3 3v18h18M7 15l4-5 3 3 6-7",
  manage: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2",
  patch: "M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4ZM17 14v6M14 17h6",
  code: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16",
  tools: "M3 8h18v12H3ZM8 8V5h8v3M3 13h18M12 11v4",
  api: "M9 3v5M15 3v5M6 8h12v4a6 6 0 0 1-12 0ZM12 18v3",
  data: "M4 6c0-4 16-4 16 0s-16 4-16 0v12c0 4 16 4 16 0V6M4 12c0 4 16 4 16 0",
  device: "M5 15h14v6H5ZM12 15V8M12 3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5",
  studio: "M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2Z",
  camera: "M3 7h4l2-3h6l2 3h4v13H3ZM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7",
  location: "M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12ZM12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
  protect: "M12 2l8 3v6c0 5-3 9-8 11-5-2-8-6-8-11V5ZM8 12l3 3 5-6",
  safety: "M12 2l8 3v6c0 5-3 9-8 11-5-2-8-6-8-11V5Z",
  vault: "M3 6h7l2 2h9v12H3Z",
  learn: "M2 9l10-5 10 5-10 5ZM6 11v5c3 3 9 3 12 0v-5",
  person: "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 21c1-8 15-8 16 0",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2c4 5 4 15 0 20M12 2c-4 5-4 15 0 20",
  clear: "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14",
};

export default function MenuIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#38bdf8" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ verticalAlign: "-4px", marginRight: 8, flexShrink: 0 }}>
      <path d={ICONS[name]} />
    </svg>
  );
}
