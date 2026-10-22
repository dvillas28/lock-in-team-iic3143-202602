"use client";
import { capabilities } from "../../lib/courses/capabilities.ts";
import { CourseForm } from "./course-form.tsx";
import type { CurrentUser } from "../../lib/auth/validation.ts";
import Link from "next/link";
import { useSession } from "../auth/session-provider.tsx";
import { EmptyState, ErrorState, LoadingState } from "../route-states.tsx";
import { listCourses } from "../../lib/api/courses.ts";
import { useResource } from "./use-resource.ts";
import type { Session } from "../../lib/auth/session.ts";
export function CourseDirectory() {
  const { session, state } = useSession();
  const context = state.context;
  if (!context?.user)
    return <LoadingState />;
  return <Directory key={`${state.generation}:${context.slug}`} session={session} slug={context.slug} user={context.user} />;
}
function Directory({ session, slug, user }: {
  session: Session;
  slug: string;
  user: CurrentUser;
}) {
  const result = useResource(session, slug, client => listCourses(client, slug));
  return <div className="stack">
    <div className="page-heading">
      <h1>Mis cursos</h1>
    </div>
    {result.error ? <ErrorState feedback={result.error} onRetry={() => void result.reload()} /> : !result.data ? <LoadingState /> : result.data.length === 0 ? <EmptyState /> :
      <div className="course-grid">{result.data.map(course => <Link className="card card-hover panel stack" key={course.id} href={`/courses/${course.id}`}>
        <span className="text-link">{course.code} · {course.term}</span>
        <h2>{course.name}</h2>
      </Link>)}</div>}
    {result.data && capabilities(user).create && <CourseForm session={session} slug={slug} onSaved={result.reload} />}
  </div>;
}
