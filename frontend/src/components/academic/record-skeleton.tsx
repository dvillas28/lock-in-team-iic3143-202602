"use client";
import type { ReactNode } from "react";
import { Skeleton } from "../skeletons.tsx";
import { useSkeletonDelay } from "../use-skeleton-delay.ts";

/** Draws one placeholder cell in the element the real cell uses (a second line, a grade). */
export type RecordCell = (column: number, row: number) => ReactNode;
const line: RecordCell = (column, row) => <Skeleton width={(row + column) % 3 ? "72%" : "48%"} />;

type Head = { headers: readonly string[] } | { head: ReactNode; columns: number };

/**
 * Rows of a record table whose caption and columns are already known. Caption and header stay real
 * and announced, so paging, filters and section changes never move them; only the body is
 * placeholder, hidden from assistive technology and revealed with the shared delay. One status
 * names the load. Nothing here is interactive: the scroll container gets no `tabindex`.
 */
export function RecordRowsSkeleton({ label, caption, rows = 5, cell = line, scroll = "table-scroll", table, lead, ...head }: Readonly<{
  label: string;
  caption: string;
  rows?: number;
  cell?: RecordCell;
  /** Classes of the real scroll container (`table-scroll gradebook-table`, `account-table-wrap`). */
  scroll?: string;
  /** Extra classes of the real table (`audit-table`). */
  table?: string;
  /** Placeholder line above the table, where the real view shows a summary. */
  lead?: ReactNode;
} & Head>) {
  const columns = "headers" in head ? head.headers.length : head.columns;
  const cells = Array.from({ length: columns }, (_, index) => index);
  return <div className={lead ? "stack skeleton-rows" : "skeleton-rows"} ref={useSkeletonDelay<HTMLDivElement>()}>
    <p role="status" className="sr-only">{label}</p>
    {lead}
    <div className={scroll}>
      <table className={table ? `data-table ${table}` : "data-table"}>
        <caption>{caption}</caption>
        <thead>{"headers" in head ? <tr>{head.headers.map(text => <th scope="col" key={text}>{text}</th>)}</tr> : head.head}</thead>
        <tbody aria-hidden="true">{Array.from({ length: rows }, (_, row) => <tr key={row}>{cells.map(column =>
          <td key={column}>{cell(column, row)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </div>;
}
