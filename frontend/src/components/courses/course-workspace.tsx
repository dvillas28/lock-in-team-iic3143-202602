"use client";
import type { ReactNode } from "react";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "./use-resource.ts";
import { getCourse } from "../../lib/api/courses.ts";
import type { Course } from "../../lib/courses/validation.ts";
import { CourseNavigation } from "./course-navigation.tsx";
import { ErrorState, LoadingState } from "../route-states.tsx";

/** Course identity/navigation outlive loading, filters and errors of a child resource. */
export function CourseWorkspace({
  courseId,
  title,
  active,
  children,
}: Readonly<{
  courseId: string;
  title: string;
  active: string;
  children: (course: Course) => ReactNode;
}>) {
  const { session, state } = useSession(),
    user = state.context?.user,
    slug = state.context?.slug ?? "";
  const scope = `${state.generation}:${slug}:${JSON.stringify(user)}:${courseId}`;
  const course = useResource(session, scope, (c) =>
    getCourse(c, slug, courseId),
  );
  if (!user) return <LoadingState />;
  if (course.error)
    return (
      <ErrorState
        feedback={course.error}
        onRetry={() => void course.reload()}
      />
    );
  if (!course.data) return <LoadingState />;
  return (
    <div className="stack academic-workspace" key={scope}>
      <div className="page-heading">
        <div>
          <p className="section-label">
            {course.data.code} · {course.data.term}
          </p>
          <h1>{title}</h1>
          <p className="hint">{course.data.name}</p>
        </div>
      </div>
      <CourseNavigation course={course.data} user={user} active={active} />
      {children(course.data)}
    </div>
  );
}
