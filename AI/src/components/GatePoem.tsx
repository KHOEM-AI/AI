import type { CSSProperties } from "react";

interface Line {
  text: string;
  bold?: boolean;
}

const POEM: Line[] = [
  { text: "😂😂 Alas, the path has collapsed; I weep in sorrow", bold: true },
  { text: "" },
  { text: "Rain clouds obscure the view, flooding the open fields;", bold: true },
  { text: "A city dweller’s lament echoes across the countryside—far from father and mother.", bold: true },
  { text: "" },
  { text: "Love and code—if the code is flawed, it needs adjustment;", bold: true },
  { text: "Pouring water into a glass, gazing up at the sky—", bold: true },
  { text: "Just one wrong word, or a symbol out of place...", bold: true },
  { text: "" },
  { text: "You led me to fall into the abyss—\"almost met my end (RIP)\" 📢🤖🧠", bold: true },
  { text: "" },
  { text: "This poem expresses gratitude to all the AI systems that have supported my success 😂😂😂", bold: true },
  { text: "" },
  { text: "Clarification: RIP does not refer to a human being.", bold: true },
  { text: "RIP ==> Text/Content", bold: true },
  { text: "" },
  { text: "AI—what does AI originate from?", bold: true },
  { text: "" },
  { text: "Very few people truly know what AI systems are built from;", bold: true },
  { text: "Only the AI that learns—", bold: true },
  { text: "& AI ==> understands the text perfectly.", bold: true },
];

const NOTICE: string[] = [
  "Do not let an AI system make decisions about your work.",
  "AI can make mistakes. Use it responsibly.",
];

const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "#000",
  color: "#fff",
  overflowY: "auto",
  display: "flex",
  justifyContent: "center",
  padding: "32px 20px",
};

const card: CSSProperties = { maxWidth: 560, width: "100%" };

const button: CSSProperties = {
  marginTop: 28,
  padding: "12px 28px",
  borderRadius: 999,
  border: "1px solid #38bdf8",
  background: "transparent",
  color: "#38bdf8",
  fontSize: 16,
  cursor: "pointer",
};

export default function GatePoem({ onContinue }: { onContinue: () => void }) {
  return (
    <div style={overlay} role="dialog" aria-label="Poem">
      <div style={card}>
        {POEM.map((l, i) =>
          l.text === "" ? (
            <div key={i} style={{ height: 14 }} />
          ) : (
            <p key={i} style={{ margin: "4px 0", lineHeight: 1.5, fontWeight: l.bold ? 700 : 400 }}>
              {l.text}
            </p>
          ),
        )}
        <div style={{ height: 24 }} />
        {NOTICE.map((t) => (
          <p key={t} style={{ margin: "4px 0", lineHeight: 1.5, opacity: 0.85 }}>
            {t}
          </p>
        ))}
        <button style={button} onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
