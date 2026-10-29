import type { ReactNode } from "react";
import type { CurrentUser } from "../../lib/auth/validation.ts";
import type { Course } from "../../lib/courses/validation.ts";
import { CourseNavigation } from "../courses/course-navigation.tsx";

/** Composition only: callers retain their authorized resources and operation state. */
export function QuizWorkspace({ course, user, title, children, authoring = false }: {
  course: Course; user: CurrentUser; title: string; children: ReactNode; authoring?: boolean;
}) {
  return <div className={`stack academic-workspace quiz-workspace${authoring ? " quiz-authoring" : ""}`}>
    <div className="page-heading"><div>
      <p className="section-label">{course.code} · {course.term}</p>
      <h1>{title}</h1><p className="hint">{course.name}</p>
    </div></div>
    <CourseNavigation course={course} user={user} active="/quizzes" />
    {children}
  </div>;
}
