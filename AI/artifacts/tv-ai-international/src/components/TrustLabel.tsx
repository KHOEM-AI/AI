import React from "react";

/**
 * KHOEM_AI TV — Channel Trust Label
 * -----------------------------------------------
 * Trust status types:
 *  - OFFICIAL   : Verified official broadcast/live source
 *  - VERIFIED   : Checked and trusted source (not official broadcaster)
 *  - TEST       : Test/demo stream, not an official broadcast
 *
 * Usage:
 *  <TrustLabel status="OFFICIAL" source="YouTube" />
 *  <TrustLabel status="TEST" source="YouTube" note="Not official live source" />
 */

export type TrustStatus = "OFFICIAL" | "VERIFIED" | "TEST";

export interface TrustLabelProps {
  status: TrustStatus;
  source?: string; // e.g. "YouTube", "Official Website"
  note?: string; // e.g. "Not always live", "Mission-based"
  size?: "sm" | "md"; // sm = for cards, md = for live screen overlay
}

const STATUS_CONFIG: Record<
  TrustStatus,
  { label: string; bg: string; text: string; icon: string }
> = {
  OFFICIAL: {
    label: "OFFICIAL",
    bg: "bg-emerald-600",
    text: "text-white",
    icon: "✓",
  },
  VERIFIED: {
    label: "VERIFIED",
    bg: "bg-blue-600",
    text: "text-white",
    icon: "✓",
  },
  TEST: {
    label: "TEST / DEMO",
    bg: "bg-amber-500",
    text: "text-black",
    icon: "⚠",
  },
};

export const TrustLabel: React.FC<TrustLabelProps> = ({
  status,
  source,
  note,
  size = "sm",
}) => {
  const cfg = STATUS_CONFIG[status];
  const paddingClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <div className="inline-flex flex-col gap-0.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full font-semibold ${cfg.bg} ${cfg.text} ${paddingClass}`}
        title={note || cfg.label}
      >
        <span>{cfg.icon}</span>
        <span>{cfg.label}</span>
      </span>
      {(source || note) && size === "md" && (
        <span className="text-[11px] text-gray-300">
          {source ? `Source: ${source}` : ""}
          {source && note ? " · " : ""}
          {note || ""}
        </span>
      )}
    </div>
  );
};

/**
 * Example: how to attach this to a Channel object.
 * Add these fields to your Channel type / data model:
 *
 * interface Channel {
 *   id: string;
 *   name: string;
 *   trustStatus: TrustStatus;
 *   trustSource?: string;
 *   trustNote?: string;
 *   ...
 * }
 *
 * Then render on the Channel Card:
 *   <TrustLabel status={channel.trustStatus} source={channel.trustSource} size="sm" />
 *
 * And on the Live Screen overlay:
 *   <TrustLabel status={channel.trustStatus} source={channel.trustSource} note={channel.trustNote} size="md" />
 */

export default TrustLabel;
            
