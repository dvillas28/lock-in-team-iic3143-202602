import {expect,type Page,type Locator} from '@playwright/test';
import type {Environment} from '../fixtures/environment.ts';
import {status} from './api.ts';
import {compatibilityNavigate,go} from './browser.ts';

export const questions=(points=[6,4])=>points.map((n,i)=>({prompt:`Pregunta ${i+1}`,position:i+1,points:n,alternatives:[{id:'a',text:'Correcta',isCorrect:true},{id:'b',text:'Incorrecta',isCorrect:false}]}));
export async function draft(e:Environment,patch:Record<string,unknown>={},actor='T1',slug='uc',course=e.data.courses.C1){
 return status(await (await e.api(actor,slug)).post(`courses/${course}/quizzes`,{title:'Quiz F5 '+e.key(),sectionId:e.data.sections.S1,questions:questions(),...patch}),201).body;
}
export async function published(e:Environment,patch:Record<string,unknown>={}){const q=await draft(e,patch);return status(await (await e.api()).post(`quizzes/${q.id}/publish`),200).body;}
export async function editor(page:Page,e:Environment,id=e.data.quizzes.QD,c=e.data.courses.C1){await compatibilityNavigate(page,`/courses/${c}/quizzes/${id}/authoring`);const f=page.getByRole('form',{name:'Editar quiz',exact:true});await expect(f).toBeVisible();return f;}
export async function quizCreate(page: Page, e: Environment, title = 'Quiz navegador F5', course = e.data.courses.C1, section = e.data.sections.S1) {
  await go(page, course, '/quizzes');
  await page.getByRole('link', { name: 'Crear quiz', exact: true }).click();
  const form = page.getByRole('form', { name: 'Crear quiz', exact: true });
  await form.getByLabel('Título del quiz', { exact: true }).fill(title);
  await form.getByRole('combobox', { name: 'Destinatarios', exact: true }).selectOption(section);
  for (let i = 1; i <= 2; i++) {
    await form.getByRole('button', { name: 'Agregar pregunta', exact: true }).click();
    const question = form.getByRole('group', { name: `Pregunta ${i}`, exact: true });
    await question.getByLabel('Enunciado', { exact: true }).fill(`Pregunta ${i}`);
    await question.getByLabel('Puntaje', { exact: true }).fill(i === 1 ? '6' : '4');
    await question.getByLabel('Alternativa A', { exact: true }).fill('Correcta');
    await question.getByLabel('Alternativa B', { exact: true }).fill('Incorrecta');
    await question.getByRole('radio', { name: `Marcar alternativa A como correcta en pregunta ${i}`, exact: true }).check();
  }
  return form;
}

