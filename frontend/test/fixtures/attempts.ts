import type { components } from "../../src/lib/api/schema";
export { mount, flush, user, deferred, course, section, otherSection, id } from "./quizzes.ts";
import { published, question, course, section, id, otherSection, user } from "./quizzes.ts";
export const quiz = {...published, questions:[{...question, alternatives:question.alternatives.map(({id,text})=>({id,text}))}]};
export const attempt: components["schemas"]["QuizAttemptStudentView"] = {id:id(80),quizId:quiz.id,sectionId:section.id,studentId:id(1),attemptNumber:1,status:"inProgress",startedAt:course.createdAt,submittedAt:null,cancelledAt:null,answers:[]};
export const answers = [{questionId:question.id,alternativeId:"a"}];
export const graded = {...attempt,status:"graded" as const,submittedAt:"2026-10-22T13:00:00.123456Z",answers};
export const cancelled = {...attempt,status:"cancelled" as const,cancelledAt:"2026-10-22T13:00:00Z"};
export const receipt = {id:attempt.id,status:"graded" as const,submittedAt:graded.submittedAt};
export const historical = {...attempt,sectionId:otherSection.id};
export const boundedQuiz = {...quiz,opensAt:"2026-10-21T12:00:00Z",closesAt:"2026-10-21T13:00:00Z",maxAttempts:2};
export const revoked = {...user("student"),sectionMemberships:[]};
export const tenants = ["uc","utfsm"];
export function reply(r:Request, value:unknown=attempt) {
 return Response.json(r.url.includes("/quiz-attempts/")?value:r.url.endsWith("/sections")?{items:[section,otherSection]}:r.url.endsWith("/quizzes")?{items:[quiz]}:r.url.includes("/quizzes/")?quiz:course);
}
