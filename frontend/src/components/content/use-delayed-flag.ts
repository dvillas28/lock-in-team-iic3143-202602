"use client";
import { useEffect, useState } from "react";

/** True only once `active` has stayed true for `delay` ms, so near-instant loads never flash a loading state. */
export function useDelayedFlag(active: boolean, delay = 350) {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setElapsed(true), delay);
    return () => { window.clearTimeout(timer); setElapsed(false); };
  }, [active, delay]);
  return active && elapsed;
}
