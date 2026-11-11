import {test,expect} from '../fixtures/test.ts';
import {status} from '../helpers/api.ts';
import {go,compatibilityNavigate} from '../helpers/browser.ts';
import {securitySnapshot} from '../helpers/security.ts';
import {questions,draft,editor,quizCreate,createInBrowser,publishInBrowser} from '../helpers/academic.ts';

for(const actor of ['AO','T1','T2','AS1','ST1'])test(`E2E-QUIZ-001 quiz listing and safe detail by role / ${actor} @regression`,async({e,actorPage})=>{
 const p=await actorPage(actor),api=await e.api(actor);await go(p,e.data.courses.C1,'/quizzes');const rows=status(await api.get(`courses/${e.data.courses.C1}/quizzes`),200).body.items;expect(rows).toHaveLength(({AO:7,T1:6,T2:2,AS1:5,ST1:5} as Record<string,number>)[actor]);await expect(p.getByRole('region',{name:'Quizzes del curso'}).getByRole('listitem')).toHaveCount(rows.length);
 for(const q of rows){const safe=status(await api.get(`quizzes/${q.id}`),200).body;expect(JSON.stringify(safe)).not.toContain('isCorrect');expect(safe.courseId).toBe(e.data.courses.C1);}expect(rows.some((q:any)=>q.id===e.data.quizzes.QD)).toBe(['AO','T1'].includes(actor));
});
test('E2E-QUIZ-002 filters operate locally and clear restores collection / local-filters @regression',async({e,actorPage})=>{
 const p=await actorPage('T1');await go(p,e.data.courses.C1,'/quizzes');const list=p.getByRole('region',{name:'Quizzes del curso'});await expect(list.getByRole('listitem')).toHaveCount(6);let calls=0;p.on('request',r=>{if(r.url().includes('/api/v1/')&&r.url().includes('/quizzes')&&r.method()==='GET')calls++;});await p.getByRole('searchbox',{name:'Buscar quiz'}).fill('no matching title');await expect(list.getByRole('listitem')).toHaveCount(0);await p.getByRole('button',{name:'Mostrar todos los quizzes'}).click();await p.getByRole('combobox',{name:'Estado',exact:true}).selectOption('draft');await expect(list.getByRole('listitem')).toHaveCount(1);await p.getByRole('button',{name:'Limpiar filtros'}).click();await p.getByRole('combobox',{name:'Destinatarios',exact:true}).selectOption('course');await expect(list.getByRole('listitem')).toHaveCount(1);await p.getByRole('button',{name:'Limpiar filtros'}).click();await expect(list.getByRole('listitem')).toHaveCount(6);expect(calls).toBe(0);
});
test('E2E-QUIZ-003 empty course and absent instructions / empty-instructions @regression',async({e,actorPage})=>{
 const q=await draft(e,{instructions:null});status(await (await e.api()).post(`quizzes/${q.id}/publish`),200);const p=await actorPage('ST1');await go(p,e.data.courses.CEMPTY,'/quizzes');await expect(p.getByText('Los quizzes publicados para tu sección aparecerán aquí',{exact:true})).toBeVisible();await compatibilityNavigate(p,`/courses/${e.data.courses.C1}/quizzes/${q.id}`);await expect(p.getByText('Este quiz no tiene instrucciones adicionales.',{exact:true})).toBeVisible();
});
for(const actor of ['T1','AS1','ST1'])test(`E2E-QUIZ-004 authoring view respects role and draft privacy / ${actor} @regression`,async({e,actorPage})=>{
 const p=await actorPage(actor),api=await e.api(actor),teacher=actor==='T1';const r=status(await api.get(`quizzes/${e.data.quizzes.Q1}/authoring`),teacher?200:403);if(teacher)expect(r.body.questions[0].alternatives.some((a:any)=>a.isCorrect)).toBe(true);else status(await api.get(`quizzes/${e.data.quizzes.QD}`),404);
 await go(p,e.data.courses.C1,'/quizzes');
 await expect(p.getByRole('link',{name:'Crear quiz',exact:true})).toHaveCount(teacher ? 1 : 0);
 if (!teacher) {
   await compatibilityNavigate(p,`/courses/${e.data.courses.C1}/quizzes/new`);
   await expect(p.getByRole('alert')).toBeVisible();
   await expect(p.getByRole('form',{name:'Crear quiz'})).toHaveCount(0);
 }
 await compatibilityNavigate(p,`/courses/${e.data.courses.C1}/quizzes/${e.data.quizzes.Q1}/authoring`);if(teacher){await expect(p.getByLabel('Título del quiz',{exact:true})).toBeDisabled();await expect(p.getByRole('button',{name:'Guardar borrador'})).toHaveCount(0);}else await expect(p.getByRole('form',{name:'Editar quiz'})).toHaveCount(0);
 if (teacher) {
   const otherTenant = await actorPage('MULTI', 'utfsm');
   await compatibilityNavigate(otherTenant, `/courses/${e.data.courses.C1}/quizzes/new`);
   await expect(otherTenant.getByRole('alert')).toBeVisible();
   await expect(otherTenant.getByRole('form', { name: 'Crear quiz' })).toHaveCount(0);
 }

});
test('E2E-QUIZ-005 browser creates draft with server question UUIDs / create @regression',async({e,actorPage})=>{
 const p = await actorPage('T1');
 await p.setViewportSize({ width: 1440, height: 1100 });
 const form = await quizCreate(p,e);
 const title = form.getByLabel('Título del quiz', { exact: true });
 await expect(p).toHaveURL(/\/quizzes\/new$/);
 await expect(p.getByRole('navigation', { name: 'Ruta de navegación' })).toContainText('Crear quiz');
 expect(await p.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true })))).toBe(true);
 await p.getByRole('link', { name: 'Volver a quizzes' }).click();
 const leave = p.getByRole('dialog', { name: '¿Salir del formulario?' });
 await expect(leave.getByRole('button', { name: 'Seguir editando' })).toBeFocused();
 await p.keyboard.press('Escape');
 await expect(title).toHaveValue('Quiz navegador F5');
 const back = p.goBack({ waitUntil: 'commit' });
 await expect(leave).toBeVisible();
 await leave.getByRole('button', { name: 'Salir del formulario' }).click();
 await back;
 await expect(p.getByRole('heading', { name: 'Quizzes', exact: true })).toBeVisible();

 await p.getByRole('searchbox', { name: 'Buscar quiz' }).fill('título que no coincide');
 await p.getByRole('combobox', { name: 'Estado', exact: true }).selectOption('closed');
 await p.getByRole('link', { name: 'Crear quiz', exact: true }).click();
 await p.getByRole('link', { name: 'Volver a quizzes' }).click();
 await expect(p.getByRole('searchbox', { name: 'Buscar quiz' })).toHaveValue('título que no coincide');
 await p.getByRole('link', { name: 'Crear quiz', exact: true }).click();
 await title.fill('Quiz navegador F5');
 await form.getByLabel('Instrucciones (opcional)').fill('Selecciona una respuesta por pregunta.');
 for (const [index, prompt] of ['¿Qué representa la mediana?', '¿Cuál es una medida de dispersión?'].entries()) {
   await form.getByRole('button', { name: 'Agregar pregunta', exact: true }).click();
   const question = form.getByRole('group', { name: `Pregunta ${index + 1}`, exact: true });
   await question.getByLabel('Enunciado', { exact: true }).fill(prompt);
   await question.getByLabel('Alternativa A', { exact: true }).fill(index === 0 ? 'El valor central' : 'La desviación estándar');
   await question.getByLabel('Alternativa B', { exact: true }).fill(index === 0 ? 'El valor máximo' : 'La mediana');
   await question.getByRole('radio', { name: `Marcar alternativa A como correcta en pregunta ${index + 1}` }).check();
 }
 await title.focus();
 if (process.env.ACADEMIX_QUIZ_CAPTURE === '1') {
   await p.screenshot({ path: test.info().outputPath('quiz-escritorio.png'), animations: 'disabled' });
 }
 await p.setViewportSize({ width: 390, height: 844 });
 const first = form.getByRole('group', { name: 'Pregunta 1', exact: true });
 const mobileOption = first.getByLabel('Alternativa B', { exact: true });
 await mobileOption.fill('');
 await mobileOption.press('Tab');
 await expect(first.getByText('Escribe esta alternativa.')).toBeVisible();
 await first.evaluate(question => {
   question.scrollIntoView({ block: 'start' });
   question.closest('main')?.scrollBy(0, -16);
 });
 expect(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
 if (process.env.ACADEMIX_QUIZ_CAPTURE === '1') {
   await p.screenshot({ path: test.info().outputPath('quiz-movil.png'), animations: 'disabled' });
 }
 await mobileOption.fill('El valor máximo');
 let failNextList = false;
 await p.route('**/api/v1/institution/*/courses/*/quizzes', async route => {
   if (route.request().method() === 'POST') failNextList = true;
   else if (failNextList && route.request().method() === 'GET') {
     failNextList = false;
     return route.fulfill({ status: 503, json: {} });
   }
   await route.continue();
 });
 const q = await createInBrowser(p, form);
 await expect(p.getByRole('link', { name: 'Editar borrador', exact: true })).toHaveAttribute('href', new RegExp(q.id));
 await p.getByRole('button', { name: 'Reintentar', exact: true }).click();
 const toast = p.locator('.content-notice');
 await expect(toast).toHaveText('Borrador creado.');
 const toastPosition = await toast.evaluate(node => {
   const box = node.getBoundingClientRect();
   return { right: innerWidth - box.right, bottom: innerHeight - box.bottom };
 });
 expect(toastPosition.right).toBeLessThan(36);
 expect(toastPosition.bottom).toBeLessThan(36);
 if (process.env.ACADEMIX_QUIZ_CAPTURE === '1') {
   await p.screenshot({ path: test.info().outputPath('quiz-toast-movil-claro.png'), animations: 'disabled' });
 }
 await expect(toast).toHaveCount(0, { timeout: 7000 });
 const api = await e.api();
 expect(q).toMatchObject({ status: 'draft', sectionId: e.data.sections.S1 });
 expect(q.questions).toHaveLength(2);
 for (const question of q.questions) expect(question.id).toMatch(/^[a-f0-9-]{36}$/);
 expect(await e.count('grade_items','quiz_id=$1',[q.id])).toBe(0);
 expect(await e.events('quiz.created',q.id)).toHaveLength(1);
 expect(status(await api.get(`quizzes/${q.id}/authoring`),200).body.questions).toEqual(q.questions);
 await expect(p.getByRole('searchbox', { name: 'Buscar quiz' })).toHaveValue('título que no coincide');
 await expect(p.getByRole('combobox', { name: 'Estado', exact: true })).toHaveValue('closed');
 await expect(p.getByText('«Quiz navegador F5» no coincide con los filtros.')).toBeVisible();
 await expect(p.getByRole('link', { name: 'Editar borrador', exact: true })).toBeVisible();
 await p.getByRole('link', { name: 'Editar borrador', exact: true }).click();
 await expect(p.getByRole('heading', { name: 'Quiz navegador F5', exact: true })).toBeVisible();
});
test('E2E-QUIZ-006 edit and reorder preserve existing question identities / stable-question-ids @regression',async({e,actorPage})=>{
 const p = await actorPage('T1'), api = await e.api(), q = e.data.quizzes.QD;
 const before = status(await api.get(`quizzes/${q}/authoring`),200).body;
 const f = await editor(p,e);
 const save = p.getByRole('button', { name: 'Guardar borrador', exact: true });
 await expect(save).toBeDisabled();
 await expect(p.getByText(/Publica cuando hayas revisado|No hay cambios para guardar/)).toHaveCount(0);
 if (process.env.ACADEMIX_QUIZ_CAPTURE === '1') {
   await p.setViewportSize({ width: 1440, height: 1100 });
   await p.getByRole('button', { name: 'Cambiar tema' }).click();
   await expect(p.locator('html')).toHaveAttribute('data-theme', 'dark');
   const title = f.getByLabel('Título del quiz', { exact: true });
   const original = await title.inputValue();
   await title.fill('');
   await f.getByLabel('Instrucciones (opcional)').focus();
   await expect(f.getByText('Escribe el título del quiz.')).toBeVisible();
   await p.screenshot({ path: test.info().outputPath('quiz-edicion-escritorio-oscuro.png'), animations: 'disabled' });
   await title.fill(original);
   await expect(save).toBeDisabled();
   await p.setViewportSize({ width: 390, height: 844 });
   await title.evaluate(element => element.scrollIntoView({ block: 'center' }));
   await expect(save).toBeInViewport();
   await p.screenshot({ path: test.info().outputPath('quiz-guardar-movil.png'), animations: 'disabled' });
   await p.setViewportSize({ width: 1440, height: 1100 });
 }
 const second = f.getByRole('group', { name: 'Pregunta 2', exact: true });
 await second.getByLabel('Enunciado', { exact: true }).fill('');
 await second.getByLabel('Puntaje', { exact: true }).focus();
 await expect(second.getByText('Escribe el enunciado.')).toBeVisible();
 if (process.env.ACADEMIX_QUIZ_CAPTURE === '1') {
   await p.setViewportSize({ width: 390, height: 844 });
   await second.evaluate(question => question.scrollIntoView({ block: 'start' }));
   expect(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
   await p.screenshot({ path: test.info().outputPath('quiz-edicion-movil-oscuro.png'), animations: 'disabled' });
   await p.setViewportSize({ width: 1440, height: 1100 });
 }
 await second.getByRole('button', { name: 'Subir pregunta 2', exact: true }).click();
 await expect(save).toBeEnabled();
 const first = f.getByRole('group', { name: 'Pregunta 1', exact: true });
 await expect(first.getByText('Escribe el enunciado.')).toBeVisible();
 await expect(second.getByText('Escribe el enunciado.')).toHaveCount(0);
 await first.getByLabel('Enunciado', { exact: true }).fill('Reordenada');
 await expect(first.getByText('Escribe el enunciado.')).toHaveCount(0);
 await first.getByRole('button', { name: 'Agregar alternativa a pregunta 1' }).click();
 await first.getByLabel('Alternativa C', { exact: true }).fill('Tercera');
 await first.getByRole('radio', { name: 'Marcar alternativa C como correcta en pregunta 1' }).check();
 await first.getByRole('button', { name: 'Eliminar alternativa C de pregunta 1' }).click();
 await expect(first.getByText('Selecciona una respuesta correcta para esta pregunta.')).toBeVisible();
 const correctIndex = before.questions[1].alternatives.findIndex((option: { isCorrect: boolean }) => option.isCorrect);
 await first.getByRole('radio', { name: `Marcar alternativa ${String.fromCharCode(65 + correctIndex)} como correcta en pregunta 1` }).check();
 await expect(first.getByText('Selecciona una respuesta correcta para esta pregunta.')).toHaveCount(0);
 await first.getByRole('button', { name: 'Agregar alternativa a pregunta 1' }).click();
 await first.getByLabel('Alternativa C', { exact: true }).fill('Tercera');
 await f.getByRole('button', { name: 'Agregar pregunta', exact: true }).click();
 await f.getByRole('button', { name: 'Eliminar pregunta 3', exact: true }).click();
 await expect(f.getByRole('group', { name: 'Pregunta 3', exact: true })).toHaveCount(0);
 await p.getByRole('link', { name: 'Volver al detalle del quiz' }).click();
 await p.getByRole('button', { name: 'Seguir editando' }).click();
 await expect(first.getByLabel('Enunciado', { exact: true })).toHaveValue('Reordenada');
 const pending = p.waitForResponse(r => r.url().endsWith('/quizzes/'+q) && r.request().method()==='PATCH');
 await save.click();
 expect((await pending).status()).toBe(200);
 await expect(save).toBeDisabled();
 const after = status(await api.get(`quizzes/${q}/authoring`),200).body;
 expect(after.questions.map((x:any)=>x.id)).toEqual(before.questions.map((x:any)=>x.id).reverse());
 expect(after.questions.map((x:any)=>x.position)).toEqual([1,2]);
 expect(after.questions[0]).toMatchObject({prompt:'Reordenada',alternatives:expect.arrayContaining([expect.objectContaining({text:'Tercera'})])});
 expect(after.questions[0].alternatives.find((a:any)=>a.isCorrect).id).toBe(before.questions[1].alternatives.find((a:any)=>a.isCorrect).id);
});
test('E2E-QUIZ-007 minimal PATCH retains microsecond timestamps and unlimited attempts / precision @regression',async({e,actorPage})=>{
 const q=await draft(e,{opensAt:'2027-01-01T00:00:00.123456-03:00',closesAt:'2027-01-02T00:00:00.654321-03:00',maxAttempts:null}),p=await actorPage('T1'),f=await editor(p,e,q.id);const sql=()=>e.pool.query("SELECT to_char(opens_at,'YYYY-MM-DD HH24:MI:SS.US') o,to_char(closes_at,'YYYY-MM-DD HH24:MI:SS.US') c,max_attempts FROM quizzes WHERE id=$1",[q.id]),before=(await sql()).rows;await f.getByLabel('Título del quiz',{exact:true}).fill('Precisión conservada');const pending=p.waitForResponse(r=>r.url().endsWith('/quizzes/'+q.id)&&r.request().method()==='PATCH');await p.getByRole('button',{name:'Guardar borrador'}).click();const r=await pending;expect(r.status()).toBe(200);expect(r.request().postDataJSON()).toEqual({title:'Precisión conservada'});expect((await sql()).rows).toEqual(before);
});
test('E2E-QUIZ-008 invalid alternatives reject without persistence and UI recovers / alternatives @extended',async({e,actorPage})=>{
 const api=await e.api(),p=await actorPage('T1'),f=await quizCreate(p,e),before=await securitySnapshot(e);
 const cases:any[]=[];for(const flags of [[false,false],[true,true]]){const qs=questions();qs[0].alternatives.forEach((a,i)=>a.isCorrect=flags[i]);cases.push([qs,422]);}const one=questions();one[0].alternatives.pop();cases.push([one,422]);const dup=questions();dup[0].alternatives[1].id='a';cases.push([dup,422]);const blank=questions();blank[0].prompt=' ';cases.push([blank,422]);const typed:any=questions();typed[0].alternatives[0].isCorrect='true';cases.push([typed,400]);for(const [qs,code] of cases)status(await api.post(`courses/${e.data.courses.C1}/quizzes`,{title:'Invalid',sectionId:e.data.sections.S1,questions:qs}),code);expect(await securitySnapshot(e)).toEqual(before);
 const first = f.getByRole('group', { name: 'Pregunta 1', exact: true });
 await first.getByRole('radio', { name: 'Marcar alternativa B como correcta en pregunta 1' }).check();
 const option = first.getByLabel('Alternativa B', { exact: true });
 await option.fill('');
 await expect(first.getByText('Escribe esta alternativa.')).toHaveCount(0);
 await option.press('Tab');
 await expect(first.getByText('Escribe esta alternativa.')).toBeVisible();
 await p.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
 expect(await securitySnapshot(e)).toEqual(before);
 await option.fill('Recuperada');
 await expect(first.getByText('Escribe esta alternativa.')).toHaveCount(0);
 await createInBrowser(p, f);
});
test('E2E-QUIZ-009 point position and UUID boundaries are atomic / points-ids @extended',async({e,actorPage})=>{
 const p=await actorPage('T1'),api=await e.api(),q=e.data.quizzes.QD;await editor(p,e);const before=await securitySnapshot(e);const invalid:any[]=[];for(const points of [0,-1,0.001,999999.99]){const qs=questions();qs[0].points=points;invalid.push([qs,422]);}for(const pos of [0,2]){const qs=questions();qs[0].position=pos;invalid.push([qs,422]);}for(const id of [e.id('invented'), 'bad']){const qs:any=questions();qs[0].id=id;invalid.push([qs,id==='bad'?400:422]);}const old=status(await api.get(`quizzes/${q}/authoring`),200).body.questions;invalid.push([[old[0],{...old[1],id:old[0].id}],422]);for(const [qs,code] of invalid)status(await api.patch(`quizzes/${q}`,{questions:qs}),code);expect(await securitySnapshot(e)).toEqual(before);const tiny=questions([0.01,0.01]);expect(status(await api.patch(`quizzes/${q}`,{questions:tiny}),200).body.questions[0].points).toBe(0.01);
});
test('E2E-QUIZ-010 strict date calendar and attempt limit validation / dates-limits @extended',async({e,actorPage})=>{
 const p=await actorPage('T1'),api=await e.api(),q=e.data.quizzes.QD;
 const form = await editor(p,e);
 const opening = form.getByLabel('Apertura', { exact: true });
 const closing = form.getByLabel('Cierre', { exact: true });
 await opening.fill('2027-01-02T09:00');
 await closing.fill('2027-01-02T08:00');
 await form.getByLabel('Máximo de intentos').focus();
 await expect(closing).toHaveAttribute('aria-invalid', 'true');
 await opening.fill('2027-01-02T07:00');
 await expect(closing).not.toHaveAttribute('aria-invalid', 'true');
 const before=await securitySnapshot(e);for(const opensAt of ['2027-02-30T00:00:00Z','0000-01-01T00:00:00Z','2027-01-01T00:00:00'])status(await api.patch(`quizzes/${q}`,{opensAt}),400);status(await api.patch(`quizzes/${q}`,{opensAt:'2027-01-01T00:00:00Z',closesAt:'2027-01-01T00:00:00Z'}),422);for(const maxAttempts of [0,1.5])status(await api.patch(`quizzes/${q}`,{maxAttempts}),422);status(await api.patch(`quizzes/${q}`,{maxAttempts:'1'}),400);expect(await securitySnapshot(e)).toEqual(before);for(const maxAttempts of [1,null])expect(status(await api.patch(`quizzes/${q}`,{maxAttempts}),200).body.maxAttempts).toBe(maxAttempts);
});
test('E2E-QUIZ-011 draft destination moves author visibility without exposing questions in audit / move-destination @regression',async({e,actorPage})=>{
 const p=await actorPage('AO'),q=e.data.quizzes.QD,f=await editor(p,e);await f.getByRole('combobox',{name:'Destinatarios',exact:true}).selectOption(e.data.sections.S2);const pending=p.waitForResponse(r=>r.url().endsWith('/quizzes/'+q)&&r.request().method()==='PATCH');await p.getByRole('button',{name:'Guardar borrador'}).click();expect((await pending).status()).toBe(200);status(await (await e.api('T1')).get(`quizzes/${q}`),404);expect(status(await (await e.api('T2')).get(`quizzes/${q}/authoring`),200).body.sectionId).toBe(e.data.sections.S2);const events=await e.events('quiz.updated',q);expect(events).toHaveLength(1);expect(events[0].section_id).toBeNull();expect(JSON.stringify(events[0].changes)).not.toContain('isCorrect');
});
test('E2E-QUIZ-012 UTF8 body budget rejects locally and remotely / utf8-budget @extended',async({e,actorPage})=>{
 const p=await actorPage('T1'),api=await e.api(),f=await quizCreate(p,e),before=await securitySnapshot(e);status(await api.post(`courses/${e.data.courses.C1}/quizzes`,{title:'Oversize',sectionId:e.data.sections.S1,instructions:'界'.repeat(1400),questions:questions()}),413);let posts=0;p.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/quizzes'))posts++;});await f.getByLabel('Instrucciones (opcional)',{exact:true}).fill('界'.repeat(1400));await p.getByRole('button',{name:'Guardar borrador',exact:true}).click();await expect(f.getByRole('alert')).toBeVisible();expect(posts).toBe(0);expect(await securitySnapshot(e)).toEqual(before);await f.getByLabel('Instrucciones (opcional)',{exact:true}).fill('Breve');await createInBrowser(p, f);
});
test('E2E-QUIZ-013 lost creation response locks form and observes candidates without retry / uncertain-create @extended',async({e,actorPage})=>{
 const p=await actorPage('T1'),f=await quizCreate(p,e,'Creación incierta');let posts=0;await p.route('**/courses/*/quizzes',async route=>{if(route.request().method()!=='POST')return route.continue();posts++;const r=await route.fetch();expect(r.status()).toBe(201);await route.abort('failed');});await p.getByRole('button',{name:'Guardar borrador',exact:true}).click();await expect(f.getByRole('alert')).toContainText('Resultado incierto');await expect(f.getByLabel('Título del quiz',{exact:true})).toBeDisabled();await expect(p.getByRole('link',{name:'Creación incierta',exact:true})).toBeVisible();await p.evaluate(()=>window.dispatchEvent(new Event('focus')));expect(posts).toBe(1);expect(await e.count('quizzes',"title='Creación incierta'")).toBe(1);expect((await e.events('quiz.created')).filter(x=>x.changes.after.title==='Creación incierta')).toHaveLength(1);
});
test('E2E-QUIZ-014 publication creates unique zero weight item and locks authoring / publish @smoke',async({e,actorPage})=>{
 const p=await actorPage('T1'),q=await draft(e);await editor(p,e,q.id);const r=await publishInBrowser(p);expect(r.request().postData()).toBeNull();await expect(p).toHaveURL(new RegExp(`/quizzes/${q.id}(?:\\?|$)`));await expect(p.locator('.content-notice')).toHaveText('Quiz publicado.');await expect(p.getByRole('link',{name:'Ver pauta'})).toBeVisible();const rows=(await e.pool.query('SELECT weight_percent FROM grade_items WHERE quiz_id=$1',[q.id])).rows;expect(rows).toEqual([{weight_percent:'0.00'}]);expect(await e.events('quiz.published',q.id)).toHaveLength(1);
});
test('E2E-QUIZ-015 publication replay after a grade is published is a no-op / publish-replay @regression',async({e,actorPage})=>{
 const api=await e.api('AO'),p=await actorPage('AO'),q=e.data.quizzes.QD;status(await api.post(`quizzes/${q}/publish`),200);await e.graded();await e.publish();const before=await securitySnapshot(e);status(await api.post(`quizzes/${q}/publish`),200);expect(await securitySnapshot(e)).toEqual(before);await editor(p,e,q);await expect(p.getByLabel('Título del quiz',{exact:true})).toBeDisabled();expect(await e.count('grade_items','quiz_id=$1',[q])).toBe(1);
});
test('E2E-QUIZ-016 published policy is immutable before any attempts / immutable @regression',async({e,actorPage})=>{
 const api=await e.api(),p=await actorPage('T1'),q=e.data.quizzes.Q1;await editor(p,e,q);const before=await securitySnapshot(e);for(const patch of [{title:'Changed'},{questions:questions()},{sectionId:null},{opensAt:'2027-01-01T00:00:00Z'},{maxAttempts:9}])status(await api.patch(`quizzes/${q}`,patch),409);expect(await securitySnapshot(e)).toEqual(before);expect(await e.count('quiz_attempts')).toBe(0);await expect(p.getByLabel('Título del quiz',{exact:true})).toBeDisabled();
});
test('E2E-QUIZ-017 empty quiz is rejected while valid quizzes can publish after a grade / empty-frozen @regression',async({e,actorPage})=>{
 const api=await e.api('AO'),empty=await draft(e,{questions:[]}),p=await actorPage('AO');await editor(p,e,empty.id);let publishes=0;p.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith(`/quizzes/${empty.id}/publish`))publishes++;});await p.getByRole('button',{name:'Publicar quiz',exact:true}).click();await expect(p.getByText('Agrega al menos una pregunta para publicar.').first()).toBeVisible();await expect(p.getByRole('dialog')).toHaveCount(0);expect(publishes).toBe(0);status(await api.post(`quizzes/${empty.id}/publish`),422);await e.graded();await e.publish();status(await api.post(`quizzes/${e.data.quizzes.QD}/publish`),200);expect(await e.count('grade_items','quiz_id=$1',[empty.id])).toBe(0);
});
test('E2E-QUIZ-018 quiz publication and first grade publication serialize without blocking new quizzes / publication-race @extended',async({e,actorPage})=>{
 const p=await actorPage('AO'),api=await e.api('AO'),q=e.data.quizzes.QD;await e.graded();await editor(p,e,q);const [quiz,grade]=await Promise.all([api.post(`quizzes/${q}/publish`),api.post(`courses/${e.data.courses.C1}/gradebook/publications`,e.selection(),e.key())]);status(quiz,200);status(grade,200);expect(await e.count('grade_items','quiz_id=$1',[q])).toBe(1);expect(await e.events('quiz.published',q)).toHaveLength(1);const frozen=await securitySnapshot(e);status(await api.post(`quizzes/${q}/publish`),200);expect(await securitySnapshot(e)).toEqual(frozen);
});
