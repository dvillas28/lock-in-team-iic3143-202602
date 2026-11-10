import {type Page} from '@playwright/test';
import {test,expect} from '../fixtures/test.ts';
import {status} from '../helpers/api.ts';
import {go,login} from '../helpers/browser.ts';
import {securitySnapshot,pages} from '../helpers/security.ts';
import {questions,published,draft,oracle,book,publicationSelection,publishGradesInBrowser,weights,freshCourse,quizCreate,createInBrowser,editor,publishInBrowser,startInBrowser,choose,confirm,gradeMany} from '../helpers/academic.ts';
const pub=(c:string)=>`courses/${c}/gradebook/publications`,wpath=(c:string)=>`courses/${c}/gradebook/weights`,
 groupsPath=(c:string)=>`courses/${c}/gradebook/groups`;
async function editorFor(page:Page) {
 await page.getByRole('button',{name:'Ponderaciones',exact:true}).click();
 return page.getByRole('dialog',{name:'Ponderaciones del curso',exact:true});
}

for(const [name,points,correct,percent,grade] of [['zero',[1,1],[false,false],0,1],['30',[30,70],[true,false],30,2.5],['60',[60,40],[true,false],60,4],['80',[80,20],[true,false],80,5.5],['100',[1,1],[true,true],100,7]] as [string,number[],boolean[],number,number][])test(`E2E-GRADE-001 score and Chilean grade agree with independent oracle / ${name} @regression`,async({e,actorPage})=>{
 expect(oracle(points,correct)).toEqual({scorePercent:percent,grade});const q=await published(e,{questions:questions(points)}),a=await e.graded('ST1',correct,q.id),api=await e.api(),result=status(await api.get(`quiz-attempts/${a.id}`),200).body;expect(result).toMatchObject(oracle(points,correct));const item=(await weights(e)).find((i:any)=>i.gradeItemId!=='')!;const id=(await e.pool.query('SELECT id FROM grade_items WHERE quiz_id=$1',[q.id])).rows[0].id;expect(item).toBeTruthy();status(await (await e.api('AO')).post(pub(e.data.courses.C1),{gradeItemIds:[id],sectionIds:[e.data.sections.S1],studentIds:[e.data.actors.ST1.id]},e.key()),200);const p=await actorPage('ST1');await go(p,e.data.courses.C1,'/grades');await expect(p.getByRole('table')).toContainText(String(grade));expect(status(await (await e.api('ST1')).get(`courses/${e.data.courses.C1}/my-grades`),200).body.items[0]).toMatchObject({scorePercent:percent,grade});
});
for(const [name,points,grade,percent] of [['third',[1,2],2.7,33.33],['two-thirds',[2,1],4.5,66.67],['half-up',[35,65],2.8,35],['threshold',[119.99,80.01],4,60]] as [string,number[],number,number][])test(`E2E-GRADE-002 decimal rounding before grade mapping / ${name} @extended`,async({e,actorPage})=>{
 expect(oracle(points,[true,false])).toEqual({scorePercent:percent,grade});const q=await published(e,{questions:questions(points)}),a=await e.graded('ST1',[true,false],q.id),result=status(await (await e.api()).get(`quiz-attempts/${a.id}`),200).body;expect(result).toMatchObject({scorePercent:percent,grade});const p=await actorPage('AO');await book(p,e);await expect(p.getByRole('table')).toContainText(String(grade));
});
test('E2E-GRADE-003 unpublished grade exists for staff and remains absent for student / unpublished @smoke',async({e,actorPage})=>{
 await e.graded();expect(await e.count('grades','published_at IS NULL')).toBe(1);const api=await e.api('ST1'),d=status(await api.get(`courses/${e.data.courses.C1}/my-grades`),200).body;expect(d).toMatchObject({items:[],partialAverage:null,publishedWeightPercent:0,isPartial:true});const p=await actorPage('ST1');await go(p,e.data.courses.C1,'/grades');await expect(p.getByRole('heading',{name:'Aún no hay notas publicadas'})).toBeVisible();await expect(p.getByRole('table')).toHaveCount(0);
});
test('E2E-GRADE-004 published weighted average advances from partial to complete / partial-average @regression',async({e,actorPage})=>{
 await e.graded();await e.publish();const student=await e.api('ST1'),read=()=>student.get(`courses/${e.data.courses.C1}/my-grades`);expect(status(await read(),200).body).toMatchObject({partialAverage:4,publishedWeightPercent:30,isPartial:true});await e.graded('ST1',[true,true],e.data.quizzes.Q2);await e.publish('Q2');expect(status(await read(),200).body).toMatchObject({partialAverage:6.1,publishedWeightPercent:100,isPartial:false});const p=await actorPage('ST1');await go(p,e.data.courses.C1,'/grades');await expect(p.getByRole('heading',{name:'Promedio publicado',exact:true})).toBeVisible();await expect(p.getByRole('region',{name:'Resumen de notas publicadas'})).toContainText('6.1');
});
test('E2E-GRADE-005 zero weight published result does not invent an average / zero-weight @regression',async({e,actorPage})=>{
 const q=await published(e);await e.graded('ST1',[true,true],q.id);const id=(await e.pool.query('SELECT id FROM grade_items WHERE quiz_id=$1',[q.id])).rows[0].id;status(await (await e.api('AO')).post(pub(e.data.courses.C1),{gradeItemIds:[id],sectionIds:[e.data.sections.S1],studentIds:[e.data.actors.ST1.id]},e.key()),200);const d=status(await (await e.api('ST1')).get(`courses/${e.data.courses.C1}/my-grades`),200).body;expect(d).toMatchObject({partialAverage:null,publishedWeightPercent:0,isPartial:true});expect(d.items[0].grade).toBe(7);const p=await actorPage('ST1');await go(p,e.data.courses.C1,'/grades');await expect(p.getByRole('table')).toContainText('7');await expect(p.getByRole('region',{name:'Resumen de notas publicadas'})).toContainText('Pendiente');
});
test('E2E-GRADE-006 own grades use JWT subject and reject arbitrary student parameter / jwt-subject @regression',async({e,actorPage})=>{
 await e.graded();await e.publish();const student=await e.api('ST1'),before=await securitySnapshot(e);status(await student.get(`courses/${e.data.courses.C1}/my-grades?studentId=${e.data.actors.ST2.id}`),400);expect(await securitySnapshot(e)).toEqual(before);const p=await actorPage('ST1');await go(p,e.data.courses.C1,'/grades');await expect(p.getByRole('table').getByRole('row')).toHaveCount(2);expect(status(await student.get(`courses/${e.data.courses.C1}/my-grades`),200).body.items).toHaveLength(1);
});
test('E2E-GRADE-007 published historical section survives student section transfer / historical-section @regression',async({e,actorPage})=>{
 const a=await e.graded();await e.publish();const owner=await e.api('AO');status(await owner.post(`sections/${e.data.sections.S2}/enrollments`,{userId:e.data.actors.ST1.id,role:'student'}),201);await e.pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND section_id=$2 AND role='student'",[e.data.actors.ST1.id,e.data.sections.S1]);expect((await e.pool.query('SELECT section_id FROM grades WHERE attempt_id=$1',[a.id])).rows[0].section_id).toBe(e.data.sections.S1);const p=await actorPage('ST1');await go(p,e.data.courses.C1,'/grades');await expect(p.getByRole('table')).toContainText('4');expect(status(await (await e.api('T1')).get(`courses/${e.data.courses.C1}/gradebook?sectionId=${e.data.sections.S1}`),200).body.items[0].sectionId).toBe(e.data.sections.S1);
});
test('E2E-GRADE-008 staff sees unpublished and published grades scoped by historical section / staff-book @regression',async({e,actorPage})=>{
 const p=await actorPage('AO');await e.graded();await e.graded('ST2',[true,true],e.data.quizzes.QS2,e.data.sections.S2);for(const actor of ['T1','AS1','AO']){const rows=status(await (await e.api(actor)).get(`courses/${e.data.courses.C1}/gradebook`),200).body.items;expect(rows).toHaveLength(actor==='AO'?2:1);expect(rows[0].grades.length).toBeGreaterThan(0);}await book(p,e);await expect(p.getByRole('table')).toContainText(e.data.actors.ST1.email);await expect(p.getByRole('table')).toContainText(e.data.actors.ST2.email);
});
test('E2E-GRADE-009 book groups one student into distinct historical sections / grouped-sections @regression',async({e,actorPage})=>{
 await e.graded();status(await (await e.api('AO')).post(`sections/${e.data.sections.S2}/enrollments`,{userId:e.data.actors.ST1.id,role:'student'}),201);await e.graded('ST1',[true,true],e.data.quizzes.QS2,e.data.sections.S2);const api=await e.api('AO'),rows=status(await api.get(`courses/${e.data.courses.C1}/gradebook`),200).body.items;expect(rows).toHaveLength(2);expect(new Set(rows.map((r:any)=>r.sectionId)).size).toBe(2);const p=await actorPage('AO');await book(p,e);await p.getByRole('combobox',{name:'Sección histórica',exact:true}).selectOption(e.data.sections.S2);await expect(p.getByRole('table').locator('tbody tr')).toHaveCount(1);
});
test('E2E-GRADE-010 inactive users remain in academic history / inactive-history @regression',async({e,actorPage})=>{
 await e.graded('ST2',[true,true],e.data.quizzes.QS2,e.data.sections.S2);await e.pool.query('UPDATE users SET active=false WHERE id=$1',[e.data.actors.ST2.id]);const rows=status(await (await e.api('AO')).get(`courses/${e.data.courses.C1}/gradebook`),200).body.items;expect(rows[0].student).toMatchObject({id:e.data.actors.ST2.id,active:false});const p=await actorPage('AO');await book(p,e);await expect(p.getByRole('table')).toContainText(e.data.actors.ST2.email);expect(await e.count('grades')).toBe(1);
});
test('E2E-GRADE-011 empty book does not derive invented zero grades from roster / empty-book @regression',async({e,actorPage})=>{
 const api=await e.api('AO'),c=e.data.courses.C1;expect(status(await api.get(`courses/${c}/gradebook`),200).body.items).toEqual([]);expect(status(await api.get(`courses/${c}/grade-items`),200).body.items).toHaveLength(6);const p=await actorPage('AO');await book(p,e);await expect(p.getByRole('table')).toHaveCount(0);await expect(p.getByRole('button',{name:'Publicar notas',exact:true})).toBeDisabled();expect(await e.count('grades')).toBe(0);
});
test('E2E-GRADE-012 book paging changes visible students and section filter resets page / book-pages @extended',async({e,actorPage})=>{
 await gradeMany(e);const p=await actorPage('AO');await book(p,e);await expect(p.getByRole('table').locator('tbody tr')).toHaveCount(20);await p.getByRole('button',{name:'Siguiente',exact:true}).click();await expect(p.getByRole('table').locator('tbody tr')).toHaveCount(1);let posts=0;p.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/publications'))posts++;});await p.getByRole('button',{name:'Publicar notas',exact:true}).click();const d=p.getByRole('dialog',{name:'Publicar notas',exact:true});await d.locator(`input[value="${e.id('item/Q1')}"]`).check();await d.locator(`input[value="${e.data.sections.S1}"]`).check();await d.getByRole('group',{name:'Estudiantes de esta página',exact:true}).getByRole('checkbox').first().check();await d.getByRole('button',{name:'Cerrar',exact:true}).click();await p.getByRole('combobox',{name:'Sección histórica',exact:true}).selectOption(e.data.sections.S1);await expect(p.getByText('Página 1',{exact:true})).toBeVisible();await p.getByRole('button',{name:'Publicar notas',exact:true}).click();await expect(p.getByRole('dialog',{name:'Publicar notas',exact:true}).locator('input[type=checkbox]:checked')).toHaveCount(0);expect(posts).toBe(0);expect((await pages(await e.api('AO'),`courses/${e.data.courses.C1}/gradebook`))).toHaveLength(21);
});
test('E2E-GRADE-013 book cursor limits and inaccessible section reject then UI recovers / book-validation @extended',async({e,actorPage})=>{
 await e.graded();const api=await e.api('AO'),c=e.data.courses.C1;for(const limit of [1,20,100])status(await api.get(`courses/${c}/gradebook?limit=${limit}`),200);for(const query of ['limit=0','limit=101','cursor=corrupt'])status(await api.get(`courses/${c}/gradebook?${query}`),400);status(await api.get(`courses/${c}/gradebook?sectionId=${e.data.sections.FS1}`),404);const p=await actorPage('AO');let failed=false;await p.route(url=>url.pathname===`/api/v1/institution/uc/courses/${c}/gradebook`,async route=>{if(!failed){failed=true;return route.abort('failed');}await route.continue();});await book(p,e);await p.getByRole('button',{name:'Reintentar',exact:true}).click();await expect(p.getByRole('table')).toContainText(e.data.actors.ST1.email);
});
test('E2E-GRADE-014 group editor assigns evaluations and saves exact decimal weights / exact-weights @regression',async({e,actorPage})=>{
 const f=await freshCourse(e),p=await actorPage('AO');
 const quizzes:{id:string}[]=[];
 for(const title of ['Lectura inicial','Control de avance','Examen']){
  const q=await draft(e,{title,sectionId:f.section},f.actor,'uc',f.course);
  status(await f.api.post(`quizzes/${q.id}/publish`),200);quizzes.push(q);
 }
 await book(p,e,f.course);const d=await editorFor(p);
 await d.getByRole('button',{name:'Añadir grupo'}).click();
 await d.getByRole('textbox',{name:'Nombre del grupo'}).last().fill('Prácticas');
 await d.getByRole('combobox',{name:/Lectura inicial/}).selectOption({label:'Prácticas'});
 await d.getByRole('button',{name:'Quitar Lectura inicial'}).click();
 await d.getByRole('button',{name:'Subir Prácticas'}).click();
 const inputs=d.getByRole('textbox',{name:'Peso (%)',exact:true});
 for(let index=0;index<3;index++)await inputs.nth(index).fill(index===2?'33,34':'33,33');
 await expect(d.getByRole('button',{name:'Guardar grupos'})).toBeDisabled();
 await d.getByRole('checkbox',{name:'Confirmo el recálculo'}).check();
 const saved=p.waitForResponse(r=>r.url().endsWith('/groups')&&r.request().method()==='PUT');
 await d.getByRole('button',{name:'Guardar grupos'}).click();expect((await saved).status()).toBe(200);
 await expect(d).toBeHidden();
 const config=status(await f.api.get(`courses/${f.course}/grade-items`),200).body;
 expect(config.totalWeightPercent).toBe(100);
 expect(config.groups.map((g:{weightPercent:number})=>g.weightPercent)).toEqual([33.33,33.33,33.34]);
 const practice=config.groups.find((g:{title:string})=>g.title==='Prácticas');
 expect(config.items.find((i:{quizId:string})=>i.quizId===quizzes[0].id).groupId).toBe(practice.id);
 expect(await e.events('gradebook.groupsUpdated',f.course)).toHaveLength(1);
});
test('E2E-GRADE-015 weights require exact total and complete unique course collection / weight-collection @extended',async({e,actorPage})=>{
 const api=await e.api('AO'),c=e.data.courses.C1,items=await weights(e),before=await securitySnapshot(e);
 for(const delta of [-0.01,0.01])status(await api.put(wpath(c),{items:items.map((i:any)=>({...i,weightPercent:Math.round((i.weightPercent+(i.gradeItemId===e.id('item/Q1')?delta:0))*100)/100}))}),422);
 status(await api.put(wpath(c),{items:items.slice(1)}),422);
 status(await api.put(wpath(c),{items:[items[0],items[0]]}),400);
 status(await api.put(wpath(c),{items:items.map((i:any,n:number)=>n?i:{...i,gradeItemId:e.id('item/FQ1')})}),422);
 expect(await securitySnapshot(e)).toEqual(before);
 const p=await actorPage('AO');await book(p,e);const d=await editorFor(p);
 await d.getByRole('checkbox',{name:'Confirmo el recálculo'}).check();
 await expect(d.getByRole('button',{name:'Guardar grupos'})).toBeEnabled();
});
test('E2E-GRADE-016 weights reject negative excessive precision and wrong types / weight-types @extended',async({e,actorPage})=>{
 const api=await e.api('AO'),c=e.data.courses.C1,items=await weights(e),before=await securitySnapshot(e);
 for(const weightPercent of [-1,101,0.001,'30',null])status(await api.put(wpath(c),{items:items.map((i:any,n:number)=>n?i:{...i,weightPercent})}),400);
 expect(await securitySnapshot(e)).toEqual(before);
 status(await api.put(wpath(c),{items:items.map((i:any,n:number)=>({...i,weightPercent:n===0?100:0}))}),200);
 const p=await actorPage('AO');await book(p,e);const d=await editorFor(p);
 await expect(d.getByRole('textbox',{name:'Peso (%)',exact:true}).and(d.locator('input[value="100"]'))).toHaveCount(1);
});
test('E2E-GRADE-017 published grades allow weights to change and keep original grades / reweight-published @regression',async({e,actorPage})=>{
 const api=await e.api('AO'),course=e.data.courses.C1,student=await e.api('ST1');
 await e.graded();await e.publish();
 await e.graded('ST1',[true,true],e.data.quizzes.Q2);await e.publish('Q2');
 const before=status(await student.get(`courses/${course}/my-grades`),200).body;
 const config=status(await api.get(`courses/${course}/grade-items`),200).body;
 const p=await actorPage('AO');await book(p,e);const d=await editorFor(p);
 await expect(d.getByText('Este cambio puede modificar los promedios')).toBeVisible();
 const groups=config.groups as {id:string}[];
 for(const [index,group] of groups.entries()) {
  const value=group.id===e.id('item/Q1')?'90':group.id===e.id('item/Q2')?'10':'0';
  await d.getByRole('textbox',{name:'Peso (%)',exact:true}).nth(index).fill(value);
 }
 await d.getByRole('checkbox',{name:'Confirmo el recálculo'}).check();
 await d.getByRole('button',{name:'Guardar grupos'}).click();
 await expect(d).toBeHidden();
 const after=status(await student.get(`courses/${course}/my-grades`),200).body;
 expect(after.partialAverage).toBe(4.3);
 expect(after.items.map((i:{grade:number})=>i.grade)).toEqual(before.items.map((i:{grade:number})=>i.grade));
});
test('E2E-GRADE-018 mobile publication and point correction preview agree with the published grade / mobile-correction @regression',async({e,actorPage})=>{
 const course=e.data.courses.C1, api=await e.api('AO');
 const quiz=await published(e,{title:'Control de un punto',questions:questions([0.6,0.4])});
 const config=status(await api.get(`courses/${course}/grade-items`),200).body;
 const item=config.items.find((i:{quizId:string})=>i.quizId===quiz.id).id;
 status(await api.put(groupsPath(course),{expectedVersion:config.version,confirmRecalculation:true,groups:[
  {id:null,title:'Controles',weightPercent:30,gradeItemIds:[item]},
  {id:null,title:'Otras evaluaciones',weightPercent:70,gradeItemIds:config.items.filter((i:{id:string})=>i.id!==item).map((i:{id:string})=>i.id)},
 ]}),200);
 await e.graded('ST1',[true,false],quiz.id);
 await e.graded('ST1',[true,true],e.data.quizzes.Q2);
 const p=await actorPage('AO');await p.setViewportSize({width:390,height:844});await book(p,e);
 const toolbar=p.locator('.gradebook-toolbar'),publish=p.getByRole('button',{name:'Publicar notas',exact:true});
 const weightsButton=p.getByRole('button',{name:'Ponderaciones',exact:true});
 await expect(publish).toBeEnabled();
 const bounds=await toolbar.boundingBox();
 expect((await weightsButton.boundingBox())?.y).toBe((await publish.boundingBox())?.y);
 const settings=await editorFor(p);
 await expect(settings.getByRole('heading',{name:'Grupos de evaluación'})).toBeVisible();
 expect(await settings.evaluate(el=>el.scrollWidth)).toBeLessThanOrEqual(await settings.evaluate(el=>el.clientWidth)+1);
 await settings.getByRole('button',{name:'Cancelar'}).click();
 await publish.click();
 const dialog=p.getByRole('dialog',{name:'Publicar notas',exact:true});
 await dialog.getByRole('radio',{name:'Secciones completas'}).check();
 await dialog.locator(`input[value="${item}"]`).check();
 await dialog.locator(`input[value="${e.data.sections.S1}"]`).check();
 await dialog.getByRole('button',{name:'Revisar publicación'}).click();
 expect((await publishGradesInBrowser(p)).status()).toBe(200);
 const toast=p.locator('.content-notice');
 await expect(toast).toContainText('Notas publicadas correctamente');
 expect(await toast.evaluate(el=>getComputedStyle(el.parentElement!).position)).toBe('fixed');
 expect((await toolbar.boundingBox())?.height).toBe(bounds?.height);
 await expect(p.getByText('Comprobante de última publicación',{exact:true})).toHaveCount(0);
 await toast.getByRole('button',{name:'Cerrar notificación'}).click();
 await expect(toast).toHaveCount(0);
 const student=await e.api('ST1'),path=`courses/${course}/my-grades`;
 expect(status(await student.get(path),200).body.items.map((i:{gradeItemId:string})=>i.gradeItemId)).toEqual([item]);
 const attempts=(await e.pool.query('SELECT * FROM quiz_attempts ORDER BY id')).rows;
 await p.getByRole('button',{name:/^Corregir nota de /}).click();
 const correction=p.getByRole('dialog',{name:'Corregir nota publicada'});
 await expect(correction.getByText('Puntaje máximo')).toContainText('1 punto');
 const points=correction.getByRole('textbox',{name:'Puntaje corregido'});
 await points.fill('90%');
 await expect(correction.getByRole('button',{name:'Guardar corrección'})).toBeDisabled();
 await points.fill('0,9');
 await expect(correction.locator('output')).toContainText('0,9 de 1 punto (90 %)');
 await expect(correction.locator('output')).toContainText('Nota 6,3');
 await correction.getByRole('textbox',{name:'Motivo de la corrección'}).fill('Revisión de pauta');
 await p.route('**/gradebook/grades/*',route=>route.fulfill({status:422,json:{code:'UNPROCESSABLE_ENTITY'}}),{times:1});
 await correction.getByRole('button',{name:'Guardar corrección'}).click();
 const errorToast=correction.locator('.content-notice-error');
 await expect(errorToast).toBeVisible();
 await errorToast.getByRole('button',{name:'Cerrar notificación'}).click();
 await expect(errorToast).toHaveCount(0);
 await expect(points).toHaveValue('0,9');
 await correction.getByRole('button',{name:'Guardar corrección'}).click();
 await expect(correction).toBeHidden();
 await expect(toast).toContainText('Nota corregida correctamente');
 await expect(p.getByRole('table')).toContainText('Corregida');
 const mine=await actorPage('ST1');await mine.setViewportSize({width:390,height:844});await go(mine,course,'/grades');
 await expect(mine.getByRole('table')).toContainText('Corregida');
 const result=status(await student.get(path),200).body;
 expect(result.items[0]).toMatchObject({pointsEarned:0.9,maxPoints:1,scorePercent:90,grade:6.3});
 expect(result.partialAverage).toBe(6.3);
 expect(result.publishedWeightPercent).toBe(30);
 expect((await e.pool.query('SELECT * FROM quiz_attempts ORDER BY id')).rows).toEqual(attempts);
 expect(await e.events('grade.corrected')).toHaveLength(1);
 expect(await e.events('grade.published')).toHaveLength(1);
 expect(await e.count('grade_publications')).toBe(1);
});
test('E2E-GRADE-019 stale group configuration cannot overwrite a newer save / late-weight-save @extended',async({e,actorPage})=>{
 const p=await actorPage('AO'),api=await e.api('AO'),c=e.data.courses.C1;await book(p,e);
 const d=await editorFor(p);await d.getByRole('checkbox',{name:'Confirmo el recálculo'}).check();
 const config=status(await api.get(`courses/${c}/grade-items`),200).body;
 status(await api.put(groupsPath(c),{expectedVersion:config.version,confirmRecalculation:true,
  groups:[{id:null,title:'Evaluaciones',weightPercent:100,gradeItemIds:config.items.map((i:{id:string})=>i.id)}]}),200);
 const pending=p.waitForResponse(r=>r.url().endsWith('/groups')&&r.request().method()==='PUT');
 await d.getByRole('button',{name:'Guardar grupos'}).click();expect((await pending).status()).toBe(409);
 await expect(d.getByRole('button',{name:'Cargar versión vigente'})).toBeVisible();
});
test('E2E-GRADE-020 lost group response reconciles automatically without a second PUT / uncertain-weights @extended',async({e,actorPage})=>{
 const p=await actorPage('AO');await book(p,e);const d=await editorFor(p);
 await d.getByRole('checkbox',{name:'Confirmo el recálculo'}).check();
 let calls=0;await p.route('**/groups',async route=>{calls++;expect((await route.fetch()).status()).toBe(200);await route.abort('failed');});
 await d.getByRole('button',{name:'Guardar grupos'}).click();
 await expect(d).toBeHidden();expect(calls).toBe(1);
 expect(await e.events('gradebook.groupsUpdated',e.data.courses.C1)).toHaveLength(1);
});
for(const slug of ['uc','utfsm'])test(`E2E-GRADE-021 full material quiz attempt grade publication and average in university / ${slug} @smoke`,async({e,actorPage})=>{
 const f=await freshCourse(e,slug),teacher=await actorPage(f.actor,slug),module=status(await f.api.post(`courses/${f.course}/modules`,{title:'Unidad del ciclo',position:1}),201).body,material=status(await f.api.post(`modules/${module.id}/materials`,{title:'Material del ciclo',markdownBody:'# Objetivo académico\n\nContenido previo a la evaluación.'}),201).body;status(await f.api.post(`modules/${module.id}/publish`),200);status(await f.api.post(`materials/${material.id}/publish`),200);const form=await quizCreate(teacher,e,'Quiz ciclo completo',f.course,f.section),q=await createInBrowser(teacher,form);await editor(teacher,e,q.id,f.course);await publishInBrowser(teacher);const items=await weights(e,f.course,f.actor,slug);expect(items).toHaveLength(1);expect(items[0].weightPercent).toBe(100);
 const student=await actorPage(f.student,slug);await go(student,f.course,'/modules');await student.locator(`#module-${module.id} button.module-collapse`).click();await student.locator(`a[href$="/materials/${material.id}"]`).click();await expect(student.getByRole('heading',{name:'Objetivo académico',exact:true})).toBeVisible();const {a}=await startInBrowser(student,e,q.id,f.course),safe=status(await (await e.api(f.student,slug)).get(`quiz-attempts/${a.id}/questions`),200).body;await choose(student,[{questionId:safe.questions[0].id,alternativeId:safe.questions[0].alternatives[0].id}]);await confirm(student,'Enviar intento','Enviar intento');await expect(student.getByRole('heading',{name:'Intento enviado',exact:true})).toBeVisible();expect(status(await f.api.get(`quiz-attempts/${a.id}`),200).body.grade).toBe(4);await book(teacher,e,f.course);await publicationSelection(teacher,{gradeItemIds:items.map((i:any)=>i.gradeItemId),sectionIds:[f.section],studentIds:[e.data.actors[f.student].id]});expect((await publishGradesInBrowser(teacher)).status()).toBe(200);await go(student,f.course,'/grades');await expect(student.getByRole('heading',{name:'Promedio parcial',exact:true})).toBeVisible();const d=status(await (await e.api(f.student,slug)).get(`courses/${f.course}/my-grades`),200).body;expect(d).toMatchObject({partialAverage:4,publishedWeightPercent:100,isPartial:true});expect(d.items).toHaveLength(1);expect(d.items[0].grade).toBe(4);
});
test('E2E-GRADE-022 empty and incomplete publication rectangles persist nothing / rectangle @regression',async({e,actorPage})=>{
 await e.graded();const api=await e.api('AO'),c=e.data.courses.C1,before=await securitySnapshot(e);for(const field of ['gradeItemIds','sectionIds','studentIds'])status(await api.post(pub(c),{...e.selection(),[field]:[]},e.key()),400);status(await api.post(pub(c),{...e.selection(),gradeItemIds:[e.id('item/Q1'),e.id('item/Q2')]},e.key()),409);expect(await securitySnapshot(e)).toEqual(before);const p=await actorPage('AO');await book(p,e);await p.getByRole('button',{name:'Publicar notas',exact:true}).click();await expect(p.getByRole('button',{name:'Revisar publicación',exact:true})).toBeDisabled();
});
test('E2E-GRADE-023 active newer attempt blocks publication until explicitly cancelled / active-attempt @regression',async({e,actorPage})=>{
 await e.graded();const a=await e.attempt(),api=await e.api('AO'),c=e.data.courses.C1,before=await securitySnapshot(e);status(await api.post(pub(c),e.selection(),e.key()),409);expect(await securitySnapshot(e)).toEqual(before);status(await (await e.api('ST1')).post(`quiz-attempts/${a.id}/cancel`),204);status(await api.post(pub(c),e.selection(),e.key()),200);const p=await actorPage('AO');await book(p,e);expect(await e.count('grades','published_at IS NOT NULL')).toBe(1);
});
test('E2E-GRADE-024 publication requires total one hundred and uses latest graded attempt / latest-weights @regression',async({e,actorPage})=>{
 const f=await freshCourse(e),q=await draft(e,{sectionId:f.section},'AO','uc',f.course);status(await f.api.post(`quizzes/${q.id}/publish`),200);await e.graded('ST1',[true,true],q.id,f.section);const latest=await e.graded('ST1',[false,false],q.id,f.section),items=await weights(e,f.course),selection={gradeItemIds:items.map((i:any)=>i.gradeItemId),sectionIds:[f.section],studentIds:[e.data.actors.ST1.id]},before=await securitySnapshot(e);status(await f.api.post(pub(f.course),selection,e.key()),409);expect(await securitySnapshot(e)).toEqual(before);expect(items).toHaveLength(1);expect(items[0].weightPercent).toBe(100);status(await f.api.post(pub(f.course),selection,e.key()),200);expect((await e.pool.query('SELECT attempt_id,grade_value FROM grades WHERE quiz_id=$1',[q.id])).rows).toEqual([{attempt_id:latest.id,grade_value:'1.0'}]);const p=await actorPage('AO');await book(p,e,f.course);await expect(p.getByRole('table')).toContainText('1');
});
test('E2E-GRADE-025 replay canonicalizes reordered selections and preserves receipt / canonical-replay @regression',async({e,actorPage})=>{
 const api=await e.api('AO');status(await api.post(`sections/${e.data.sections.S1}/enrollments`,{userId:e.data.actors.ST2.id,role:'student'}),201);for(const actor of ['ST1','ST2']){await e.graded(actor);await e.graded(actor,[true,true],e.data.quizzes.Q2);}const c=e.data.courses.C1,key=e.key(),selection={...e.selection(),gradeItemIds:[e.id('item/Q1'),e.id('item/Q2')],studentIds:[e.data.actors.ST1.id,e.data.actors.ST2.id]},r=status(await api.post(pub(c),selection,key),200).body,before=await securitySnapshot(e);expect(status(await api.post(pub(c),{...selection,gradeItemIds:[...selection.gradeItemIds].reverse(),studentIds:[...selection.studentIds].reverse()},key),200).body).toEqual(r);expect(await securitySnapshot(e)).toEqual(before);expect(r.publishedCount).toBe(4);await book(await actorPage('AO'),e);
});
test('E2E-GRADE-026 reused publication key with changed selection conflicts / key-conflict @regression',async({e,actorPage})=>{
 await e.graded();await e.graded('ST1',[true,true],e.data.quizzes.Q2);const api=await e.api('AO'),c=e.data.courses.C1,key=e.key();status(await api.post(pub(c),e.selection(),key),200);const f=await freshCourse(e),q=await draft(e,{sectionId:f.section},'AO','uc',f.course);status(await f.api.post(`quizzes/${q.id}/publish`),200);const ids=await weights(e,f.course),before=await securitySnapshot(e);const r=status(await api.post(pub(c),e.selection('Q2'),key),409);expect(r.body.code).toBe('IDEMPOTENCY_CONFLICT');expect(status(await api.post(pub(f.course),{gradeItemIds:ids.map((i:any)=>i.gradeItemId),sectionIds:[f.section],studentIds:[e.data.actors.ST1.id]},key),409).body.code).toBe('IDEMPOTENCY_CONFLICT');expect(await securitySnapshot(e)).toEqual(before);await book(await actorPage('AO'),e);
});
test('E2E-GRADE-027 new key cannot republish immutable published grade / already-published @regression',async({e,actorPage})=>{
 await e.graded();await e.publish();const before=await securitySnapshot(e),r=status(await (await e.api('AO')).post(pub(e.data.courses.C1),e.selection(),e.key()),409);expect(r.body.code).toBe('GRADE_ALREADY_PUBLISHED');expect(await securitySnapshot(e)).toEqual(before);const p=await actorPage('AO');await book(p,e);await expect(p.getByRole('button',{name:'Publicar notas',exact:true})).toBeDisabled();
});
test('E2E-GRADE-028 concurrent publication keys yield one receipt and one conflict / double-publish @extended',async({e,actorPage})=>{
 await e.graded();const api=await e.api('AO'),other=await e.api('T1'),c=e.data.courses.C1,rs=await Promise.all([api.post(pub(c),e.selection(),e.key()),other.post(pub(c),e.selection(),e.key())]);expect(rs.map(r=>r.status).sort()).toEqual([200,409]);expect(await e.count('grade_publications')).toBe(1);expect(await e.events('grade.published')).toHaveLength(1);await book(await actorPage('AO'),e);
});
test('E2E-GRADE-029 lost publication response preserves exact selection body and key / uncertain-publication @extended',async({e,actorPage})=>{
 await e.graded();const p=await actorPage('AO');await book(p,e);await publicationSelection(p,e.selection());const requests:any[]=[];await p.route('**/publications',async route=>{requests.push({key:await route.request().headerValue('idempotency-key'),body:route.request().postDataJSON()});const r=await route.fetch();if(requests.length===1)await route.abort('failed');else await route.fulfill({response:r});});await p.getByRole('button',{name:'Confirmar publicación',exact:true}).click();await expect(p.getByRole('button',{name:'Repetir operación exacta',exact:true})).toBeVisible();await p.evaluate(()=>window.dispatchEvent(new Event('focus')));expect(requests).toHaveLength(1);await p.getByRole('button',{name:'Repetir operación exacta',exact:true}).click();await expect(p.locator('.content-notice')).toContainText('Notas publicadas correctamente');expect(requests).toHaveLength(2);expect(requests[0]).toEqual(requests[1]);expect(await e.count('grade_publications')).toBe(1);
});
test('E2E-GRADE-030 definitive publication conflict releases correction selection / definitive-rejection @extended',async({e,actorPage})=>{
 await e.graded();const p=await actorPage('AO');await book(p,e);await publicationSelection(p,e.selection());await e.publish();const before=await securitySnapshot(e);expect((await publishGradesInBrowser(p)).status()).toBe(409);await expect(p.locator('.content-notice-error')).toContainText('notas ya publicadas');await p.getByRole('button',{name:'Publicar notas',exact:true}).click();await expect(p.getByRole('dialog',{name:'Publicar notas',exact:true})).toBeVisible();expect(await securitySnapshot(e)).toEqual(before);
});
test('E2E-GRADE-031 reload loses volatile publication recovery but reads actual published state / reload-publication @extended',async({e,actorPage})=>{
 await e.graded();const p=await actorPage('AO');await book(p,e);await publicationSelection(p,e.selection());let posts=0;await p.route('**/publications',async route=>{posts++;expect((await route.fetch()).status()).toBe(200);await route.abort('failed');});await p.getByRole('button',{name:'Confirmar publicación',exact:true}).click();await expect(p.getByRole('button',{name:'Repetir operación exacta',exact:true})).toBeVisible();p.on('dialog',d=>d.accept());await p.reload();await login(p,e,'AO','uc',`/courses/${e.data.courses.C1}/gradebook`);await expect(p.getByRole('button',{name:'Publicar notas',exact:true})).toBeDisabled();await expect(p.getByRole('button',{name:'Repetir operación exacta',exact:true})).toHaveCount(0);expect(posts).toBe(1);expect(await e.count('grade_publications')).toBe(1);
});
test('E2E-GRADE-032 revoked teacher cannot retrieve private receipt through replay / revoked-replay @extended',async({e,actorPage})=>{
 await e.graded();const api=await e.api('T1'),c=e.data.courses.C1,key=e.key();status(await api.post(pub(c),e.selection(),key),200);status(await (await e.api('AO')).patch(`sections/${e.data.sections.S1}/enrollments/${e.id('enrollment/S1/T1/teacher')}`,{active:false}),200);const before=await securitySnapshot(e);expect([403,404]).toContain((await api.post(pub(c),e.selection(),key)).status);expect(await securitySnapshot(e)).toEqual(before);const p=await actorPage('AO');await book(p,e);expect(await e.count('grade_publications')).toBe(1);
});

test('E2E-GRADE-028 browser double click sends one publication / double-click @extended',async({e,actorPage})=>{
 await e.graded();const p=await actorPage('AO');await book(p,e);await publicationSelection(p,e.selection());let posts=0;await p.route('**/publications',async route=>{posts++;const r=await route.fetch();await route.fulfill({response:r});});await p.getByRole('button',{name:'Confirmar publicación',exact:true}).dblclick();await expect(p.locator('.content-notice')).toContainText('Notas publicadas correctamente');expect(posts).toBe(1);expect(await e.count('grade_publications')).toBe(1);expect(await e.events('grade.published')).toHaveLength(1);
});
