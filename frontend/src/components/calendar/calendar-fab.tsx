"use client";
import { CalendarDays, Maximize2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { listCalendar } from "../../lib/api/calendar.ts";
import type { Session } from "../../lib/auth/session.ts";
import { marks, upcomingDeadlines } from "../../lib/calendar/calendar.ts";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { Skeleton, SkeletonRegion } from "../skeletons.tsx";
import { DayAgenda } from "./day-agenda.tsx";
import { MonthGrid } from "./month-grid.tsx";
import { MonthNav } from "./month-nav.tsx";
import { useCalendar } from "./use-calendar.ts";

const week = 7 * 86400000;

function useUpcomingCount(session: Session, slug: string) {
  const [range] = useState(() => {
    const now = Date.now();
    return { now, from: new Date(now).toISOString(), to: new Date(now + week).toISOString() };
  });
  const result = useResource(session, `${slug}:calendar:upcoming`, client => listCalendar(client, slug, range.from, range.to));
  return result.data ? upcomingDeadlines(marks(result.data), range.now).length : 0;
}

function CalendarPopover({ session, slug, onClose }: Readonly<{ session: Session; slug: string; onClose: (restoreFocus: boolean) => void }>) {
  const calendar = useCalendar(session, slug);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => panel.current?.querySelector<HTMLButtonElement>(".calendar-day[tabindex='0']")?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, []);
  const { result } = calendar;
  return <section ref={panel} id="calendar-popover" className="calendar-popover card" role="dialog" aria-modal="false" aria-labelledby="calendar-popover-month">
    <div className="calendar-popover-head">
      <p className="section-label">Mis plazos</p>
      <div className="calendar-popover-tools">
        <Link href="/calendar" className="icon-btn" aria-label="Expandir a calendario completo" onClick={() => onClose(false)}><Maximize2 size={16} aria-hidden="true" /></Link>
        <button type="button" className="icon-btn" aria-label="Cerrar calendario" onClick={() => onClose(true)}><X size={16} aria-hidden="true" /></button>
      </div>
    </div>
    <MonthNav id="calendar-popover-month" month={calendar.month} today={calendar.today} onMonth={calendar.showMonth} onToday={calendar.goToday} headingLevel={2} />
    <MonthGrid variant="mini" labelledBy="calendar-popover-month" month={calendar.month} selected={calendar.selected} today={calendar.today} days={calendar.days} onSelect={calendar.select} now={calendar.now} />
    {result.error ? <div className="calendar-error" role="alert"><p>No pudimos cargar tus plazos.</p><button type="button" className="btn btn-ghost" onClick={() => void result.reload()}>Reintentar</button></div>
      : !result.data ? <SkeletonRegion label="Cargando plazos…"><Skeleton width="60%" /><Skeleton /><Skeleton width="80%" /></SkeletonRegion>
      : <DayAgenda day={calendar.selected} today={calendar.today} items={calendar.days.get(calendar.selected) ?? []} onNavigate={() => onClose(false)} now={calendar.now} />}
  </section>;
}

/** Floating entry point to the cross-course deadline calendar. */
export function CalendarFab({ slug }: Readonly<{ slug: string }>) {
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const count = useUpcomingCount(session, slug);
  function close(restoreFocus: boolean) {
    setOpen(false);
    if (restoreFocus) button.current?.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      setOpen(false);
      button.current?.focus({ preventScroll: true });
    }
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [open]);
  const summary = count === 0 ? "" : count === 1 ? ", 1 plazo en los próximos 7 días" : `, ${count} plazos en los próximos 7 días`;
  return <div ref={root} className="calendar-fab-root">
    {open && <CalendarPopover session={session} slug={slug} onClose={close} />}
    <button ref={button} type="button" className="calendar-fab" aria-label={`${open ? "Cerrar" : "Abrir"} calendario${summary}`}
      aria-expanded={open} aria-controls={open ? "calendar-popover" : undefined} aria-haspopup="dialog" onClick={() => open ? close(false) : setOpen(true)}>
      {open ? <X size={22} aria-hidden="true" /> : <CalendarDays size={22} aria-hidden="true" />}
      {!open && count > 0 && <span className="calendar-fab-badge tnum" aria-hidden="true">{count > 9 ? "9+" : count}</span>}
    </button>
  </div>;
}
