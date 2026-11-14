"use client";
import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { addDays, dayTitle, eventHref, markLabel, monthGrid, monthOf, shiftMonth, tone, weekdays, type Mark } from "../../lib/calendar/calendar.ts";

type MonthGridProps = Readonly<{
  month: string;
  selected: string;
  today: string;
  days: ReadonlyMap<string, Mark[]>;
  onSelect: (day: string) => void;
  variant: "mini" | "full";
  labelledBy: string;
  now: number;
}>;

const moves: Record<string, (day: string) => string> = {
  ArrowLeft: d => addDays(d, -1), ArrowRight: d => addDays(d, 1),
  ArrowUp: d => addDays(d, -7), ArrowDown: d => addDays(d, 7),
  Home: d => addDays(d, -((new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7)),
  End: d => addDays(d, 6 - ((new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7)),
  PageUp: d => clampDay(shiftMonth(monthOf(d), -1), d),
  PageDown: d => clampDay(shiftMonth(monthOf(d), 1), d),
};

function clampDay(month: string, day: string) {
  const last = monthGrid(month).flat().filter(d => monthOf(d) === month).at(-1)!;
  const candidate = `${month}-${day.slice(8)}`;
  return candidate > last ? last : candidate;
}

function dayLabel(day: string, today: string, count: number) {
  const plazos = count === 0 ? "sin plazos" : count === 1 ? "1 plazo" : `${count} plazos`;
  return `${dayTitle(day)}${day === today ? ", hoy" : ""}: ${plazos}`;
}

/** Month grid with a roving tab stop: arrows move by day/week, PageUp/PageDown by month. */
export function MonthGrid({ month, selected, today, days, onSelect, variant, labelledBy, now }: MonthGridProps) {
  const table = useRef<HTMLTableElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    table.current?.querySelector<HTMLButtonElement>(`button[data-day="${selected}"]`)?.focus({ preventScroll: variant === "mini" });
  }, [selected, month, variant]);
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, day: string) {
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    moved.current = true;
    onSelect(move(day));
  }
  return <table ref={table} role="grid" className={`calendar-grid calendar-grid-${variant}`} aria-labelledby={labelledBy}>
    <thead><tr>{weekdays.map(([short, long]) => <th key={long} scope="col"><abbr title={long}>{short}</abbr></th>)}</tr></thead>
    <tbody>{monthGrid(month).map(week => <tr key={week[0]}>{week.map(day => {
      const items = days.get(day) ?? [];
      const outside = monthOf(day) !== month;
      return <td key={day} role="gridcell" aria-selected={day === selected}
        className={`calendar-cell${outside ? " is-outside" : ""}${day === today ? " is-today" : ""}${day === selected ? " is-selected" : ""}`}>
        <button type="button" className="calendar-day" data-day={day} tabIndex={day === selected ? 0 : -1}
          aria-label={dayLabel(day, today, items.length)} aria-current={day === today ? "date" : undefined}
          onClick={() => onSelect(day)} onKeyDown={event => onKeyDown(event, day)}>
          <span className="calendar-day-number tnum">{Number(day.slice(8))}</span>
          {items.length > 0 && <span className="calendar-dots" aria-hidden="true">
            {items.slice(0, 3).map(item => <span key={item.key} className={`calendar-dot tone-${tone(item, now)}`} />)}
          </span>}
        </button>
        {variant === "full" && items.length > 0 && <ul className="calendar-cell-events" aria-hidden="true">
          {items.slice(0, 3).map(item => <li key={item.key}>
            <Link tabIndex={-1} href={eventHref(item.event)} className={`calendar-chip tone-${tone(item, now)}`}
              title={`${item.time} · ${markLabel(item)}: ${item.event.title} (${item.event.course.code})`}>
              <span className="tnum calendar-chip-time">{item.time}</span>{item.event.title}
            </Link>
          </li>)}
          {items.length > 3 && <li className="calendar-more">+{items.length - 3} más</li>}
        </ul>}
      </td>;
    })}</tr>)}</tbody>
  </table>;
}
