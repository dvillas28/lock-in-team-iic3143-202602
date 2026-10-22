import type { Authoring } from "../../src/lib/quizzes/validation.ts";
export { mount, flush } from "./course-ui.ts";
export { user, deferred, otherCourse, otherSection, section, course, id } from "./courses.ts";
import { course, section, id } from "./courses.ts";
export const question = {id:id(61),prompt:"¿Cuál es el aislamiento correcto?",position:1,points:2,alternatives:[{id:"a",text:"Por institución",isCorrect:true},{id:"b",text:"Global",isCorrect:false}]};
export const draft: Authoring = {id:id(60),courseId:course.id,sectionId:section.id,title:"Quiz de aislamiento",instructions:"Elige una alternativa",opensAt:null,closesAt:null,maxAttempts:null,status:"draft",publishedAt:null,createdBy:id(1),questions:[question]};
export const emptyDraft = {...draft, questions:[]};
export const published: Authoring = {...draft,status:"published",publishedAt:"2026-10-22T12:00:00.123456Z"};
export const grade = {id:id(70),quizId:draft.id,courseId:course.id,title:draft.title,weightPercent:0,createdAt:published.publishedAt};
export function reply(r: Request, quiz = draft): Response {
 return Response.json(r.url.endsWith("/sections")?{items:[section]}:r.url.endsWith("/grade-items")?{items:[grade],totalWeightPercent:0}:r.url.endsWith("/quizzes")?{items:[quiz]}:r.url.includes("/quizzes/")?quiz:course);
}
