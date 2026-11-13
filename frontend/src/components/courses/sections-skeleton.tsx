"use client";
import { Skeleton, SkeletonRegion } from "../skeletons.tsx";
import type { RecordCell } from "../academic/record-skeleton.tsx";
import { useSkeletonDelay } from "../use-skeleton-delay.ts";
import { CourseSectionSkeleton } from "./course-skeleton.tsx";

/** Static for every role, like Módulos, Quizzes and Tareas: it never waits for data. */
export const sectionsTitle = "Secciones y participantes";
export const participantColumns = ["Persona", "Rol", "Estado", "Acciones"] as const;
/** Name over e-mail, as in the loaded rows; the action column stays a plain line, never a button. */
export const participantCell: RecordCell = (column, row) => column === 0
  ? <><Skeleton width={row % 2 ? "min(100%, 7rem)" : "min(100%, 9rem)"} /><p className="hint"><Skeleton width="min(100%, 11rem)" /></p></>
  : <Skeleton shape={column === 3 ? undefined : "pill"} width={column === 3 ? "4.5rem" : "5rem"} />;
const rows = [0, 1, 2];

/**
 * Secciones before the course and its sections are known. The title is real; course data and the
 * section context are shapes. Controls, actions and other people's sections depend on the role, so
 * none is anticipated.
 */
export function SectionsSkeleton() {
  return <CourseSectionSkeleton title={sectionsTitle} label="Cargando secciones…">
    <div className="section-toolbar">
      <div className="section-field-row">
        <p className="section-name"><Skeleton width="6rem" /></p>
        <Skeleton shape="pill" width="7.5rem" />
      </div>
    </div>
  </CourseSectionSkeleton>;
}

/** A managed section's roster while its detail loads, under the real toolbar. */
export function SectionPending() {
  return <div ref={useSkeletonDelay<HTMLDivElement>()}>
    <SkeletonRegion label="Cargando sección…">
      <div className="stack">
        <p className="skeleton-section-heading"><Skeleton width="8rem" /></p>
        <div className="table-scroll participants-table participants-admin-table"><table className="data-table skeleton-table">
          <caption><Skeleton width="min(20rem, 80%)" /></caption>
          <thead><tr>{participantColumns.map(column => <th key={column}><Skeleton width="4.5rem" /></th>)}</tr></thead>
          <tbody>{rows.map(row => <tr key={row}>{participantColumns.map((column, index) => <td key={column}>{participantCell(index, row)}</td>)}</tr>)}</tbody>
        </table></div>
      </div>
    </SkeletonRegion>
  </div>;
}
