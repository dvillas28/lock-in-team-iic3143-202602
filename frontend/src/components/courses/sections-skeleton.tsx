"use client";
import { Skeleton, SkeletonRegion } from "../skeletons.tsx";
import type { RecordCell } from "../academic/record-skeleton.tsx";
import { useSkeletonDelay } from "../use-skeleton-delay.ts";
import { CourseSectionSkeleton } from "./course-skeleton.tsx";

export const participantColumns = ["Persona", "Rol", "Estado", "Acciones"] as const;
/** Name over e-mail, as in the loaded rows; the action column stays a plain line, never a button. */
export const participantCell: RecordCell = (column, row) => column === 0
  ? <><Skeleton width={row % 2 ? "7rem" : "9rem"} /><p className="hint"><Skeleton width="11rem" /></p></>
  : <Skeleton width={column === 3 ? "4.5rem" : "5rem"} />;
const rows = [0, 1, 2];

/**
 * Secciones before the course and its sections are known. The title, the section picker and the
 * configuration depend on the role, so the page draws one neutral card with two `.section-list`
 * rows: it reveals neither management controls nor the sections of other people.
 */
export function SectionsSkeleton() {
  return <CourseSectionSkeleton label="Cargando secciones…">
    <div className="stack section-overview">
      <p className="skeleton-section-heading"><Skeleton width="9rem" /></p>
      <ul className="stack section-list card">{["6rem", "7.5rem"].map(width =>
        <li key={width}><div><Skeleton width={width} /><p className="hint"><Skeleton width="5rem" /></p></div></li>)}
      </ul>
    </div>
  </CourseSectionSkeleton>;
}

/**
 * A managed section while its detail loads, under the real picker: capacity, the participants
 * heading and the roster table as shapes. Configuration and assignment arrive with the data.
 */
export function SectionPending() {
  return <div ref={useSkeletonDelay<HTMLDivElement>()}>
    <SkeletonRegion label="Cargando sección…">
      <div className="stack section-workspace">
        <div className="section-workspace-meta"><p className="hint"><Skeleton width="7rem" /></p></div>
        <div className="stack">
          <p className="skeleton-section-heading"><Skeleton width="min(22rem, 80%)" /></p>
          <div className="table-scroll participants-table"><table className="data-table skeleton-table">
            <caption><Skeleton width="min(20rem, 80%)" /></caption>
            <thead><tr>{participantColumns.map(column => <th key={column}><Skeleton width="4.5rem" /></th>)}</tr></thead>
            <tbody>{rows.map(row => <tr key={row}>{participantColumns.map((column, index) => <td key={column}>{participantCell(index, row)}</td>)}</tr>)}</tbody>
          </table></div>
        </div>
      </div>
    </SkeletonRegion>
  </div>;
}
