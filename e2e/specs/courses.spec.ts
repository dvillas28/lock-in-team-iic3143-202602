import {test,expect} from '../fixtures/test.ts';
import {status} from '../helpers/api.ts';
import {course,go,compatibilityNavigate} from '../helpers/browser.ts';
import {fillCourse,period,submit,focus} from '../helpers/management.ts';
import {courseInput,securitySnapshot,deniedUI} from '../helpers/security.ts';

for(const actor of ['ST1','T1','AO'])test(`E2E-COURSE-001 catalogue follows current actor and tenant / ${actor} @smoke`,async ({e,actorPage})=>{
 const page=await actorPage(actor),api=await e.api(actor),expected=actor==='ST1'?['C1','CEMPTY']:actor==='T1'?['C1','C2','CEMPTY','COWNERST']:['C1','C2','CEMPTY'];
 const cards=page.locator('a.course-card');await expect(cards).toHaveCount(expected.length);
 expect(status(await api.get('courses'),200).body.items.map((c:any)=>c.id).sort()).toEqual(expected.map(a=>e.data.courses[a]).sort());
 for(const key of expected){const card=cards.filter({has:page.getByRole('heading',{name:'Curso E2E '+key,exact:true})});await expect(card).toContainText('E2E-'+key);await expect(card).toContainText('2026-2');}
 await course(page,e.data.courses.C1);await expect(page.getByRole('heading',{name:'Resumen del curso',exact:true})).toBeVisible();
 expect(status(await api.get(`courses/${e.data.courses.C1}`),200).body.createdBy).toBe(e.data.actors.AO.id);
 await page.getByRole('link',{name:'Mis cursos',exact:true}).click();await expect(page).toHaveURL(url=>url.pathname==='/courses');await course(page,e.data.courses.C1);
 await expect(page.locator('main')).toContainText(actor==='ST1'?'Estudiante':'Docente');
});
test('E2E-COURSE-002 empty directory remains empty after revalidation / empty @regression',async ({e,actorPage})=>{
 const page=await actorPage('MEMBER'),before=await securitySnapshot(e);await expect(page.getByRole('heading',{name:'Sin contenido para mostrar',exact:true})).toBeVisible();
 expect(status(await (await e.api('MEMBER')).get('courses'),200).body.items).toEqual([]);expect((await focus(page)).status()).toBe(200);
 await expect(page.locator('a.course-card')).toHaveCount(0);expect(await securitySnapshot(e)).toEqual(before);
});
for(const variant of ['malformed','missing'])test(`E2E-COURSE-003 invalid identifiers never retain previous course / ${variant} @extended`,async ({e,actorPage})=>{
 const page=await actorPage('ST1'),id=variant==='malformed'?'abc':e.id('absent-course');await course(page,e.data.courses.C1);
 status(await (await e.api('ST1')).get(`courses/${id}`),variant==='malformed'?400:404);
 await compatibilityNavigate(page,`/courses/${id}`);await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByRole('heading',{name:'Curso E2E C1',exact:true})).toHaveCount(0);
 await page.getByRole('link',{name:'Mis cursos',exact:true}).click();await expect(page).toHaveURL(url=>url.pathname==='/courses');await course(page,e.data.courses.C1);
});
test('E2E-COURSE-004 last course enrollment revocation removes its card / revoked @regression',async ({e,actorPage})=>{
 const graded=await e.graded(),page=await actorPage('ST1'),api=await e.api('ST1'),teacher=await e.api('T1');await course(page,e.data.courses.C1);
 const history=(await e.pool.query('SELECT * FROM grades ORDER BY id')).rows;
 status(await teacher.patch(`sections/${e.data.sections.S1}/enrollments/${e.id('enrollment/S1/ST1/student')}`,{active:false}),200);await focus(page);
 await page.getByRole('link',{name:'Mis cursos',exact:true}).click();await expect(page.locator(`a.course-card[href="/courses/${e.data.courses.C1}"]`)).toHaveCount(0);
 expect(status(await api.get('courses'),200).body.items.some((c:any)=>c.id===e.data.courses.C1)).toBe(false);status(await api.get(`courses/${e.data.courses.C1}`),404);
 await deniedUI(page,`/courses/${e.data.courses.C1}`);expect((await e.pool.query('SELECT * FROM grades ORDER BY id')).rows).toEqual(history);expect(await e.count('quiz_attempts',`id='${graded.id}'`)).toBe(1);
});
test('E2E-COURSE-005 directory loading failure and retry use current identity / recovery @regression',async ({e,actorPage})=>{
 const page=await actorPage('ST1');await course(page,e.data.courses.C1);const before=await securitySnapshot(e);
 let release!:()=>void,entered!:()=>void;const gate=new Promise<void>(r=>release=r),started=new Promise<void>(r=>entered=r);let gets=0;
 const path='**/api/v1/institution/uc/courses';
 await page.route(path,async route=>{gets++;expect(route.request().method()).toBe('GET');const actual=await route.fetch();expect(actual.status()).toBe(200);entered();await gate;await route.fulfill({status:503,contentType:'application/problem+json',body:JSON.stringify({status:503,title:'Unavailable'})});});
 try{await page.getByRole('link',{name:'Mis cursos',exact:true}).click();await started;await expect(page.getByRole('status').filter({hasText:'Cargando contenido'})).toBeVisible();release();await expect(page.getByRole('button',{name:'Reintentar',exact:true})).toBeVisible();
 await page.unroute(path);const response=page.waitForResponse(r=>r.url().endsWith('/courses')&&r.request().method()==='GET');await page.getByRole('button',{name:'Reintentar',exact:true}).click();expect((await response).status()).toBe(200);await expect(page.locator('a.course-card')).toHaveCount(2);expect(gets).toBe(1);expect(await securitySnapshot(e)).toEqual(before);
 }finally{release();}
});
test('E2E-COURSE-006 UI course creation persists initial section teacher and audit atomically / create @smoke',async ({e,actorPage})=>{
 const page=await actorPage('AO'),form=await fillCourse(page),response=page.waitForResponse(r=>r.url().endsWith('/courses')&&r.request().method()==='POST');await submit(form,'Crear curso');const r=await response;expect(r.status()).toBe(201);const created=await r.json();expect(r.headers().location).toContain(created.id);
 await expect(page.getByRole('heading',{name:'Curso E2E nuevo',exact:true})).toBeVisible();const api=await e.api('AO');expect(status(await api.get(`courses/${created.id}`),200).body).toMatchObject({code:'E2E-NEW',term:'2026-2',createdBy:e.data.actors.AO.id});
 const ss=status(await api.get(`courses/${created.id}/sections`),200).body.items;expect(ss).toHaveLength(1);expect(ss[0]).toMatchObject({code:'1',capacity:30});const enrolled=status(await api.get(`sections/${ss[0].id}/enrollments`),200).body.items;expect(enrolled).toHaveLength(1);expect(enrolled[0]).toMatchObject({role:'teacher',active:true,user:{id:e.data.actors.AO.id}});
 expect((await e.pool.query('SELECT action FROM audit_events WHERE course_id=$1 ORDER BY action',[created.id])).rows.map(r=>r.action)).toEqual(['course.created','enrollment.created','section.created']);
 const fresh=await actorPage('AO');await course(fresh,created.id);await expect(fresh.locator('main')).toContainText('Docente');await go(fresh,created.id,'/sections');await expect(fresh.getByRole('heading',{name:'Participantes e historial · Sección 1',exact:true})).toBeVisible();
});
test('E2E-COURSE-007 natural key duplicate rejects without partial effects / duplicate @regression',async ({e,actorPage})=>{
 const api=await e.api('AO'),input={...courseInput,code:'E2E-DUP'},created=status(await api.post('courses',input),201).body,page=await actorPage('AO');const before=await securitySnapshot(e);
 const form=await fillCourse(page,{code:input.code,name:'Duplicate name',term:input.term});await submit(form,'Crear curso');await expect(form.getByRole('alert').filter({hasText:'Ya existe un curso con ese código y período'})).toBeVisible();expect(await securitySnapshot(e)).toEqual(before);
 await period(form,'2027-1');const response=page.waitForResponse(r=>r.url().endsWith('/courses')&&r.request().method()==='POST');await submit(form,'Crear curso');expect((await response).status()).toBe(201);
 expect(status(await api.get('courses'),200).body.items.filter((r:any)=>r.code===input.code)).toHaveLength(2);expect(status(await api.get(`courses/${created.id}`),200).body.name).toBe(input.name);
});
test('E2E-COURSE-008 editor sends only changed metadata and fresh session sees it / minimal-patch @regression',async ({e,actorPage})=>{
 const page=await actorPage('AO'),api=await e.api('AO'),c=e.data.courses.C1;await go(page,c,'/sections');const form=await fillCourse(page,{code:'E2E-C1',name:'Curso editado',term:'2026-2'},true);
 const response=page.waitForResponse(r=>r.url().endsWith('/courses/'+c)&&r.request().method()==='PATCH');await submit(form,'Guardar curso');const r=await response;expect(r.status()).toBe(200);expect(r.request().postDataJSON()).toEqual({name:'Curso editado'});
 expect(status(await api.get(`courses/${c}`),200).body).toMatchObject({code:'E2E-C1',name:'Curso editado',term:'2026-2',createdBy:e.data.actors.AO.id});const events=(await e.pool.query("SELECT changes FROM audit_events WHERE action='course.updated' AND resource_id=$1",[c])).rows;expect(events).toHaveLength(1);expect(events[0].changes).toMatchObject({before:{name:'Curso E2E C1'},after:{name:'Curso editado'}});
 const fresh=await actorPage('AO');await course(fresh,c);await expect(fresh.getByRole('heading',{name:'Curso editado',exact:true})).toBeVisible();
});
test('E2E-COURSE-009 identical metadata preserves history / no-op @regression',async ({e,actorPage})=>{
 const api=await e.api('AO'),c=e.data.courses.C1,page=await actorPage('AO'),before=await securitySnapshot(e);status(await api.patch(`courses/${c}`,{name:'Curso E2E C1'}),200);expect(await securitySnapshot(e)).toEqual(before);
 await go(page,c,'/sections');await fillCourse(page,{code:'E2E-C1',name:'Curso E2E C1',term:'2026-2'},true);await page.getByRole('form',{name:'Configurar curso',exact:true}).getByRole('button',{name:'Guardar curso',exact:true}).click();await expect(page.getByRole('form',{name:'Configurar curso',exact:true}).getByRole('alert')).toHaveText('No hay cambios para guardar.');expect(await securitySnapshot(e)).toEqual(before);
});
for(const field of ['code','name','term','shape','bytes'])test(`E2E-COURSE-010 metadata and body boundaries preserve confirmed data / ${field} @extended`,async ({e,actorPage})=>{
 const page=await actorPage('AO'),api=await e.api('AO'),c=e.data.courses.C1,form=await fillCourse(page);const before=await securitySnapshot(e);
 if(['code','name','term'].includes(field)){
  const max=field==='code'?32:field==='name'?200:16,limit='X'.repeat(max);
  status(await api.patch(`courses/${c}`,{[field]:limit+'X'}),400);status(await api.patch(`courses/${c}`,{[field]:'   '}),400);expect(await securitySnapshot(e)).toEqual(before);
  // The UI bounds input itself: text fields truncate at maxLength and the period is a pair of selects.
  if(field!=='term'){const input=form.getByLabel(field==='code'?'Código':'Nombre',{exact:true});await input.fill(limit+'X');await expect(input).toHaveValue(limit);}
  status(await api.patch(`courses/${c}`,{[field]:limit}),200);expect(status(await api.get(`courses/${c}`),200).body[field]).toBe(limit);
 }else if(field==='shape'){
  for(const body of [{},{name:null},{name:123},{name:[]},{name:'Valid',createdBy:e.data.actors.ST1.id}])status(await api.patch(`courses/${c}`,body),400);
  status(await api.post('courses',{...courseInput,owner:e.data.actors.ST1.id}),400);expect(await securitySnapshot(e)).toEqual(before);
 }else{status(await api.post('courses',{...courseInput,name:'X'.repeat(5000)}),413);expect(await securitySnapshot(e)).toEqual(before);}
});
test('E2E-COURSE-011 committed creation with lost response never resends / uncertain @regression',async ({e,actorPage})=>{
 const page=await actorPage('AO'),form=await fillCourse(page);let posts=0,created='';
 await page.route('**/api/v1/institution/uc/courses',async route=>{if(route.request().method()!=='POST'){await route.continue();return;}posts++;const r=await route.fetch();expect(r.status()).toBe(201);created=(await r.json()).id;await route.abort('failed');});
 await submit(form,'Crear curso');await expect(form.getByRole('alert')).toContainText('Resultado incierto');await expect(form.getByRole('button',{name:'Crear curso',exact:true})).toBeDisabled();
 await expect(form.getByLabel('Código',{exact:true})).toHaveValue('E2E-NEW');await course(page,e.data.courses.C1);await page.getByRole('link',{name:'Mis cursos',exact:true}).click();await expect(page.locator(`a.course-card[href="/courses/${created}"]`)).toBeVisible();
 expect(posts).toBe(1);expect((await e.pool.query('SELECT count(*)::int n FROM courses WHERE code=$1',['E2E-NEW'])).rows[0].n).toBe(1);expect((await e.pool.query('SELECT count(*)::int n FROM audit_events WHERE course_id=$1',[created])).rows[0].n).toBe(3);
});
test('E2E-COURSE-012 simultaneous UI creates serialize natural key / concurrent @extended',async ({e,actorPage})=>{
 const a=await actorPage('AO'),b=await actorPage('AO'),fa=await fillCourse(a),fb=await fillCourse(b);let count=0,release!:()=>void;const gate=new Promise<void>(r=>release=r);
 for(const page of [a,b])await page.route('**/api/v1/institution/uc/courses',async route=>{if(route.request().method()!=='POST'){await route.continue();return;}if(++count===2)release();await gate;await route.continue();});
 const responses=[a,b].map(page=>page.waitForResponse(r=>r.url().endsWith('/courses')&&r.request().method()==='POST'));
 try{await Promise.all([submit(fa,'Crear curso'),submit(fb,'Crear curso')]);const rs=await Promise.all(responses);expect(rs.map(r=>r.status()).sort()).toEqual([201,409]);const created=await rs.find(r=>r.status()===201)!.json();
 const api=await e.api('AO');expect(status(await api.get('courses'),200).body.items.filter((r:any)=>r.code==='E2E-NEW')).toHaveLength(1);expect(status(await api.get(`courses/${created.id}/sections`),200).body.items).toHaveLength(1);expect((await e.pool.query('SELECT count(*)::int n FROM audit_events WHERE course_id=$1',[created.id])).rows[0].n).toBe(3);
 }finally{release();}
});
for(const field of ['code','name','term','sectionCode'])test(`E2E-COURSE-013 NUL metadata rejects before persistence / ${field} @extended`,async ({e})=>{
 const api=await e.api('AO'),before=await securitySnapshot(e),input=field==='sectionCode'?{...courseInput,initialSection:{code:'bad\u0000value'}}:{...courseInput,[field]:'bad\u0000value'};
 status(await api.post('courses',input),400);expect(await securitySnapshot(e)).toEqual(before);
});
