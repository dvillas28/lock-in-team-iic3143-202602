"use client";
import { capabilities } from "../../lib/courses/capabilities.ts";
import { CourseNavigation } from "./course-navigation.tsx";
import { CourseForm } from "./course-form.tsx";
import { useSession } from "../auth/session-provider.tsx";
import { ErrorState } from "../route-states.tsx";
import { getCourse } from "../../lib/api/courses.ts";
import { listSections } from "../../lib/api/sections.ts";
import { useResource } from "./use-resource.ts";
import { SectionsPanel } from "./sections-panel.tsx";
import { SectionsSkeleton } from "./sections-skeleton.tsx";
export function CourseDetail({ courseId }: {
  courseId: string;
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
    return <SectionsSkeleton />;
  if (result.error)
    return <ErrorState feedback={result.error} onRetry={() => void result.reload()} />;
  if (!result.data)
    return <SectionsSkeleton />;
  const { course, items } = result.data;
  const access = capabilities(context.user, course);
  const management = access.sections;
  return <div className="stack">
    <div className="page-heading">
      <div>
        <p>{course.code} · {course.term}</p>
        <h1>{management ? "Secciones y participantes" : course.name}</h1>
        {management && <p>{course.name}</p>}
      </div>
    </div>
    <CourseNavigation course={course} user={context.user} active="/sections" />
    {management ? <>
      <p className="notice">Organiza las secciones del curso y sus participantes. Selecciona una sección para consultar matrículas, asignar participantes y gestionar sus roles dentro de tu alcance.</p>
      {access.configure && <details className="academic-disclosure card"><summary>Configurar curso</summary><CourseForm key={course.id + course.code + course.name + course.term} session={session} slug={slug} course={course} onSaved={result.reload} /></details>}
      <SectionsPanel onSaved={result.reload} key={`${slug}:${course.id}`} session={session} slug={slug} user={context.user} course={course} items={items} management />
    </> : <SectionsPanel onSaved={result.reload} key={`${slug}:${course.id}`} session={session} slug={slug} user={context.user} course={course} items={items} management={false} />}
  </div>;
}
