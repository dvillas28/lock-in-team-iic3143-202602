import {expect,type Page} from '@playwright/test';
import type {Environment} from '../fixtures/environment.ts';
import {Api,status} from './api.ts';
import {compatibilityNavigate} from './browser.ts';
export function topology(e:Environment,slug='uc') {
 const f=slug==='utfsm';return {slug,superadmin:f?'FSA':'SA',item:e.id('item/'+(f?'FQ1':'Q1')),course:e.data.courses[f?'F1':'C1'],section:e.data.sections[f?'FS1':'S1'],module:e.data.modules[f?'FM1':'M1'],material:e.data.materials[f?'FR1':'R1'],quiz:e.data.quizzes[f?'FQ1':'Q1'],student:f?'FST1':'ST1',teacher:f?'FT1':'T1',owner:f?'FAO':'AO',assistant:f?'FAS1':'AS1'};
}
export async function academic(e:Environment,slug='uc',graded=false) {
 const t=topology(e,slug),api=await e.api(t.student,slug);
 const a=status(await api.post(`sections/${t.section}/quizzes/${t.quiz}/attempts`,undefined,e.key()),201).body;
 if(graded) {
  const qs=status(await api.get(`quizzes/${t.quiz}`),200).body.questions;
  status(await api.put(`quiz-attempts/${a.id}/answers`,{answers:qs.map((q:{id:string})=>({questionId:q.id,alternativeId:'a'}))}),200);
  status(await api.post(`quiz-attempts/${a.id}/submit`,undefined,e.key()),200);
 }
 return {...t,attempt:a.id,item:e.id('item/'+(slug==='uc'?'Q1':'FQ1'))};
}
export async function securitySnapshot(e:Environment) {
 const result:Record<string,unknown>={};
 for(const name of ['institutions','institution_memberships','courses','sections','enrollments','course_modules','materials','quizzes','quiz_attempts','grade_items','grades','grade_publications','audit_events'])result[name]=(await e.pool.query(`SELECT * FROM ${name} ORDER BY id`)).rows;
 return result;
}
export async function deniedUI(page:Page,path:string) {
 await compatibilityNavigate(page,path);
 await expect(page.locator('main').getByText(/^(Recurso no disponible|Permisos insuficientes|Servicio no disponible|No se pudo cargar el contenido)$/).first()).toBeVisible();
}
export const courseInput={code:'SECURITY',name:'Curso de seguridad',term:'2026-2',initialSection:{code:'1'}};
export async function pages(api:Api,path:string) {
 const items:any[]=[];let cursor:string|null=null;
 do {const r:{items:any[];nextCursor:string|null}=status(await api.get(path+(path.includes('?')?'&':'?')+'limit=1'+(cursor?'&cursor='+encodeURIComponent(cursor):'')),200).body;items.push(...r.items);cursor=r.nextCursor;if(items.length>300)throw new Error('Pagination did not converge');}while(cursor);
 return items;
}

/** Every academic/admin mutation over resources visible to S1's assistant/student. */
export async function rejectNonStaffWrites(e:Environment,api:Api) {
 const c=e.data.courses.C1,s=e.data.sections.S1,m=e.data.modules.M1,r=e.data.materials.R1,q=e.data.quizzes.Q1;
 const writes:[string,string,unknown?][]=[
  ['POST','courses',courseInput],['PATCH',`courses/${c}`,{name:'attack'}],['POST',`courses/${c}/sections`,{code:'attack'}],['PATCH',`sections/${s}`,{code:'attack'}],
  ['POST',`sections/${s}/enrollments`,{userId:e.data.actors.MEMBER.id,role:'student'}],['PATCH',`sections/${s}/enrollments/${e.id('enrollment/S1/T1/teacher')}`,{active:false}],
  ['POST',`courses/${c}/modules`,{title:'attack',position:3}],['PATCH',`modules/${m}`,{title:'attack'}],['PUT',`courses/${c}/modules/order`,{moduleIds:[e.data.modules.M2,m]}],['POST',`modules/${m}/publish`],['POST',`modules/${m}/unpublish`],
  ['POST',`modules/${m}/materials`,{title:'attack',markdownBody:'attack'}],['PATCH',`materials/${r}`,{title:'attack'}],['POST',`materials/${r}/publish`],['POST',`materials/${r}/unpublish`],
  ['POST',`courses/${c}/quizzes`,{title:'attack',sectionId:s}],['PATCH',`quizzes/${q}`,{title:'attack'}],['POST',`quizzes/${q}/publish`],
  ['PUT',`courses/${c}/gradebook/weights`,{items:[{gradeItemId:e.id('item/Q1'),weightPercent:100}]}],['POST',`courses/${c}/gradebook/publications`,e.selection()],
 ];
 const before=await securitySnapshot(e);
 for(const [method,path,body] of writes)status(await api.request(api.path(path),method,body,{'Idempotency-Key':e.key()}),403);
 expect(await securitySnapshot(e)).toEqual(before);
}
