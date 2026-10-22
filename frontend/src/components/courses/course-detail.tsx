"use client";
import { capabilities } from "../../lib/courses/capabilities.ts";
import {gradebookCapabilities} from '../../lib/gradebook/capabilities.ts';
import { CourseForm } from "./course-form.tsx";
import Link from "next/link";
import { useSession } from "../auth/session-provider.tsx";
import { ErrorState, LoadingState } from "../route-states.tsx";
import { getCourse } from "../../lib/api/courses.ts";
import { listSections } from "../../lib/api/sections.ts";
import { useResource } from "./use-resource.ts";
import { SectionsPanel } from "./sections-panel.tsx";
export function CourseDetail({ courseId, sections = false }: {
  courseId: string;
  sections?: boolean;
}) {
  const { session, state } = useSession();
  const context = state.context;
  const slug = context?.slug ?? "";
  const result = useResource(session, `${state.generation}:${slug}:${courseId}`, async (client) => {
    const course = await getCourse(client, slug, courseId);
    const items = await listSections(client, slug, courseId);
    return { course, items };
  });
  if (!context?.user)
    return <LoadingState />;
  if (result.error)
    return <ErrorState feedback={result.error} onRetry={() => void result.reload()} />;
  if (!result.data)
    return <LoadingState />;
  const { course, items } = result.data, academic=gradebookCapabilities(context.user,course);
  return <div className="stack">
    <div className="page-heading">
      <div>
        <p>{course.code} · {course.term}</p>
        <h1>{course.name}</h1>
      </div>
    </div>
    <nav className="actions" aria-label="Curso">
      {academic.student && <Link href={`/courses/${courseId}/grades`}>Mis notas</Link>}
      {academic.book && <Link href={`/courses/${courseId}/gradebook`}>Libro de notas</Link>}
      {academic.audit && <Link href={`/courses/${courseId}/audit`}>Auditoría</Link>}
      <Link href={`/courses/${courseId}/quizzes`}>Quizzes</Link>
      <Link href={`/courses/${courseId}/modules`}>Módulos y material</Link>
      <Link href={`/courses/${courseId}`} aria-current={!sections ? "page" : undefined}>Detalle</Link>
      <Link href={`/courses/${courseId}/sections`} aria-current={sections ? "page" : undefined}>Secciones</Link>
    </nav>
    {capabilities(context.user, course).configure && <CourseForm key={course.id + course.code + course.name + course.term} session={session} slug={slug} course={course} onSaved={result.reload} />}
    <SectionsPanel onSaved={result.reload} key={`${slug}:${course.id}`} session={session} slug={slug} user={context.user} course={course} items={items} management={sections} />
  </div>;
}
