import "./HeartbeatLogo.css";

export type HeartState = "idle" | "thinking" | "done" | "error";

export default function HeartbeatLogo({ state = "idle", width = 150 }: { state?: HeartState; width?: number }) {
  const beat = "M0 20 H30 L36 20 L42 4 L50 36 L57 12 L62 20 H90 L96 20 L102 4 L110 36 L117 12 L122 20 H150";
  const flat = "M0 20 H150";
  const d = state === "done" ? flat : beat;
  return (
    <svg className={`hb hb--${state}`} width={width} height={width / 3.75} viewBox="0 0 150 40" role="img" aria-label={`KHOEM-AI ${state}`}>
      <g className="hb__a">
        <path className="hb__glow" d={d} />
        <path className="hb__wave" d={d} />
      </g>
      <g className="hb__b">
        <path className="hb__glow" d={d} />
        <path className="hb__wave" d={d} />
      </g>
    </svg>
  );
}
