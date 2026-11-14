"use client";
import { ClipboardList, FileText } from "lucide-react";
import Link from "next/link";
import { dayTitle, eventHref, kindLabel, markLabel, tone, type Mark } from "../../lib/calendar/calendar.ts";

const statusLabel = { draft: "Borrador", hidden: "Oculta", published: null } as const;

export function DayAgenda({ day, today, items, headingLevel = 3, onNavigate, now }: Readonly<{
  day: string;
  today: string;
  items: readonly Mark[];
  headingLevel?: 2 | 3;
  onNavigate?: () => void;
  now: number;
}>) {
  const Heading = `h${headingLevel}` as const;
  return <section className="calendar-agenda" aria-label="Plazos del día seleccionado">
    <Heading className="calendar-agenda-title">{dayTitle(day)}{day === today && <span className="chip chip-primary">Hoy</span>}</Heading>
    {items.length === 0 ? <p className="hint">Sin plazos para este día.</p> : <ul className="calendar-agenda-list">
      {items.map(item => {
        const Icon = item.event.kind === "quiz" ? ClipboardList : FileText;
        const status = statusLabel[item.event.status];
        return <li key={item.key} className="calendar-agenda-item">
          <span className={`calendar-agenda-time tnum tone-${tone(item, now)}`}>{item.time}</span>
          <div className="calendar-agenda-body">
            <Link href={eventHref(item.event)} className="calendar-agenda-link" onClick={onNavigate}>
              <Icon size={14} aria-hidden="true" />{item.event.title}
            </Link>
            <p className="calendar-agenda-meta">
              <span className={`calendar-mark tone-${tone(item, now)}`}><span className="calendar-dot" aria-hidden="true" />{markLabel(item)}</span>
              <span>{kindLabel(item.event)} · {item.event.course.code}</span>
              {status && <span className="chip chip-warning">{status}</span>}
            </p>
          </div>
        </li>;
      })}
    </ul>}
  </section>;
}
