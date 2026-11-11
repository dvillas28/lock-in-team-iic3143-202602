"use client";
import { useId } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CourseSectionSkeleton } from "../courses/course-skeleton.tsx";
import { Skeleton, SkeletonRegion } from "../skeletons.tsx";

export type AssignmentSkeletonKind = "list" | "detail";

/** A label over a field outline, with the real `.field-label` spacing (4 px); never an input. */
const field = (width: string, height = "44px") => <div key={width} className="skeleton-assignment-field">
  <p className="field-label"><Skeleton width={width} /></p>
  <Skeleton shape="block" width="100%" height={height} />
</div>;

/** Search and grouping outlines and one date group on the real `.assignment-toolbar` / `.assignment-row` geometry. */
const list = <div className="stack content-skeleton">
  <div className="assignment-toolbar">
    <div className="skeleton-assignment-search">{field("8rem")}</div>
    <div className="assignment-grouping"><span className="field-label"><Skeleton width="3.5rem" /></span><Skeleton shape="block" width="177px" height="44px" /></div>
  </div>
  <div className="stack assignment-directory">
    <section className="card assignment-group">
      <header><p className="skeleton-assignment-group-title"><Skeleton width="8rem" /></p><Skeleton width="1.5rem" /></header>
      <ul className="assignment-list">{["58%", "44%", "52%"].map(width => <li key={width}>
        <span className="assignment-row">
          <Skeleton shape="block" width="40px" height="40px" />
          <span className="assignment-row-copy"><span className="assignment-row-title"><Skeleton width={width} /></span><span className="hint"><Skeleton width="72%" /></span></span>
          <span className="assignment-row-meta"><span className="assignment-row-points"><Skeleton width="3rem" /></span><Skeleton shape="pill" width="5rem" /></span>
          <span className="assignment-chevron skeleton-assignment-chevron" />
        </span>
      </li>)}</ul>
    </section>
  </div>
</div>;

const facts = (widths: string[]) => widths.map(width => <div key={width}><dt><Skeleton width="6rem" /></dt><dd><Skeleton width={width} /></dd></div>);

/** Conditions and instructions cards of `Detail`; role-dependent actions and submissions come with the data. */
const detail = <div className="stack content-skeleton">
  <div className="card panel stack assignment-detail">
    <div className="assignment-detail-heading">
      <div><p className="hint"><Skeleton width="11rem" /></p><Skeleton shape="pill" width="5.5rem" /></div>
      <p className="assignment-points"><strong><Skeleton width="2.5rem" /></strong></p>
    </div>
    <dl className="assignment-dates">{facts(["80%", "72%", "64%"])}</dl>
    <dl className="form-grid assignment-dates">{facts(["56%", "4rem"])}</dl>
  </div>
  <div className="card panel stack assignment-instructions">
    <p className="skeleton-panel-heading"><Skeleton width="8rem" /></p>
    <div><Skeleton width="90%" /><Skeleton width="68%" /></div>
  </div>
</div>;

/**
 * Course header, tabs and the shape of Tareas while it loads. An assignment title is data, so only
 * «Tareas» is a real heading. The detail keeps the real way back to the list.
 */
export function AssignmentSkeleton({ kind, courseId }: Readonly<{ kind: AssignmentSkeletonKind; courseId: string }>) {
  if (kind === "list") return <CourseSectionSkeleton title="Tareas" label="Cargando tareas…">{list}</CourseSectionSkeleton>;
  return <CourseSectionSkeleton label="Cargando tarea…" lead={<Link className="text-link assignment-back" href={`/courses/${courseId}/assignments`}>
    <ArrowLeft size={16} aria-hidden="true" /> Volver a Tareas
  </Link>}>{detail}</CourseSectionSkeleton>;
}

const routes: [RegExp, AssignmentSkeletonKind][] = [
  [/^\/courses\/([^/]+)\/assignments$/, "list"],
  [/^\/courses\/([^/]+)\/assignments\/[^/]+$/, "detail"],
];

/** Assignment routes under `/courses/:courseId/assignments`, for the route fallback. */
export function assignmentSkeletonRoute(pathname: string): { kind: AssignmentSkeletonKind; courseId: string } | undefined {
  for (const [pattern, kind] of routes) {
    const courseId = pattern.exec(pathname)?.[1];
    if (courseId) return { kind, courseId };
  }
  return undefined;
}

/** `.data-table` with the caption and two-line student cells of the real roster; no checkboxes or buttons. */
const roster = <table className="data-table skeleton-table">
  <caption><Skeleton width="min(20rem, 80%)" /></caption>
  <thead><tr>{["4rem", "6rem", "4.5rem", "3rem"].map(width => <th key={width}><Skeleton width={width} /></th>)}</tr></thead>
  <tbody>{["9rem", "7rem", "8rem"].map(width => <tr key={width}>
    <td><Skeleton shape="block" width="18px" height="18px" /></td>
    <th><span className="skeleton-submission-student"><Skeleton width={width} /><small><Skeleton width="5rem" /></small></span></th>
    <td><Skeleton shape="pill" width="6rem" /></td>
    <td><Skeleton width="4.5rem" /></td>
  </tr>)}</tbody>
</table>;

/** Teacher roster while it loads: the static title stays real; filters and publication come with the data. */
export function TeacherSubmissionsSkeleton() {
  const titleId = useId();
  return <section className="card panel stack assignment-submission teacher-submissions" aria-labelledby={titleId}>
    <header className="submission-heading skeleton-heading">
      <div><h2 id={titleId}>Entregas y calificaciones</h2><p className="hint"><Skeleton width="10rem" /></p></div>
    </header>
    <SkeletonRegion label="Cargando entregas…">
      <div className="table-scroll">{roster}</div>
    </SkeletonRegion>
  </section>;
}

/** Student attempt panel while it loads; the delivery form is one outline, never a field or button. */
export function StudentSubmissionsSkeleton() {
  const titleId = useId();
  return <section className="card panel stack assignment-submission" aria-labelledby={titleId}>
    <header className="submission-heading skeleton-heading">
      <div><h2 id={titleId}>Tu entrega</h2><p className="hint"><Skeleton width="15rem" /></p></div>
      <div className="submission-heading-actions"><Skeleton shape="pill" width="5.5rem" /></div>
    </header>
    <SkeletonRegion label="Cargando tu entrega…">
      <div className="stack assignment-delivery"><Skeleton shape="block" width="100%" height="120px" /></div>
    </SkeletonRegion>
  </section>;
}

/** Review dialog body: the student is already known, so their name stays a real heading. */
export function SubmissionReviewSkeleton({ name, sectionCode }: Readonly<{ name: string; sectionCode: string }>) {
  const titleId = useId();
  return <section className="stack assignment-review" aria-labelledby={titleId}>
    <div><p className="section-label">Revisión · Sección {sectionCode}</p><h3 id={titleId}>{name}</h3></div>
    <SkeletonRegion label={`Cargando la entrega de ${name}…`}>
      <div className="stack">
        {field("8rem")}
        <p className="hint"><Skeleton width="14rem" /></p>
        <Skeleton shape="block" width="100%" height="136px" />
        <div className="stack assignment-grading">
          <p className="skeleton-review-heading"><Skeleton width="9rem" /></p>
          {field("9rem")}
          {field("7rem", "168px")}
        </div>
      </div>
    </SkeletonRegion>
  </section>;
}
