type MenuGlyphName =
  | "status" | "control" | "observability" | "audit" | "settings"
  | "patch" | "code" | "tools" | "api" | "data" | "cidc" | "device"
  | "studio" | "camera" | "shield" | "safety" | "learning"
  | "honorific" | "language" | "clear" | "sun" | "moon"
  | "film" | "home" | "audio" | "emotion" | "palette" | "library" | "video" | "cube" | "close"
  | "headphones" | "play" | "pause" | "stop" | "record" | "loop"
  | "download" | "scissors" | "clock" | "bell" | "mic";

const paths: Record<MenuGlyphName, string> = {
  status: "M3 3v18h18 M7 14l4-4 4 3 6-8",
  control: "M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6",
  observability: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  audit: "M4 19V5 M4 19h17 M8 16v-5 M13 16V7 M18 16V3",
  settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 2.9-.2-.1a1.7 1.7 0 0 0-1.8.1l-.2.1h-3.4l-.1-.2a1.7 1.7 0 0 0-1.5-1l-.2.1-3-1.7.1-.2a1.7 1.7 0 0 0-.1-1.8l-.1-.2v-3.4l.2-.1a1.7 1.7 0 0 0 1-1.5l-.1-.2 1.7-3 .2.1a1.7 1.7 0 0 0 1.8-.1l.2-.1h3.4l.1.2a1.7 1.7 0 0 0 1.5 1l.2-.1 3 1.7-.1.2a1.7 1.7 0 0 0 .1 1.8l.1.2v3.4z",
  patch: "M12 3v5 M12 16v5 M3 12h5 M16 12h5 M5.6 5.6l3.5 3.5 M14.9 14.9l3.5 3.5 M18.4 5.6l-3.5 3.5 M9.1 14.9l-3.5 3.5",
  code: "m8 7-5 5 5 5 M16 7l5 5-5 5 M14 4l-4 16",
  tools: "M14 7l3-3 4 4-3 3 M13 8l3 3-8 8a2 2 0 0 1-3-3z",
  api: "M8 7h8 M8 12h8 M8 17h8 M4 5v14 M20 5v14",
  data: "M4 5h16v14H4z M4 10h16 M10 5v14",
  cidc: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v10 M7 12h10",
  device: "M5 5h14v10H5z M9 19h6 M12 15v4 M8 9l2 2 2-2 2 2 2-2",
  studio: "M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z",
  camera: "M3 7h4l2-3h6l2 3h4v13H3z M12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
  shield: "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z M9 12l2 2 4-4",
  safety: "M12 3l8 4v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V7z M9 12l2 2 4-4",
  learning: "M2 9l10-5 10 5-10 5z M6 11v5c4 3 8 3 12 0v-5 M22 9v7",
  honorific: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M4 21c0-4 3-7 8-7s8 3 8 7",
  language: "M4 5h16 M12 3v2 M7 9c2 4 5 7 10 9 M17 9c-2 4-5 7-10 9 M14 21l4-9 4 9 M15.5 18h5",
  clear: "M4 7h16 M10 11v6 M14 11v6 M6 7l1 14h10l1-14 M9 7V4h6v3",
  sun: "M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.64 5.64l1.42 1.42 M16.94 16.94l1.42 1.42 M18.36 5.64l-1.42 1.42 M7.06 16.94l-1.42 1.42 M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10",
  moon: "M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2z M17 3v3 M15.5 4.5h3",
  home: "M3 11l9-8 9 8 M5 10v10h14V10 M10 20v-6h4v6",
  audio: "M6 3v18 M12 3v18 M18 3v18 M4 9h4 M10 15h4 M16 7h4",
  emotion: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M8 14c1 2 2.5 3 4 3s3-1 4-3 M9 9.5h.01 M15 9.5h.01",
  palette: "M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2.2-.5-1.3.3-2.3 1.7-2.3H17a4 4 0 0 0 4-4c0-5-4-9.5-9-9.5z M7.5 11h.01 M10 7.5h.01 M14.5 7.5h.01",
  library: "M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  video: "M3 6h12v12H3z M15 10l6-3v10l-6-3",
  cube: "M12 3l8 4.5v9L12 21l-8-4.5v-9z M12 12l8-4.5 M12 12v9 M12 12L4 7.5",
  close: "M6 6l12 12 M18 6L6 18",
  film: "M3 9h18v11H3z M3 9l3-5h4l-3 5 M10 9l3-5h4l-3 5 M7 14h10 M7 17h6",
  headphones: "M4 13a8 8 0 0 1 16 0 M4 13h3v6H5a1 1 0 0 1-1-1z M20 13h-3v6h2a1 1 0 0 0 1-1z",
  play: "M7 4l13 8-13 8z",
  pause: "M7 4h3v16H7z M14 4h3v16h-3z",
  stop: "M6 6h12v12H6z",
  record: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  loop: "M17 2l4 4-4 4 M3 11V9a3 3 0 0 1 3-3h15 M7 22l-4-4 4-4 M21 13v2a3 3 0 0 1-3 3H3",
  download: "M12 3v12 M7 10l5 5 5-5 M4 20h16",
  scissors: "M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M8.5 8l11.5 11 M8.5 16L20 5",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2",
  bell: "M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z M10 21h4",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3",
};

export default function MenuGlyph({ name }: { name: MenuGlyphName }) {
  return (
    <svg
      className="app__menu-glyph"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
