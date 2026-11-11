"use client";
import { Skeleton, SkeletonRegion, TableSkeleton } from "../skeletons.tsx";
import { useSkeletonDelay } from "../use-skeleton-delay.ts";
import type { RecordCell } from "../academic/record-skeleton.tsx";

const grade = <><span className="skeleton-grade"><Skeleton width="2.5rem" /></span><small className="grade-state"><Skeleton width="4.5rem" /></small></>;
const detail = (width: string) => <><Skeleton width={width} /><small className="hint"><Skeleton width="5rem" /></small></>;

/**
 * Cells of the book rows in the order of the known header: student, historical section, one grade
 * per item, group subtotals, partial average and published weight.
 */
export function bookRowCell(items: number, groups: number): RecordCell {
  return function bookCell(column, row) {
    if (column === 0) return detail(row % 2 ? "7rem" : "9rem");
    if (column === 1) return <Skeleton width="2.5rem" />;
    if (column < 2 + items) return grade;
    if (column < 2 + items + groups) return detail("3rem");
    return column === 2 + items + groups ? <span className="skeleton-grade"><Skeleton width="2.5rem" /></span> : <Skeleton width="3rem" />;
  };
}

/** «N registros en esta página · …»: one line, two where the real sentence wraps. */
export const bookSummarySkeleton = <p className="hint"><Skeleton width="min(26rem, 80%)" /><span className="skeleton-wrap-line"><Skeleton width="40%" /></span></p>;

/** Neutral book: two grade columns stand for the unknown items; rows keep the real two-line cells. */
const neutralCell = bookRowCell(2, 0);
const neutralColumns = [0, 1, 2, 3, 4, 5];
const neutralBook = <table className="data-table skeleton-table">
  <caption><Skeleton width="min(20rem, 80%)" /></caption>
  <thead><tr>{neutralColumns.map(column => <th key={column}>{detail(column ? "4.5rem" : "6rem")}</th>)}</tr></thead>
  <tbody>{[0, 1, 2, 3, 4].map(row => <tr key={row}>{neutralColumns.map(column => <td key={column}>{neutralCell(column, row)}</td>)}</tr>)}</tbody>
</table>;

/**
 * Libro de notas before its sections and grade items are known: the toolbar keeps only the
 * section filter's outline (weights and publication depend on the role and arrive with the data)
 * and the table is neutral, because its columns are not known yet.
 */
export const gradebookSkeleton = <div className="stack">
  <div className="gradebook-toolbar card panel">
    <div className="skeleton-record-field"><p className="field-label"><Skeleton width="7.5rem" /></p><Skeleton shape="block" width="100%" height="43px" /></div>
  </div>
  {bookSummarySkeleton}
  <div className="table-scroll gradebook-table">{neutralBook}</div>
</div>;

/** Mis notas: summary card and table shapes; no average, weight or calculation mode is anticipated. */
export const gradesSkeleton = <div className="stack">
  <div className="card panel grade-summary">
    <div><p className="skeleton-record-title"><Skeleton width="10rem" /></p><p className="metric"><Skeleton width="4.5rem" /></p></div>
    <div>
      <p className="section-label"><Skeleton width="11rem" /></p>
      <p className="grade-weight"><Skeleton width="3.5rem" /></p>
      <p className="hint"><Skeleton width="85%" /></p>
    </div>
  </div>
  <div className="table-scroll"><TableSkeleton columns={5} rows={4} caption /></div>
</div>;

/** Pending branches under the real course header; they continue the delay of the course skeleton. */
export function GradebookPending() {
  return <div ref={useSkeletonDelay<HTMLDivElement>()}><SkeletonRegion label="Cargando libro de notas…">{gradebookSkeleton}</SkeletonRegion></div>;
}
export function GradesPending() {
  return <div ref={useSkeletonDelay<HTMLDivElement>()}><SkeletonRegion label="Cargando tus notas…">{gradesSkeleton}</SkeletonRegion></div>;
}

