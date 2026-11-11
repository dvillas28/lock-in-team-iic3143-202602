"use client";
import type { ReactNode } from "react";
import { CourseSectionSkeleton } from "../courses/course-skeleton.tsx";
import { Skeleton, TableSkeleton } from "../skeletons.tsx";

export type QuizSkeletonKind = "list" | "detail" | "create" | "edit" | "attempts" | "attempt" | "review";

const back = <p className="hint"><Skeleton width="8rem" /></p>;
const card = (widths: string[]) => <div className="card panel stack">
  <p className="skeleton-quiz-heading"><Skeleton width="min(14rem, 60%)" /></p>
  {widths.map(width => <Skeleton key={width} width={width} />)}
</div>;

/** One lifecycle group on the real `.quiz-group` / `.quiz-row-link` geometry. */
const list = <div className="stack quiz-directory content-skeleton">
  <section className="card quiz-group">
    <header><p className="skeleton-quiz-group-title"><Skeleton width="9rem" /></p><Skeleton width="1.5rem" /></header>
    <ul className="quiz-rows">{["62%", "48%", "56%"].map(width => <li key={width} className="quiz-row">
      <span className="quiz-row-link">
        <Skeleton shape="block" width="40px" height="40px" />
        <span className="quiz-row-copy"><span className="quiz-row-title"><Skeleton width={width} /></span><span className="hint"><Skeleton width="70%" /></span></span>
        <Skeleton shape="pill" width="5rem" />
      </span>
    </li>)}</ul>
  </section>
</div>;

/** Labels and field outlines only: never inputs, so nothing can be focused or typed into. */
const form = <div className="card panel stack content-skeleton">
  {["6rem", "8rem", "7rem"].map(width => <div key={width} className="stack skeleton-field">
    <p className="field-label"><Skeleton width={width} /></p>
    <Skeleton shape="block" width="100%" height="40px" />
  </div>)}
</div>;

const views: Record<QuizSkeletonKind, { title?: string; label: string; body: ReactNode }> = {
  list: { title: "Quizzes", label: "Cargando quizzes…", body: list },
  detail: { label: "Cargando quiz…", body: <>{back}{card(["90%", "72%", "80%"])}</> },
  create: { title: "Crear quiz", label: "Cargando formulario del quiz…", body: <>{back}{form}</> },
  edit: { label: "Cargando quiz…", body: <>{back}{form}</> },
  attempts: { label: "Cargando intentos…", body: <>{back}<div className="card"><TableSkeleton columns={4} rows={4} /></div></> },
  attempt: { label: "Cargando intento…", body: <>{back}{card(["40%"])}{card(["90%", "64%"])}</> },
  review: { label: "Cargando revisión del intento…", body: <>{back}{card(["40%"])}{card(["90%", "64%"])}</> },
};

/**
 * Course header, tabs and the shape of a quiz view while it loads. A quiz or attempt title is
 * data, so only static titles (Quizzes, Crear quiz) are real; role-dependent toolbars, actions
 * and filters appear with the data.
 */
export function QuizSkeleton({ kind }: Readonly<{ kind: QuizSkeletonKind }>) {
  const view = views[kind];
  return <CourseSectionSkeleton title={view.title} label={view.label}>{view.body}</CourseSectionSkeleton>;
}

const quiz = "/courses/[^/]+/quizzes";
// "new" precedes the quiz id pattern.
const routes: [RegExp, QuizSkeletonKind][] = [
  [new RegExp(`^${quiz}$`), "list"],
  [new RegExp(`^${quiz}/new$`), "create"],
  [new RegExp(`^${quiz}/[^/]+$`), "detail"],
  [new RegExp(`^${quiz}/[^/]+/authoring$`), "edit"],
  [new RegExp(`^${quiz}/[^/]+/attempts$`), "attempts"],
  [new RegExp(`^${quiz}/[^/]+/attempts/[^/]+$`), "review"],
];

/** Quiz routes under `/courses/:courseId/quizzes`, for the route fallback. */
export function quizSkeletonKind(pathname: string): QuizSkeletonKind | undefined {
  return routes.find(([pattern]) => pattern.test(pathname))?.[1];
}
