import type { CurrentUser } from "../auth/validation.ts";
import type { CourseSummary, Course, Section } from "./validation.ts";
export function capabilities(user: CurrentUser, course?: CourseSummary | Course, section?: Section) {
  const active = user.institutionMembership.active && user.institutionMembership.institution.active;
  const create = active && user.institutionMembership.isAdmin;
  const configure = !!(create && course && "createdBy" in course && course.createdBy === user.id);
  const teacher = active && user.sectionMemberships.some(m => m.role === "teacher" && m.courseId === course?.id && m.sectionId === section?.id && section?.courseId === course?.id);
  const sections = configure || active && user.sectionMemberships.some(m => m.role === "teacher" && m.courseId === course?.id);
  // Only the admin owner assigns, changes or revokes teacher enrollments; teachers manage students and assistants.
  return { create, configure, sections, manage: configure || teacher, teachers: configure, search: active && user.sectionMemberships.some(m => m.role === "teacher") };
}
