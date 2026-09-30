import { useEffect, useState } from "react";
import { createTranslator } from "@khoem-ai/localization";

type Tr = Awaited<ReturnType<typeof createTranslator>>;

export function useKhoem(locale: string) {
  const [tr, setTr] = useState<Tr | null>(null);
  useEffect(() => {
    let cancelled = false;
    createTranslator(locale)
      .catch(() => createTranslator("en"))
      .then((x) => { if (!cancelled) setTr(x); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [locale]);
  return (key: string, params?: Record<string, string | number>) =>
    tr ? tr.t(key, params) : "";
}
