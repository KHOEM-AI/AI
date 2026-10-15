import type { CSSProperties } from "react";

const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  background: "#05080d",
  color: "#f3f4f6",
  overflowY: "auto",
  display: "flex",
  justifyContent: "center",
  padding: "28px 18px",
  boxSizing: "border-box",
};

const card: CSSProperties = {
  maxWidth: 620,
  width: "100%",
  margin: "auto",
  lineHeight: 1.65,
  fontSize: 15,
};

const heading: CSSProperties = {
  color: "#7dd3fc",
  fontSize: 28,
  lineHeight: 1.2,
  marginBottom: 10,
};

const sectionHeading: CSSProperties = {
  color: "#bae6fd",
  fontSize: 17,
  marginTop: 22,
  marginBottom: 6,
};

const button: CSSProperties = {
  marginTop: 24,
  marginBottom: 16,
  padding: "13px 28px",
  borderRadius: 999,
  border: "1px solid #38bdf8",
  background: "#0284c7",
  color: "#ffffff",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
};

export default function GatePoem({ onContinue }: { onContinue: () => void }) {
  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <main style={card}>
        <h1 id="welcome-title" style={heading}>Welcome to KHOEM-AI</h1>
        <p><strong>Your AI assistant. Your judgment. Your responsibility.</strong></p>
        <p>
          Before you continue, please take a moment to understand the responsible
          use of artificial intelligence.
        </p>

        <h2 style={sectionHeading}>1. Use AI Responsibly</h2>
        <p>
          Use this system for lawful, constructive, and appropriate purposes.
          You are responsible for how you use its responses and for the actions
          you take based on them.
        </p>

        <h2 style={sectionHeading}>2. Verify Important Information</h2>
        <p>
          AI can make mistakes, misunderstand context, or provide outdated,
          incomplete, or inaccurate information. Verify important facts using
          reliable sources, especially for medical, legal, financial,
          safety-related, or other high-impact decisions.
        </p>

        <h2 style={sectionHeading}>3. Think Before You Act</h2>
        <p>
          AI is a tool to support your thinking, not a replacement for your
          judgment. Consider the context, evaluate alternatives, and think
          through possible consequences before making decisions.
        </p>

        <h2 style={sectionHeading}>4. Protect Your Privacy</h2>
        <p>
          Avoid sharing passwords, authentication codes, financial credentials,
          or unnecessary sensitive personal information. Be mindful of the
          information you provide to any AI system.
        </p>

        <h2 style={sectionHeading}>5. You Are Accountable</h2>
        <p>
          Do not assume an AI-generated answer is automatically correct or
          appropriate. Review recommendations carefully and take responsibility
          for your decisions and actions.
        </p>

        <h2 style={sectionHeading}>Important Reminder</h2>
        <p>
          Use your own judgment. Question uncertain answers. Verify what matters.
          Think carefully before acting.
        </p>
        <p>
          By continuing, you acknowledge that you understand these responsible-use
          guidelines.
        </p>
        <p>
          <strong>
            AI can assist your decisions, but it should not make important
            decisions for you.
          </strong>
        </p>

        <button type="button" style={button} onClick={onContinue}>
          I Understand — Continue
        </button>
      </main>
    </div>
  );
}
