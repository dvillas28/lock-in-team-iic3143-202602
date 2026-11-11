"use client";
import { useLayoutEffect, useRef } from "react";

export const SKELETON_REVEAL_MS = 200;
const HANDOFF_MS = 100;
type Sequence = { start: number; end?: number };
// Browser-only and per tab: one route transition shows one skeleton at a time.
let sequence: Sequence | undefined;

/**
 * A route `loading.tsx` and the page's own pending branch render the same skeleton in two React
 * trees. When one replaces the other, continue the elapsed time instead of restarting the reveal
 * delay and pulse, so a load that crosses both never blinks.
 *
 * Measured at commit, not render: a transition may render the incoming tree long before mounting
 * it, while the CSS clock starts at mount. Layout effects run before paint, and React runs the
 * outgoing tree's layout cleanup before the incoming tree's effect. Without effects (server
 * render) the styles fall back to the plain 200 ms delay.
 */
export function useSkeletonDelay<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const now = performance.now();
    const handoff = sequence && (sequence.end === undefined || now - sequence.end < HANDOFF_MS);
    const current: Sequence = { start: handoff ? sequence!.start : now };
    sequence = current;
    // Negative once the placeholders were already visible: the pulse keeps its phase.
    ref.current?.style.setProperty("--skeleton-delay", `${Math.round(SKELETON_REVEAL_MS - (now - current.start))}ms`);
    return () => { if (sequence === current) current.end = performance.now(); };
  }, []);
  return ref;
}

/** Test seam: forget the previous skeleton so each case starts a fresh transition. */
export function resetSkeletonDelay() {
  sequence = undefined;
}
