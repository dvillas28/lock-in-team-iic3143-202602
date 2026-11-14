"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthOf, monthTitle, shiftMonth } from "../../lib/calendar/calendar.ts";

export function MonthNav({ id, month, today, onMonth, onToday, headingLevel = 2 }: Readonly<{
  id: string;
  month: string;
  today: string;
  onMonth: (month: string) => void;
  onToday: () => void;
  headingLevel?: 1 | 2 | 3;
}>) {
  const Heading = `h${headingLevel}` as const;
  return <div className="calendar-month-nav">
    <Heading id={id} className="calendar-month-title" aria-live="polite">{monthTitle(month)}</Heading>
    <div className="calendar-month-actions">
      <button type="button" className="btn btn-ghost calendar-today" onClick={onToday} disabled={month === monthOf(today)}>Hoy</button>
      <button type="button" className="icon-btn" aria-label={`Mes anterior, ${monthTitle(shiftMonth(month, -1))}`} onClick={() => onMonth(shiftMonth(month, -1))}><ChevronLeft size={16} aria-hidden="true" /></button>
      <button type="button" className="icon-btn" aria-label={`Mes siguiente, ${monthTitle(shiftMonth(month, 1))}`} onClick={() => onMonth(shiftMonth(month, 1))}><ChevronRight size={16} aria-hidden="true" /></button>
    </div>
  </div>;
}
