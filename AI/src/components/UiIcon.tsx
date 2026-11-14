// KHOEM-AI own icon set (hand-drawn SVG paths, no third-party artwork). Usage: <Ico n="save" />
const P = {
  story: "M3 9h18v11H3z M3 9l3-4h4l-3 4 M10 9l3-4h4l-3 4 M10 13.5l5 2.5-5 2.5z",
  finish: "M5 21V4 M5 4h12l-2.5 4L17 12H5",
  auto: "M4 20L15 9 M13 7l4 4 M18 3v3 M16.5 4.5h3 M20 12v2 M19 13h2 M7 4v2 M6 5h2",
  photo: "M3 5h18v14H3z M3 16l5-5 4 4 3-3 6 6 M15.5 9.5h.01",
  pen: "M4 20l4-1 11-11-3-3L5 16z M14 6l3 3",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3 10h18",
  save: "M5 3h11l4 4v14H5z M8 3v6h7V3 M8 21v-7h8v7",
  library: "M4 4h4v16H4z M10 4h4v16h-4z M16 6l4-1 2.5 14-4 1z",
  voice: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M6 11a6 6 0 0 0 12 0 M12 17v4 M9 21h6",
  soundOn: "M4 9v6h4l5 4V5L8 9z M16 9a4 4 0 0 1 0 6 M18.5 6.5a8 8 0 0 1 0 11",
  mute: "M4 9v6h4l5 4V5L8 9z M17 9l5 6 M22 9l-5 6",
  share: "M12 3v12 M8 7l4-4 4 4 M5 12v8h14v-8",
  trash: "M4 7h16 M9 7V4h6v3 M6 7l1 14h10l1-14 M10 11v6 M14 11v6",
  download: "M12 3v12 M7 10l5 5 5-5 M4 20h16",
  slideshow: "M3 5h18v11H3z M9 20h6 M12 16v4 M10 8.5l4 2-4 2z",
  scissors: "M6 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5 M6 15a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5 M8 8l12 11 M8 16L20 5",
  plus: "M12 5v14 M5 12h14",
  up: "M12 19V5 M6 11l6-6 6 6",
  down: "M12 5v14 M6 13l6 6 6-6",
  close: "M6 6l12 12 M18 6L6 18",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7 M20 4v7h-7",
  warn: "M12 3l10 18H2z M12 10v5 M12 18h.01",
  check: "M5 12l5 5 9-10",
  frame: "M4 4h16v16H4z M4 9h16 M9 9v11",
  wave: "M3 12h2l3-6 4 12 3-9 2 3h4",
  music: "M9 18V5l10-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M19 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  info: "M6 3h9l4 4v14H6z M14 3v5h5 M9 13h7 M9 17h7",
  merge: "M4 4h7v7H4z M13 13h7v7h-7z M11 7.5h3a2 2 0 0 1 2 2V13",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  cloud: "M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1 0 9z M12 12v5 M9.5 14.5l2.5-2.5 2.5 2.5",
  car: "M3 15l1.5-5A2 2 0 0 1 6.4 8.5h11.2a2 2 0 0 1 1.9 1.5L21 15 M3 15h18v3H3z M7 18v2 M17 18v2 M7.5 12.2h.01 M16.5 12.2h.01",
  person: "M12 3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7 M5 21v-3a7 7 0 0 1 14 0v3",
  dice: "M4 4h16v16H4z M8.5 8.5h.01 M15.5 8.5h.01 M12 12h.01 M8.5 15.5h.01 M15.5 15.5h.01",
  wheel: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 3v3 M12 18v3 M3 12h3 M18 12h3",
} as const;

export type IconName = keyof typeof P;

export default function Ico({ n, only = false, size = "1.15em" }: { n: IconName; only?: boolean; size?: string }) {
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ verticalAlign: "-0.2em", marginRight: only ? 0 : "0.35em", flex: "none" }}
    >
      <path d={P[n]} />
    </svg>
  );
}
