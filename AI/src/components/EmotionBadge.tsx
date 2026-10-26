import { useEffect, useState } from "react";
import { iqaiAnalyzeEmotion } from "../api/client";

const ICON: Record<string, string> = {
  joy: "😊",
  sadness: "😢",
  anger: "😠",
  fear: "😨",
  love: "❤️",
  surprise: "😮",
};

const cache = new Map<string, string>();

export default function EmotionBadge({ text }: { text: string }) {
  const [icon, setIcon] = useState<string>(cache.get(text) ?? "");

  useEffect(() => {
    let alive = true;
    if (/[\u1780-\u17FF]/.test(text)) {
      const hit = cache.get(text);
      if (hit !== undefined) {
        setIcon(hit);
      } else {
        iqaiAnalyzeEmotion(text)
          .then((r) => {
            const i = ICON[r.emotion] ?? "";
            cache.set(text, i);
            if (alive) setIcon(i);
          })
          .catch(() => {});
      }
    }
    return () => {
      alive = false;
    };
  }, [text]);

  if (!icon) return null;
  return (
    <span title="Emotion · អារម្មណ៍" style={{ marginLeft: 6, fontSize: 14, opacity: 0.8 }}>
      {icon}
    </span>
  );
}
