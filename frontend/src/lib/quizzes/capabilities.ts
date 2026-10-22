import type { CurrentUser } from "../auth/validation.ts";
import type { Course, Section } from "../courses/validation.ts";
export function canAuthor(user: CurrentUser, course: Course, sections: Section[], destination: string | null) {
  const active = user.institutionMembership.active && user.institutionMembership.institution.active;
  if (!active || (destination !== null && !sections.some(s => s.id === destination && s.courseId === course.id))) return false;
  const owner = user.institutionMembership.isAdmin && course.createdBy === user.id;
  return user.sectionMemberships.some(m => m.courseId === course.id && m.role === "teacher" &&
    sections.some(s => s.id === m.sectionId && s.courseId === course.id) && (owner || m.sectionId === destination));
}
export const destinations = (user: CurrentUser, course: Course, sections: Section[]) =>
  sections.filter(s => canAuthor(user, course, sections, s.id));
