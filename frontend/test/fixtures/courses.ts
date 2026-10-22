import type { CurrentUser } from "../../src/lib/auth/validation.ts";
export const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
export const course = { id:id(10), code:"IIC3143", name:"Desarrollo de software", term:"2026-2", createdBy:id(1), createdAt:"2026-10-21T12:00:00Z" };
export const otherCourse = { ...course, id:id(11), code:"MAT", createdBy:id(2) };
export const section = { id:id(20), courseId:course.id, code:"1", capacity:null, createdAt:course.createdAt };
export const otherSection = { ...section, id:id(21), code:"2" };
export const person = { id:id(2), name:"María Pérez", email:"maria@example.test", active:true };
export const enrollment = { id:id(30), sectionId:section.id, user:person, role:"student" as const, active:true, createdAt:course.createdAt };
export const history = { ...enrollment, id:id(31), role:"assistant" as const, active:false };
export const page = (items:unknown[], nextCursor:string|null=null) => ({items,hasMore:nextCursor!==null,nextCursor});
export function user(profile="owner",slug="uc"): CurrentUser {
 const roles = profile==="multi" ? ["teacher","assistant","student"] as const : profile==="teacher" || profile==="foreign" || profile==="ownerTeacher" ? ["teacher"] as const : profile==="student" ? ["student"] as const : profile==="assistant" ? ["assistant"] as const : [];
 return {id:profile==="foreign"?id(2):id(1),name:"Ana",email:"ana@example.test",institutionMembership:{id:id(3),active:true,isAdmin:["owner","ownerTeacher","foreign"].includes(profile),isSuperAdmin:profile==="super",institution:{id:id(slug==="uc"?4:5),slug,name:slug.toUpperCase(),active:true}},sectionMemberships:roles.map(role=>({courseId:course.id,sectionId:section.id,role}))};
}
export function deferred<T>() { let resolve!: (value:T)=>void; let reject!:(reason:unknown)=>void; const promise=new Promise<T>((a,b)=>{resolve=a;reject=b;}); return {promise,resolve,reject}; }
export const failureStatuses=[400,401,403,404,409,422,503];
