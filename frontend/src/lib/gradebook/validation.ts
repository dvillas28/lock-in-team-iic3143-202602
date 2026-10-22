import type {components} from '../api/schema';
import {ApiResponseError} from '../api/errors.ts';
import {isRecord} from '../auth/validation.ts';
import {isId,person} from '../courses/validation.ts';
export type StudentGrades=components['schemas']['StudentGradesResponse'];
export type GradeItem=components['schemas']['GradeItem'];
export type Book=components['schemas']['GradebookResponse'];
export type Selection=components['schemas']['PublishGradesRequest'];
export type Receipt=components['schemas']['PublishGradesResponse'];
export const date=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?Z$/.test(v)&&Number.isFinite(Date.parse(v));
export const number=(v:unknown,min=0,max=100):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export const unique=(v:unknown[])=>new Set(v).size===v.length;
const title=(v:unknown)=>typeof v==='string'&&v.trim().length>0&&!v.includes('\0');
const average=(v:unknown)=>v===null||number(v,1,7);
export function studentGrades(v:unknown,courseId:string):StudentGrades{
 if(!isRecord(v)||v.courseId!==courseId||!isId(v.courseId)||!Array.isArray(v.items)||!average(v.partialAverage)||!number(v.publishedWeightPercent)||typeof v.isPartial!=='boolean')throw new ApiResponseError();
 for(const i of v.items)if(!isRecord(i)||!isId(i.gradeItemId)||!title(i.title)||!number(i.weightPercent)||!number(i.scorePercent)||!number(i.grade,1,7)||!date(i.publishedAt))throw new ApiResponseError();
 if(!unique(v.items.map(i=>i.gradeItemId)))throw new ApiResponseError();return v as StudentGrades;
}
export function gradeItems(v:unknown,courseId:string):{items:GradeItem[];totalWeightPercent:number}{
 if(!isRecord(v)||!Array.isArray(v.items)||!number(v.totalWeightPercent,0,Number.MAX_SAFE_INTEGER))throw new ApiResponseError();
 for(const i of v.items)if(!isRecord(i)||!isId(i.id)||i.courseId!==courseId||!isId(i.quizId)||!title(i.title)||!number(i.weightPercent)||!date(i.createdAt))throw new ApiResponseError();
 if(!unique(v.items.map(i=>i.id))||!unique(v.items.map(i=>i.quizId)))throw new ApiResponseError();return v as {items:GradeItem[];totalWeightPercent:number};
}
export function pageInfo(v:unknown){
 if(!isRecord(v)||!Array.isArray(v.items)||typeof v.hasMore!=='boolean'||(v.nextCursor!==null&&(typeof v.nextCursor!=='string'||!v.nextCursor||v.nextCursor.length>4096))||v.hasMore!==(v.nextCursor!==null))throw new ApiResponseError();
 return {items:v.items,hasMore:v.hasMore,nextCursor:v.nextCursor as string|null};
}
export function bookDto(v:unknown,courseId:string,items:GradeItem[],sectionId?:string):Book{
 const p=pageInfo(v);if(!isRecord(v)||v.courseId!==courseId)throw new ApiResponseError();
 const keys:string[]=[],grades:string[]=[];
 for(const r of p.items){
  if(!isRecord(r)||!isId(r.sectionId)||(sectionId!==undefined&&r.sectionId!==sectionId)||!Array.isArray(r.grades)||!average(r.partialAverage)||!number(r.publishedWeightPercent))throw new ApiResponseError();
  const s=person(r.student);keys.push(s.id+'/'+r.sectionId);
  for(const g of r.grades){if(!isRecord(g)||!isId(g.id)||!isId(g.attemptId)||g.studentId!==s.id||g.sectionId!==r.sectionId||!items.some(i=>i.id===g.gradeItemId)||!number(g.scorePercent)||!number(g.grade,1,7)||(g.publishedAt!==null&&!date(g.publishedAt)))throw new ApiResponseError();grades.push(g.id);}
  if(!unique(r.grades.map(g=>g.gradeItemId)))throw new ApiResponseError();
 }
 if(!unique(keys)||!unique(grades))throw new ApiResponseError();return v as Book;
}
export function queryPage(cursor?:string,limit=20){
 if(!Number.isInteger(limit)||limit<1||limit>100||(cursor!==undefined&&(!cursor||cursor.length>4096)))throw new TypeError('Paginación inválida.');return {cursor,limit};
}
export function cents(v:string){
 if(!/^\d{1,3}(?:\.\d{1,2})?$/.test(v))throw new TypeError('Usa porcentajes con hasta dos decimales.');
 const [a,b='']=v.split('.'),n=Number(a)*100+Number(b.padEnd(2,'0'));if(n>10000)throw new TypeError('Peso fuera de rango.');return n;
}
export function weightsInput(values:{gradeItemId:string;weightPercent:string}[],items:GradeItem[]){
 if(!items.length||values.length!==items.length||!unique(values.map(i=>i.gradeItemId))||values.some(i=>!items.some(x=>x.id===i.gradeItemId)))throw new TypeError('Incluye cada evaluación exactamente una vez.');
 const weights=values.map(i=>cents(i.weightPercent));if(weights.reduce((a,b)=>a+b,0)!==10000)throw new TypeError('Los pesos deben sumar exactamente 100 %.');
 return bodySize({items:values.map((i,n)=>({gradeItemId:i.gradeItemId,weightPercent:weights[n]/100}))});
}
export function bodySize<T>(v:T):T{if(new TextEncoder().encode(JSON.stringify(v)).length>4096)throw new TypeError('Selección demasiado grande (máximo 4096 bytes).');return v;}
export function selection(v:Selection):Selection{
 const ids=(a:string[])=>{if(!Array.isArray(a)||!a.length||!a.every(isId))throw new TypeError('Selecciona evaluaciones, secciones y estudiantes.');const b=a.map(x=>x.toLowerCase()).sort();if(!unique(b))throw new TypeError('Selección duplicada.');return b;};
 return bodySize({gradeItemIds:ids(v.gradeItemIds),sectionIds:ids(v.sectionIds),studentIds:ids(v.studentIds)});
}
export function rectangle(v:Selection,rows:Book['items']){
 const s=selection(v);
 for(const studentId of s.studentIds)for(const gradeItemId of s.gradeItemIds){const pairs=rows.flatMap(r=>s.sectionIds.includes(r.sectionId)&&r.student.id===studentId?r.grades.filter(g=>g.gradeItemId===gradeItemId):[]);if(pairs.length!==1||pairs[0].publishedAt!==null)throw new TypeError('Cada par evaluación/estudiante debe tener una nota revisada sin publicar.');}
 return s;
}
export function receiptDto(v:unknown):Receipt{if(!isRecord(v)||!Number.isSafeInteger(v.publishedCount)||(v.publishedCount as number)<1||!date(v.publishedAt))throw new ApiResponseError();return v as Receipt;}
