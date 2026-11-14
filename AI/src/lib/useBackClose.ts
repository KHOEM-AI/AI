// In-app Back: the phone's Back button (and browser Back) steps back inside the app instead of leaving it.
//  - useBackClose(onClose): one history entry per open panel; Back closes the panel.
//  - useBackStep(fn): a panel can first step back internally (e.g. sub-tab -> main tab); fn returns true if it handled Back.
import { useEffect, useRef } from "react";

interface PanelEntry { id: number; close: () => void; popped: boolean }
const panels: PanelEntry[] = [];
const steps: { fn: () => boolean }[] = [];
let pending: { id: number; timer: ReturnType<typeof setTimeout> } | null = null;
let ignorePop = false;
let installed = false;

function onPop(): void {
  if (ignorePop) { ignorePop = false; return; }
  const top = panels[panels.length - 1];
  if (!top) return;
  const st = steps[steps.length - 1];
  if (st && st.fn()) { history.pushState({ khoemPanel: top.id }, ""); return; }
  top.popped = true;
  top.close();
}

export function useBackClose(onClose: () => void): void {
  const cb = useRef(onClose);
  cb.current = onClose;
  useEffect(() => {
    if (!installed) { window.addEventListener("popstate", onPop); installed = true; }
    let id: number;
    if (pending) { clearTimeout(pending.timer); id = pending.id; pending = null; } // reuse entry (StrictMode / panel switch)
    else { id = Date.now() + Math.random(); history.pushState({ khoemPanel: id }, ""); }
    const entry: PanelEntry = { id, close: () => cb.current(), popped: false };
    panels.push(entry);
    return () => {
      const i = panels.indexOf(entry); if (i >= 0) panels.splice(i, 1);
      if (entry.popped) return;
      const timer = setTimeout(() => {
        pending = null;
        const st = history.state as { khoemPanel?: number } | null;
        if (st && st.khoemPanel === id) { ignorePop = true; history.back(); }
      }, 0);
      pending = { id, timer };
    };
  }, []);
}

export function useBackStep(fn: () => boolean): void {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const e = { fn: () => ref.current() };
    steps.push(e);
    return () => { const i = steps.indexOf(e); if (i >= 0) steps.splice(i, 1); };
  }, []);
}
