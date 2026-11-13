"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LoadingState } from "../route-states.tsx";
import { CourseDirectorySkeleton } from "./course-directory.tsx";
import { CourseSectionSkeleton } from "./course-skeleton.tsx";
import { ModulesSkeleton } from "../content/modules-skeleton.tsx";
import { QuizSkeleton, quizSkeletonKind } from "../quizzes/quiz-skeleton.tsx";
import { AssignmentSkeleton, assignmentSkeletonRoute } from "../assignments/assignment-skeleton.tsx";
import { gradebookSkeleton, gradesSkeleton } from "../gradebook/gradebook-skeleton.tsx";
import { SectionsSkeleton } from "./sections-skeleton.tsx";

/** Section titles that each page renders before its data; kept equal by `course-loading.test.ts`. */
export const courseSectionTitles: Readonly<Record<string, string>> = {
  modules: "Módulos y material",
  quizzes: "Quizzes",
  assignments: "Tareas",
  grades: "Mis notas",
  gradebook: "Libro de notas",
  audit: "Auditoría del curso",
};

/**
 * Route fallback for `/courses` and course sections. It renders the same skeleton the page shows
 * while its own data loads, so the transition reads as one state, including quiz, attempt and
 * assignment views and Secciones (whose static title lives in `sections-skeleton.tsx`).
 * Other detail pages and unknown paths keep the generic state their pages still use.
 */
/** Section bodies the pages draw under the header skeleton; the others keep the neutral area. */
const bodies: Readonly<Record<string, ReactNode>> = {
  modules: <ModulesSkeleton />,
  grades: gradesSkeleton,
  gradebook: gradebookSkeleton,
};

export function CourseRouteLoading() {
  const pathname = usePathname() ?? "";
  if (pathname === "/courses") return <CourseDirectorySkeleton />;
  const quiz = quizSkeletonKind(pathname);
  if (quiz) return <QuizSkeleton kind={quiz} />;
  const assignment = assignmentSkeletonRoute(pathname);
  if (assignment) return <AssignmentSkeleton {...assignment} />;
  const section = /^\/courses\/[^/]+\/([^/]+)$/.exec(pathname)?.[1];
  if (section === "sections") return <SectionsSkeleton />;
  const title = section && Object.hasOwn(courseSectionTitles, section) ? courseSectionTitles[section] : undefined;
  if (!title) return <LoadingState />;
  return <CourseSectionSkeleton title={title}>{bodies[section!]}</CourseSectionSkeleton>;
}
