export {course,section,otherSection,id,user,deferred} from "./courses.ts";
export {mount,flush} from "./course-ui.ts";
import {course,section,otherSection,id,person} from "./courses.ts";
export const item={id:id(70),courseId:course.id,quizId:id(60),title:"Quiz de aislamiento",weightPercent:100,createdAt:course.createdAt};
export const items={items:[item],totalWeightPercent:100};
export const grade={id:id(90),gradeItemId:item.id,studentId:person.id,sectionId:section.id,attemptId:id(80),scorePercent:80,grade:5.5,publishedAt:null as string|null};
export const row={student:person,sectionId:section.id,grades:[grade],partialAverage:null as number|null,publishedWeightPercent:0};
export const book={courseId:course.id,items:[row],hasMore:false,nextCursor:null as string|null};
export const historical={...row,student:{...person,active:false},sectionId:otherSection.id,grades:[{...grade,id:id(91),sectionId:otherSection.id}]};
export const receipt={publishedCount:1,publishedAt:course.createdAt};
export const mine={courseId:course.id,items:[{gradeItemId:item.id,title:item.title,weightPercent:100,scorePercent:80,grade:5.5,publishedAt:receipt.publishedAt}],partialAverage:5.5,publishedWeightPercent:100,isPartial:false};
export const zero={...mine,items:[{...mine.items[0],weightPercent:0}],partialAverage:null,publishedWeightPercent:0,isPartial:true};
export const empty={...zero,items:[]};
export const frozen={...book,items:[{...row,grades:[{...grade,publishedAt:receipt.publishedAt}],partialAverage:5.5,publishedWeightPercent:100}]};
export function reply(r:Request){const u=new URL(r.url);return Response.json(u.pathname.endsWith('/my-grades')?mine:u.pathname.endsWith('/grade-items')?items:u.pathname.endsWith('/gradebook')?book:u.pathname.endsWith('/sections')?{items:[section,otherSection]}:course);}
