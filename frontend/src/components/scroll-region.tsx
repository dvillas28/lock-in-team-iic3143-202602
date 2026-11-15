import type { HTMLAttributes, Ref } from "react";

type ScrollRegionProps = Readonly<Omit<HTMLAttributes<HTMLElement>, "role" | "tabIndex" | "aria-label"> & {
  /** Accessible name announced when the region receives focus. */
  label: string;
  as?: "div" | "pre";
  ref?: Ref<HTMLElement>;
}>;

/**
 * Container with its own scroll (wide tables, code, PDF pages). It must take keyboard focus so it can be
 * scrolled without a mouse: WCAG 2.1.1 and axe `scrollable-region-focusable`; E2E-A11Y-005 checks it.
 * Every focusable scroll container goes through here, so the Sonar exception below lives in one place.
 */
export function ScrollRegion({ label, as: Tag = "div", ref, children, ...rest }: ScrollRegionProps) {
  return <Tag ref={ref as Ref<HTMLDivElement & HTMLPreElement>} {...rest} role="region" aria-label={label}
    tabIndex={0} // NOSONAR typescript:S6845: a scrollable region has to be focusable to be keyboard-scrollable.
  >{children}</Tag>;
}
