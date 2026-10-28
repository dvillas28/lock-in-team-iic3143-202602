import type { CurrentUser } from "../auth/validation.ts";
export function canAuthorContent(user: CurrentUser, courseId: string) {
  return user.institutionMembership.active && user.institutionMembership.institution.active &&
    user.sectionMemberships.some(m => m.courseId === courseId && m.role === "teacher");
}
