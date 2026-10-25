"use client";
import { capabilities } from "../../lib/courses/capabilities.ts";
import { roleLabel } from "../../lib/courses/role-label.ts";
import Link from "next/link";
import { BookOpen, ClipboardList } from "lucide-react";
import { CourseNavigation } from "./course-navigation.tsx";
import { CourseForm } from "./course-form.tsx";
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
  const { course, items } = result.data;
  const access = capabilities(context.user, course);
  const management = sections && access.sections;
  const participation = [...new Set(context.user.sectionMemberships.filter(m => m.courseId === course.id).map(m => roleLabel(m.role)))];
  return <div className="stack">
    <div className="page-heading">
      <div>
        <p>{course.code} · {course.term}</p>
        <h1>{management ? "Secciones y participantes" : course.name}</h1>
        {management && <p>{course.name}</p>}
      </div>
    </div>
    <CourseNavigation course={course} user={context.user} active={management ? "/sections" : ""} />
    {management ? <>
      <p className="notice">Organiza las secciones del curso y sus participantes. Selecciona una sección para consultar matrículas, asignar participantes y gestionar sus roles dentro de tu alcance.</p>
      {access.configure && <details className="academic-disclosure card"><summary>Configurar curso</summary><CourseForm key={course.id + course.code + course.name + course.term} session={session} slug={slug} course={course} onSaved={result.reload} /></details>}
      <SectionsPanel onSaved={result.reload} key={`${slug}:${course.id}`} session={session} slug={slug} user={context.user} course={course} items={items} management />
    </> : <>
      <section className="card panel stack" aria-labelledby="course-overview-title">
        <div><h2 id="course-overview-title">Resumen del curso</h2><p className="hint">Este es el punto de entrada al curso. Desde aquí puedes acceder al material de estudio y a las evaluaciones.</p></div>
        {participation.length > 0 && <p className="hint">Tu participación: {participation.join(" · ")}</p>}
        <div className="actions"><Link className="btn btn-primary" href={`/courses/${course.id}/modules`}><BookOpen size={16} aria-hidden="true" />Módulos y material</Link><Link className="btn btn-ghost" href={`/courses/${course.id}/quizzes`}><ClipboardList size={16} aria-hidden="true" />Quizzes</Link></div>
        {access.sections && <p className="hint">Para organizar las secciones y sus matrículas, abre <Link href={`/courses/${course.id}/sections`}>Secciones y participantes</Link>.</p>}
      </section>
      {!access.sections && <SectionsPanel onSaved={result.reload} key={`${slug}:${course.id}`} session={session} slug={slug} user={context.user} course={course} items={items} management={false} />}
    </>}
  </div>;
}
