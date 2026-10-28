import Link from 'next/link';
import type { CurrentUser } from '../../lib/auth/validation.ts';
import type { Course } from '../../lib/courses/validation.ts';
import { gradebookCapabilities } from '../../lib/gradebook/capabilities.ts';
import { capabilities } from '../../lib/courses/capabilities.ts';

/** Receives an already authorized course; never fetches data for navigation. */
export function CourseNavigation({ course, user, active }: Readonly<{ course: Course; user: CurrentUser; active: string }>) {
  const base = `/courses/${course.id}`, cap = gradebookCapabilities(user, course);
  const links = [
    ['', 'Resumen'], ['/modules', 'Módulos y material'], ['/quizzes', 'Quizzes'],
    ...(capabilities(user, course).sections ? [['/sections', 'Secciones y participantes']] : []),
    ...(cap.student ? [['/grades', 'Mis notas']] : []),
    ...(cap.book ? [['/gradebook', 'Libro de notas']] : []),
    ...(cap.audit ? [['/audit', 'Auditoría']] : []),
  ];
  return <nav className="course-navigation" aria-label="Curso">{links.map(([suffix, label]) =>
    <Link key={suffix} href={base + suffix} className={`course-tab${active === suffix ? ' active' : ''}`} aria-current={active === suffix ? 'page' : undefined}>{label}</Link>
  )}</nav>;
}