export async function createInBrowser(page: Page, form: Locator) {
  await expect(form).toBeVisible();
  const pending = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/quizzes'));
  await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
  const response = await pending;
  expect(response.status()).toBe(201);
  const quiz = await response.json();
  await expect(page).toHaveURL(/\/quizzes(?:\?|$)/);
  return quiz;
}
export async function publishInBrowser(page:Page){await page.getByRole('button',{name:'Publicar quiz',exact:true}).click();const pending=page.waitForResponse(r=>r.url().endsWith('/publish')&&r.request().method()==='POST');await page.getByRole('dialog',{name:'¿Publicar este quiz?',exact:true}).getByRole('button',{name:'Publicar quiz',exact:true}).click();const r=await pending;expect(r.status()).toBe(200);return r;}
export async function attemptPage(page:Page,id:string){await compatibilityNavigate(page,`/attempts/${id}`);await expect(page.getByRole('heading',{name:/Intento/}).first()).toBeVisible();}
// Independent integer arithmetic; no imports from product scoring or floating point sums.
const halfUp=(n:bigint,d:bigint)=>(2n*n+d)/(2n*d);
export function oracle(points:number[],correct:boolean[]){const cents=points.map(x=>BigInt(Math.round(x*100))),total=cents.reduce((a,b)=>a+b,0n),earned=cents.reduce((a,b,i)=>a+(correct[i]?b:0n),0n),p=halfUp(earned*10000n,total),g=p<=6000n?halfUp(2000n+p,200n):halfUp(16000n+3n*(p-6000n),400n);return {scorePercent:Number(p)/100,grade:Number(g)/10};}
export async function startInBrowser(page:Page,e:Environment,quiz=e.data.quizzes.Q1,course=e.data.courses.C1){await compatibilityNavigate(page,`/courses/${course}/quizzes/${quiz}`);const pending=page.waitForResponse(r=>r.url().endsWith('/attempts')&&r.request().method()==='POST');await page.getByRole('button',{name:'Iniciar nuevo intento',exact:true}).click();const r=await pending;expect(r.status()).toBe(201);const a=await r.json();await expect(page).toHaveURL(new URL(`/attempts/${a.id}`,page.url()).href);await expect(page.getByRole('form',{name:'Respuestas del intento',exact:true})).toBeVisible();return {a,response:r};}
export async function choose(page:Page,answers:{questionId:string;alternativeId:string}[]){for(const a of answers)await page.locator(`input[type=radio][name="${a.questionId}"][value="${a.alternativeId}"]`).check();}
export async function confirm(page:Page,label:string,title:string){await page.getByRole('button',{name:label,exact:true}).click();await page.getByRole('button',{name:title,exact:true}).click();}
export async function staffAttempt(page:Page,e:Environment,id:string,q=e.data.quizzes.Q1){await compatibilityNavigate(page,`/courses/${e.data.courses.C1}/quizzes/${q}/attempts/${id}`);await expect(page.getByText(id,{exact:false}).first()).toBeVisible();}
export async function book(page:Page,e:Environment,course=e.data.courses.C1){await go(page,course,'/gradebook');await expect(page.getByRole('combobox',{name:'Sección histórica',exact:true})).toBeVisible();}
export async function publicationSelection(page:Page,selection:{gradeItemIds:string[];sectionIds:string[];studentIds:string[]}){await page.getByRole('button',{name:'Publicar notas',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Publicar notas',exact:true});for(const ids of [selection.gradeItemIds,selection.sectionIds,selection.studentIds])for(const id of ids)await dialog.locator(`input[type=checkbox][value="${id}"]`).check();await dialog.getByRole('button',{name:'Revisar publicación',exact:true}).click();await expect(page.getByRole('dialog',{name:'Confirmar selección de publicación',exact:true})).toBeVisible();}
export async function publishGradesInBrowser(page:Page){const pending=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/publications'));await page.getByRole('dialog',{name:'¿Publicar este quiz?',exact:true}).getByRole('button',{name:'Publicar quiz',exact:true}).click();return pending;}
export async function weights(e:Environment,course=e.data.courses.C1,actor='AO',slug='uc'){const api=await e.api(actor,slug);return status(await api.get(`courses/${course}/grade-items`),200).body.items.map((i:any)=>({gradeItemId:i.id,weightPercent:i.weightPercent}));}
export async function freshCourse(e:Environment,slug='uc'){const foreign=slug==='utfsm',actor=foreign?'FAO':'AO',student=foreign?'FST1':'ST1',api=await e.api(actor,slug),course=status(await api.post('courses',{code:'F5-'+e.key().slice(0,8),name:'Ciclo académico F5',term:'2026-2',initialSection:{code:'1'}}),201).body,section=status(await api.get(`courses/${course.id}/sections`),200).body.items[0];status(await api.post(`sections/${section.id}/enrollments`,{userId:e.data.actors[student].id,role:'student'}),201);return {course:course.id,section:section.id,actor,student,api};}
export async function gradeMany(e:Environment,count=21){
 await e.assertOwned();const a=await e.graded(),source=(await e.pool.query('SELECT * FROM quiz_attempts WHERE id=$1',[a.id])).rows[0];
 // Owned fixtures for paging only: real scoring is verified separately against the integer oracle.
 for(let n=1;n<count;n++){const u=e.id('page-student/'+n),attempt=e.id('page-attempt/'+n);await e.pool.query('INSERT INTO users(id,email,name,password_hash) SELECT $1,$2,$3,password_hash FROM users WHERE id=$4',[u,`page${n}@e2e.invalid`,`Estudiante página ${n}`,e.data.actors.ST1.id]);await e.pool.query("INSERT INTO institution_memberships(id,institution_id,user_id) VALUES($1,$2,$3)",[e.id('page-member/'+n),source.institution_id,u]);await e.pool.query(`INSERT INTO quiz_attempts(id,institution_id,course_id,quiz_id,section_id,student_id,attempt_number,status,answers,score_points,score_percent,grade_value,submitted_at,start_key,submit_key) VALUES($1,$2,$3,$4,$5,$6,1,'graded',$7,$8,$9,$10,clock_timestamp(),$11,$12)`,[attempt,source.institution_id,source.course_id,source.quiz_id,source.section_id,u,JSON.stringify(source.answers),source.score_points,source.score_percent,source.grade_value,e.key(),e.key()]);await e.pool.query('INSERT INTO grades(id,institution_id,grade_item_id,quiz_id,student_id,section_id,attempt_id,score_percent,grade_value) SELECT $1,institution_id,grade_item_id,quiz_id,$2,section_id,$3,score_percent,grade_value FROM grades WHERE attempt_id=$4',[e.id('page-grade/'+n),u,attempt,a.id]);}
}
