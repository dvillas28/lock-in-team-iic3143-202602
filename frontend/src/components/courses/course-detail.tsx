"use client";
import { capabilities } from "../../lib/courses/capabilities.ts";
import { CourseNavigation } from "./course-navigation.tsx";
import { useSession } from "../auth/session-provider.tsx";
import { ErrorState } from "../route-states.tsx";
import { getCourse } from "../../lib/api/courses.ts";
import { listSections } from "../../lib/api/sections.ts";
import { useResource } from "./use-resource.ts";
import { SectionsPanel } from "./sections-panel.tsx";
import { ContentNotices } from "../content/content-notices.tsx";
import { SectionsSkeleton, sectionsTitle } from "./sections-skeleton.tsx";

/** Same header as Módulos, Quizzes and Tareas: the title is static, only course data loads. */
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
  // Same toasts as Módulos, Quizzes and Tareas: bottom-right, five seconds, announced.
  return <ContentNotices key={`${state.generation}:${slug}:${courseId}`}><div className="stack academic-workspace sections-workspace">
    <div className="page-heading">
      <div>
        <p className="section-label">{course.code} · {course.term}</p>
        <h1>{sectionsTitle}</h1>
        <p className="hint">{course.name}</p>
      </div>
    </div>
    <CourseNavigation course={course} user={context.user} active="/sections" />
    <SectionsPanel onSaved={result.reload} key={`${slug}:${course.id}`} session={session} slug={slug} user={context.user} course={course} items={items} management={management} />
  </div></ContentNotices>;
}
