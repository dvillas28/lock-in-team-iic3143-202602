import {test,expect} from '../fixtures/test.ts';
import {status} from '../helpers/api.ts';
import {course,go,showMenu} from '../helpers/browser.ts';
import {activeSection,disclose,sectionPicker,sections,submit} from '../helpers/management.ts';
import {securitySnapshot} from '../helpers/security.ts';

for(const actor of ['AO','T1','AS1','ST1'])test(`E2E-SECTION-001 section scope follows ownership and contextual enrollment / ${actor} @regression`,async ({e,actorPage})=>{
 const page=await actorPage(actor),api=await e.api(actor),owner=actor==='AO',before=await securitySnapshot(e);
 const items=status(await api.get(`courses/${e.data.courses.C1}/sections`),200).body.items;
 expect(items.map((s:any)=>s.id).sort()).toEqual((owner?[e.data.sections.S1,e.data.sections.S2]:[e.data.sections.S1]).sort());status(await api.get(`sections/${e.data.sections.S2}`),owner?200:404);
 if(['AO','T1'].includes(actor)){await sections(page,e);const picker=sectionPicker(page);if(owner)await expect(picker.locator('option')).toHaveCount(2);else await expect(picker).toHaveCount(0);await expect(page.getByRole('searchbox',{name:'Buscar sección',exact:true})).toHaveCount(0);await activeSection(page,'1');if(!owner)await expect(page.getByRole('button',{name:/^(Configurar|Crear) /})).toHaveCount(0);}
 else{await showMenu(page);await page.getByRole('link',{name:'Mis cursos',exact:true}).click();await expect(page.locator(`main a[href="/courses/${e.data.courses.C1}/modules"]`)).toContainText('Sección 1');await course(page,e.data.courses.C1);await expect(page.getByRole('link',{name:'Secciones y participantes',exact:true})).toHaveCount(0);await expect(page.getByRole('table')).toHaveCount(0);}
 expect(await securitySnapshot(e)).toEqual(before);
});
test('E2E-SECTION-002 new empty section and edit persist without invented teacher / create-edit @regression',async ({e,actorPage})=>{
 const page=await actorPage('AO'),api=await e.api('AO'),c=e.data.courses.C1;await sections(page,e);await disclose(page,'Crear sección');const form=page.getByRole('form',{name:'Crear sección',exact:true});await form.getByLabel('Código de sección',{exact:true}).fill('3');
 const createdResponse=page.waitForResponse(r=>r.url().endsWith(`/courses/${c}/sections`)&&r.request().method()==='POST');await submit(form,'Crear sección');const r=await createdResponse;expect(r.status()).toBe(201);const created=await r.json();expect(r.headers().location).toContain(created.id);
 expect(status(await api.get(`sections/${created.id}`),200).body).toMatchObject({code:'3',capacity:null});expect(status(await api.get(`sections/${created.id}/enrollments`),200).body.items).toEqual([]);
 await sections(page,e,created.id);await disclose(page,'Configurar sección');const edit=page.getByRole('form',{name:'Configurar sección',exact:true});await edit.getByLabel('Código de sección',{exact:true}).fill('3B');await edit.getByLabel('Capacidad (vacío: sin límite)',{exact:true}).fill('25');const patched=page.waitForResponse(r=>r.url().endsWith('/sections/'+created.id)&&r.request().method()==='PATCH');await submit(edit,'Guardar sección');expect((await patched).status()).toBe(200);
 expect(status(await api.get(`sections/${created.id}`),200).body).toMatchObject({code:'3B',capacity:25});const fresh=await actorPage('AO');await sections(fresh,e,created.id);await expect(fresh.locator('main').getByText('Capacidad: 25',{exact:true})).toBeVisible();
 const events=(await e.pool.query('SELECT action FROM audit_events WHERE resource_id=$1 ORDER BY action',[created.id])).rows.map(r=>r.action);expect(events).toEqual(['section.created','section.updated']);
});
test('E2E-SECTION-003 capacity boundaries and duplicates reject without effects / boundaries @extended',async ({e,actorPage})=>{
 const page=await actorPage('AO'),api=await e.api('AO'),s=e.data.sections.S1;await sections(page,e);const before=await securitySnapshot(e);
 for(const capacity of [0,-1,0.5,2147483648,'0'])status(await api.patch(`sections/${s}`,{capacity}),400);
 status(await api.post(`courses/${e.data.courses.C1}/sections`,{code:'1',capacity:1}),409);status(await api.post(`courses/${e.data.courses.C1}/sections`,{code:'ZERO',capacity:0}),400);expect(await securitySnapshot(e)).toEqual(before);
 await disclose(page,'Configurar sección');const form=page.getByRole('form',{name:'Configurar sección',exact:true});await form.getByLabel('Capacidad (vacío: sin límite)',{exact:true}).fill('0');await submit(form,'Guardar sección');await expect(form.getByText('Ingresa un número entero mayor o igual a 1, o deja vacío para no limitarla.',{exact:true})).toBeVisible();await expect(page.getByRole('dialog')).toBeVisible();expect(await securitySnapshot(e)).toEqual(before);
 for(const capacity of [null,2147483647]){status(await api.patch(`sections/${s}`,{capacity}),200);expect(status(await api.get(`sections/${s}`),200).body.capacity).toBe(capacity);}
 expect(status(await api.patch(`sections/${s}`,{capacity:5}),409).body.code).toBe('SECTION_CAPACITY_DECREASE');status(await api.patch(`sections/${s}`,{capacity:null}),200);
 expect(status(await api.patch(`sections/${s}`,{capacity:1}),409).body.code).toBe('SECTION_CAPACITY_BELOW_ENROLLMENTS');status(await api.patch(`sections/${s}`,{capacity:2147483647}),200);
 const fresh=await actorPage('AO');await sections(fresh,e);await expect(fresh.locator('main').getByText('Capacidad: 2147483647',{exact:true})).toBeVisible();
});
test('E2E-SECTION-004 local filter retains active section without matches / picker @regression',async ({e,actorPage})=>{
 // The code filter appears only past eight manageable sections, so the owner gets enough of them first.
 const api=await e.api('AO');for(let i=0;i<8;i++)status(await api.post(`courses/${e.data.courses.C1}/sections`,{code:'F'+i}),201);
 const page=await actorPage('AO');await sections(page,e,e.data.sections.S2);const before=await securitySnapshot(e),picker=sectionPicker(page);
 await page.getByRole('searchbox',{name:'Buscar sección',exact:true}).fill('ABSENT-SECTION');await expect(page.getByRole('status').filter({hasText:'No hay secciones que coincidan'})).toBeVisible();await expect(picker).toHaveValue(e.data.sections.S2);await activeSection(page,'2');
 await page.getByRole('searchbox',{name:'Buscar sección',exact:true}).fill('');await picker.selectOption(e.data.sections.S1);await activeSection(page,'1');expect(await securitySnapshot(e)).toEqual(before);
});
test('E2E-SECTION-005 late participants from previous section never replace current workspace / late-response @regression',async ({e,actorPage})=>{
 const page=await actorPage('AO');await course(page,e.data.courses.C1);let release!:()=>void,entered!:()=>void;const gate=new Promise<void>(r=>release=r),started=new Promise<void>(r=>entered=r),before=await securitySnapshot(e);
 await page.route('**/sections/'+e.data.sections.S1+'/enrollments**',async route=>{const response=await route.fetch();expect(response.status()).toBe(200);entered();await gate;await route.fulfill({response}).catch(()=>{});});
 try{await go(page,e.data.courses.C1,'/sections',{waitForData:false});await started;await sectionPicker(page).selectOption(e.data.sections.S2);await expect(page.getByRole('table')).toContainText(e.data.actors.ST2.email);release();await expect(page.getByRole('table')).not.toContainText(e.data.actors.ST1.email);await activeSection(page,'2');expect(await securitySnapshot(e)).toEqual(before);}finally{release();}
});
// Assignment rules are unchanged in PR-3: capacity is still not checked when enrolling.
test('E2E-SECTION-006 capacity metadata does not block assignment / minimum-capacity @extended',async ({e,actorPage})=>{
 const api=await e.api('AO'),c=e.data.courses.C1,created=status(await api.post(`courses/${c}/sections`,{code:'ONE',capacity:1}),201).body;
 for(const actor of ['ST1','ST2'])status(await api.post(`sections/${created.id}/enrollments`,{userId:e.data.actors[actor].id,role:'student'}),201);
 expect(status(await api.get(`sections/${created.id}`),200).body.capacity).toBe(1);const rows=status(await api.get(`sections/${created.id}/enrollments`),200).body.items;expect(rows).toHaveLength(2);expect(rows.every((r:any)=>r.active&&r.role==='student')).toBe(true);
 const page=await actorPage('AO');await sections(page,e,created.id);await expect(page.locator('main').getByText('Capacidad: 1',{exact:true})).toBeVisible();for(const actor of ['ST1','ST2'])await expect(page.getByRole('table')).toContainText(e.data.actors[actor].email);
});
