"use client";
import { usePathname } from "next/navigation";
import { LoadingState } from "../route-states.tsx";
import { CourseDirectorySkeleton } from "./course-directory.tsx";
import { CourseSectionSkeleton } from "./course-skeleton.tsx";
import { ModulesSkeleton } from "../content/modules-skeleton.tsx";

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
 * while its own data loads, so the transition reads as one state. Detail pages, Secciones (whose
 * title depends on the role) and unknown paths keep the generic state their pages still use.
 */
export function CourseRouteLoading() {
  const pathname = usePathname() ?? "";
  if (pathname === "/courses") return <CourseDirectorySkeleton />;
  const section = /^\/courses\/[^/]+\/([^/]+)$/.exec(pathname)?.[1];
  const title = section && Object.hasOwn(courseSectionTitles, section) ? courseSectionTitles[section] : undefined;
  if (!title) return <LoadingState />;
  return section === "modules" ? <CourseSectionSkeleton title={title}><ModulesSkeleton /></CourseSectionSkeleton> : <CourseSectionSkeleton title={title} />;
}
