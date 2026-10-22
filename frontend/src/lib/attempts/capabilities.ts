import type {CurrentUser} from "../auth/validation.ts";
import type {Course,Section} from "../courses/validation.ts";
import type {Summary} from "../quizzes/validation.ts";
import type {Attempt} from "./validation.ts";
// Match backend attemptView: student eligibility uses quiz destination; teacher uses historical section.
function scope(user:CurrentUser,course:Course,quiz:Summary) {
 const active=user.institutionMembership.active && user.institutionMembership.institution.active && quiz.courseId===course.id;
 const roles=user.sectionMemberships.filter(m=>m.courseId===course.id);
 const owner=user.institutionMembership.isAdmin && course.createdBy===user.id;
 const teacher=(section:string|null)=>active && roles.some(m=>m.role==="teacher" && (owner||m.sectionId===section));
 return {active,roles,teacher,student:active && roles.some(m=>m.role==="student") && !teacher(quiz.sectionId)};
}
export function startSections(user:CurrentUser,course:Course,quiz:Summary,sections:Section[]) {
 const s=scope(user,course,quiz);
 return !s.student||quiz.status!=="published"?[]:sections.filter(x=>x.courseId===course.id && (quiz.sectionId===null||quiz.sectionId===x.id) && s.roles.some(m=>m.role==="student" && m.sectionId===x.id));
}
export function attemptCapabilities(user:CurrentUser,course:Course,quiz:Summary,a:Attempt) {
 const s=scope(user,course,quiz),valid=a.quizId===quiz.id;
 const student=valid && s.student && a.studentId===user.id;
 const teacher=valid && !student && s.teacher(a.sectionId);
 return {student,teacher,edit:student && a.status==="inProgress",cancel:(student||teacher) && a.status==="inProgress"};
}
