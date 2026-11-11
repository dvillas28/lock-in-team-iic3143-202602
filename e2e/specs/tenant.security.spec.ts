import {test,expect} from '../fixtures/test.ts';
import {Api,status} from '../helpers/api.ts';
import {login,course,go} from '../helpers/browser.ts';
import {origin} from '../runner/settings.ts';
import {academic,topology,securitySnapshot,deniedUI,courseInput} from '../helpers/security.ts';
import pg from 'pg';

for(const slug of ['uc','utfsm'])test(`E2E-TENANT-001 institution membership bounds global identity / ${slug} @smoke`,async ({e,actorPage})=>{
 const own=topology(e,slug),other=slug==='uc'?'utfsm':'uc';const page=await actorPage(own.student,slug);
 const api=await e.api(own.student,other);
 expect(status(await api.request('/api/v1/institutions'),200).body.items.map((i:any)=>i.slug)).toEqual([slug]);
 for(const path of ['me','courses'])status(await api.get(path),404);
 const b=await page.context().newPage();await b.goto(origin(other)+'/courses');
 await expect(b.getByRole('heading',{name:'Iniciar sesión',exact:true})).toBeVisible();
 await b.getByLabel('Correo electrónico',{exact:true}).fill(e.data.actors[own.student].email);await b.getByLabel('Contraseña',{exact:true}).fill(e.password);
 await b.getByRole('button',{name:'Continuar',exact:true}).click();
 await expect(b.getByRole('heading',{name:'Recurso no disponible',exact:true})).toBeVisible();
 await expect(b.getByText(e.data.actors[own.student].name,{exact:true})).toHaveCount(0);
});
test('E2E-TENANT-002 same identity distinct institutional roles / multi @smoke',async ({e,actorPage})=>{
 const uc=await actorPage('MULTI','uc'),foreign=await actorPage('MULTI','utfsm');
 await course(uc,e.data.courses.C1);await course(foreign,e.data.courses.F1);
 const a=status(await (await e.api('MULTI')).get('me'),200).body,b=status(await (await e.api('MULTI','utfsm')).get('me'),200).body;
 expect(a.id).toBe(b.id);expect(a.sectionMemberships.every((m:any)=>m.role==='student')).toBe(true);expect(b.sectionMemberships.every((m:any)=>m.role==='teacher')).toBe(true);
 status(await (await e.api('MULTI')).get(`quizzes/${e.data.quizzes.Q1}/authoring`),403);
 status(await (await e.api('MULTI','utfsm')).get(`quizzes/${e.data.quizzes.FQ1}/authoring`),200);
 await go(uc,e.data.courses.C1,'/modules');await expect(uc.getByRole('button',{name:'Nuevo módulo',exact:true})).toHaveCount(0);
 await go(foreign,e.data.courses.F1,'/modules');await expect(foreign.getByRole('button',{name:'Nuevo módulo',exact:true})).toBeVisible();
 const before=await securitySnapshot(e);status(await (await e.api('MULTI','utfsm')).patch(`materials/${e.data.materials.FR1}`,{title:'Foreign teaching edit'}),200);
 const after=await securitySnapshot(e);for(const table of Object.keys(before)){const own=(rows:unknown)=> (rows as any[]).filter(r=>r.institution_id===e.data.tenants.uc || r.id===e.data.tenants.uc);expect(own(after[table])).toEqual(own(before[table]));}
 expect(status(await (await e.api('MULTI','utfsm')).get(`materials/${e.data.materials.FR1}`),200).body.title).toBe('Foreign teaching edit');
});
for(const slug of ['uc','utfsm'])test(`E2E-TENANT-003 path determines tenant despite headers / ${slug} @extended`,async ({e})=>{
 const api=await e.api('MULTI',slug),other=slug==='uc'?'utfsm':'uc',t=topology(e,slug);
 const r=status(await api.request(api.path('courses'),'GET',undefined,{'Host':new URL(origin(other)).host,'Origin':origin(other),'x-tenant':other}),200);
 expect(r.body.items.map((c:any)=>c.id)).toEqual([t.course]);
 const before=await securitySnapshot(e);status(await api.post('courses',{...courseInput,institutionId:e.data.tenants[other]}),400);expect(await securitySnapshot(e)).toEqual(before);
});
test('E2E-TENANT-004 invalid missing and inactive institution / slugs @regression',async ({e,actorPage})=>{
 const page=await actorPage('ST1');const token=e.tokens.get('ST1');
 for(const slug of ['UC','bad_slug','x'.repeat(64)])status(await new Api(token,slug).get('me'),400);
 status(await new Api(token,'missing').get('me'),404);
 await e.pool.query('UPDATE institutions SET active=false WHERE slug=$1',['uc']);status(await new Api(token).get('me'),404);
 await e.pool.query('UPDATE institutions SET active=true WHERE slug=$1',['uc']);
 await course(page,e.data.courses.C1);await expect(page.getByRole('heading',{name:'Curso E2E C1',exact:true})).toBeVisible();
});
for(const {id,separate} of [{id:'E2E-TENANT-005',separate:false},{id:'E2E-TENANT-006',separate:true}])test(`${id} membership revocation retains only authorized context / ${separate?'other-active':'revoked'} @regression`,async ({e,actorPage})=>{
 const actor=separate?'MULTI':'ST1',page=await actorPage(actor);let foreign:import('@playwright/test').Page|undefined;
 if(separate)foreign=await actorPage(actor,'utfsm');
 await course(page,e.data.courses.C1);const api=await e.api(actor);
 await e.pool.query('UPDATE institution_memberships SET active=false WHERE id=$1',[e.data.actors[actor].membership.uc]);
 for(const path of ['me','courses'])status(await api.get(path),404);
 const response=page.waitForResponse(r=>r.url().endsWith('/me'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));expect((await response).status()).toBe(404);
 await expect(page.getByRole('heading',{name:'Recurso no disponible',exact:true})).toBeVisible();await expect(page.getByText(e.data.actors[actor].name,{exact:true})).toHaveCount(0);
 if(foreign){status(await (await e.api(actor,'utfsm')).get('me'),200);await course(foreign,e.data.courses.F1);await expect(foreign.getByText(e.data.actors[actor].name,{exact:true})).toBeVisible();}
 status(await new Api().request('/api/v1/auth/login','POST',{email:e.data.actors[actor].email,password:e.password}),200);
});
test('E2E-TENANT-007 cross-origin history does not revive private state / history @regression',async ({e,actorPage})=>{
 const page=await actorPage('MULTI');await go(page,e.data.courses.C1,'/grades');await page.goto(origin('utfsm')+'/courses');
 await login(page,e,'MULTI','utfsm');await course(page,e.data.courses.F1);
 let reached=false;
 for(let i=0;i<6;i++){await page.goBack();if(new URL(page.url()).origin===origin()){reached=true;break;}}
 expect(reached).toBe(true);await expect(page).toHaveURL(url=>url.origin===origin() && url.pathname==='/login');
 await expect(page.getByText(e.data.actors.MULTI.name,{exact:true})).toHaveCount(0);
 await page.goForward();await expect(page).toHaveURL(url=>url.origin===origin('utfsm') && url.pathname==='/login');
 await expect(page.getByText('Curso E2E C1',{exact:true})).toHaveCount(0);
});
for(const slug of ['uc','utfsm'])for(const role of ['teacher','student','assistant','owner','superadmin'])test(`E2E-TENANT-008 foreign identifiers never reveal resources / ${slug}-${role} @smoke`,async ({e,actorPage})=>{
 const own=topology(e,slug),foreign=await academic(e,slug==='uc'?'utfsm':'uc');
 const actor=own[role as 'teacher'|'student'|'assistant'|'owner'|'superadmin'],page=await actorPage(actor,slug),api=await e.api(actor,slug);
 const c=foreign.course,q=foreign.quiz,s=foreign.section,before=await securitySnapshot(e);
 const paths=[`courses/${c}`,`courses/${c}/sections`,`sections/${s}`,`sections/${s}/enrollments`,`courses/${c}/modules`,`modules/${foreign.module}`,`modules/${foreign.module}/materials`,`materials/${foreign.material}`,`courses/${c}/quizzes`,`quizzes/${q}`,`quizzes/${q}/authoring`,`quizzes/${q}/attempts`,`quiz-attempts/${foreign.attempt}`,`courses/${c}/grade-items`,`courses/${c}/gradebook`,`courses/${c}/my-grades`,`courses/${c}/audit-events`];
 for(const path of paths){const r=status(await api.get(path),404);const {instance:_instance,traceId:_trace,...problem}=r.body;expect(problem.code).toBe('RESOURCE_NOT_FOUND');expect(JSON.stringify(problem)).not.toContain(c);}
 await deniedUI(page,`/courses/${c}`);await expect(page.getByText(`Curso E2E ${slug==='uc'?'F1':'C1'}`,{exact:true})).toHaveCount(0);expect(await securitySnapshot(e)).toEqual(before);
});
for(const slug of ['uc','utfsm'])test(`E2E-TENANT-009 foreign writes leave both institutions intact / ${slug} @smoke`,async ({e,actorPage})=>{
 const own=topology(e,slug),f=await academic(e,slug==='uc'?'utfsm':'uc'),page=await actorPage(own.owner,slug),api=await e.api(own.owner,slug);
 const writes:[string,string,unknown?][]=[['PATCH',`courses/${f.course}`,{name:'attack'}],['POST',`courses/${f.course}/sections`,{code:'attack'}],['PATCH',`sections/${f.section}`,{code:'attack'}],['POST',`sections/${f.section}/enrollments`,{userId:e.data.actors[own.student].id,role:'student'}],['PATCH',`sections/${f.section}/enrollments/${e.id(`enrollment/${slug==='uc'?'FS1/FST1':'S1/ST1'}/student`)}`,{active:false}],['POST',`courses/${f.course}/modules`,{title:'attack',position:3}],['PUT',`courses/${f.course}/modules/order`,{moduleIds:[f.module]}],['PATCH',`modules/${f.module}`,{title:'attack'}],['POST',`modules/${f.module}/publish`],['POST',`modules/${f.module}/unpublish`],['POST',`modules/${f.module}/materials`,{title:'attack',markdownBody:'attack'}],['PATCH',`materials/${f.material}`,{title:'attack'}],['POST',`materials/${f.material}/publish`],['POST',`materials/${f.material}/unpublish`],['POST',`courses/${f.course}/quizzes`,{title:'attack'}],['PATCH',`quizzes/${f.quiz}`,{title:'attack'}],['POST',`quizzes/${f.quiz}/publish`],['POST',`sections/${f.section}/quizzes/${f.quiz}/attempts`],['PUT',`quiz-attempts/${f.attempt}/answers`,{answers:[]}],['POST',`quiz-attempts/${f.attempt}/submit`],['POST',`quiz-attempts/${f.attempt}/cancel`],['PUT',`courses/${f.course}/gradebook/weights`,{items:[{gradeItemId:f.item,weightPercent:100}]}],['POST',`courses/${f.course}/gradebook/publications`,{gradeItemIds:[f.item],sectionIds:[f.section],studentIds:[e.data.actors[f.student].id]}]];
 const before=await securitySnapshot(e);
 for(const [method,path,body] of writes)status(await api.request(api.path(path),method,body,{'Idempotency-Key':e.key()}),404);
 expect(await securitySnapshot(e)).toEqual(before);await course(page,own.course);
});
for(const slug of ['uc','utfsm'])test(`E2E-TENANT-010 cross-institution references in bodies rejected / ${slug} @regression`,async ({e,actorPage})=>{
 const t=topology(e,slug),f=topology(e,slug==='uc'?'utfsm':'uc'),page=await actorPage(t.owner,slug),api=await e.api(t.owner,slug);const before=await securitySnapshot(e);
 status(await api.post(`sections/${t.section}/enrollments`,{userId:e.data.actors[f.student].id,role:'student'}),404);
 status(await api.put(`courses/${t.course}/modules/order`,{moduleIds:[f.module]}),404);
 status(await api.post(`courses/${t.course}/quizzes`,{title:'attack',sectionId:f.section}),404);
 status(await api.post(`courses/${t.course}/gradebook/publications`,{gradeItemIds:[f.item],sectionIds:[t.section],studentIds:[e.data.actors[t.student].id]},e.key()),404);
 status(await api.post(`courses/${t.course}/gradebook/publications`,{gradeItemIds:[e.id('item/'+(slug==='uc'?'Q1':'FQ1'))],sectionIds:[t.section],studentIds:[e.data.actors[f.student].id]},e.key()),409);
 status(await api.post(`courses/${t.course}/gradebook/publications`,{gradeItemIds:[t.item],sectionIds:[f.section],studentIds:[e.data.actors[t.student].id]},e.key()),404);
 status(await api.put(`courses/${t.course}/gradebook/weights`,{items:[{gradeItemId:f.item,weightPercent:100}]}),422);
 expect(await securitySnapshot(e)).toEqual(before);await course(page,t.course);
});
test('E2E-TENANT-011 same role does not authorize another course / other-course @regression',async ({e,actorPage})=>{
 const page=await actorPage('T1'),api=await e.api('T1');
 for(const suffix of ['', '/modules','/quizzes','/gradebook','/audit-events'])status(await api.get(`courses/${e.data.courses.C3}${suffix}`),404);
 await deniedUI(page,`/courses/${e.data.courses.C3}`);await page.getByRole('link',{name:'Mis cursos',exact:true}).click();await course(page,e.data.courses.C1);
});
for(const resource of ['material','attempt'])test(`E2E-TENANT-012 inconsistent frontend parent rejected / ${resource} @regression`,async ({e,actorPage})=>{
 const a=await academic(e),page=await actorPage('T1');
 const path=resource==='material'?`/courses/${e.data.courses.C2}/modules/${e.data.modules.M1}/materials/${e.data.materials.R1}`:`/courses/${e.data.courses.C1}/quizzes/${e.data.quizzes.Q2}/attempts/${a.attempt}`;
 await deniedUI(page,path);await expect(page.getByRole('heading',{name:'Lectura E2E R1',exact:true})).toHaveCount(0);
});
for(const collection of ['enrollments','memberships','users','attempts','gradebook','audit'])test(`E2E-TENANT-013 cursors revalidate actor tenant and filters / ${collection} @extended`,async ({e})=>{
 if(['attempts','gradebook'].includes(collection)){await e.graded();await e.graded('MULTI');}
 if(collection==='audit'){const api=await e.api('AO');for(let i=0;i<3;i++)status(await api.patch(`materials/${e.data.materials.R1}`,{title:`Cursor ${i}`}),200);}
 const actor=collection==='memberships'?'SA':'AO',other=collection==='memberships'?'MEMBER':'T1';
 if(collection==='memberships')await e.pool.query('UPDATE institution_memberships SET is_super_admin=true WHERE id=$1',[e.data.actors.MEMBER.membership.uc]);
 const api=await e.api(actor),foreign=await e.api(collection==='memberships'?'FSA':'FAO','utfsm');
 const path=collection==='enrollments'?`sections/${e.data.sections.S1}/enrollments`:collection==='attempts'?`quizzes/${e.data.quizzes.Q1}/attempts`:collection==='gradebook'?`courses/${e.data.courses.C1}/gradebook`:collection==='audit'?`courses/${e.data.courses.C1}/audit-events`:collection==='users'?'users?search=E2E':'memberships';
 const sep=path.includes('?')?'&':'?',first=status(await api.get(path+sep+'limit=1'),200).body;expect(first.nextCursor).toBeTruthy();
 const next=path+sep+'limit=1&cursor='+encodeURIComponent(first.nextCursor);
 status(await api.get(next),200);status(await (await e.api(other)).get(next),400);
 const foreignPath=next.replaceAll(e.data.sections.S1,e.data.sections.FS1).replaceAll(e.data.courses.C1,e.data.courses.F1).replaceAll(e.data.quizzes.Q1,e.data.quizzes.FQ1);
 status(await foreign.get(foreignPath),400);
 if(collection==='users')status(await api.get(next.replace('search=E2E','search=Jos')),400);
 if(collection==='audit')status(await api.get(next+'&resourceType=material'),400);
 if(collection==='attempts')status(await api.get(next+'&status=graded'),400);
 if(collection==='gradebook')status(await api.get(next+'&sectionId='+e.data.sections.S1),400);
});
test('E2E-TENANT-014 pooled RLS context never escapes transaction / pooled @extended',async ({e})=>{
 const runtime=new pg.Pool({connectionString:e.url('academix_runtime'),max:1});
 try {
  for(const table of ['institution_memberships','courses','sections','enrollments','course_modules','materials','quizzes','grade_items','quiz_attempts','grades','grade_publications','audit_events'])expect((await runtime.query(`SELECT * FROM ${table}`)).rowCount).toBe(0);
  const api=await e.api('MULTI'),foreign=await e.api('MULTI','utfsm');
  await Promise.all(Array.from({length:20},async(_,i)=>{const own=i%2===0,r=status(await (own?api:foreign).get('courses'),200);expect(r.body.items.map((c:any)=>c.id)).toEqual([own?e.data.courses.C1:e.data.courses.F1]);}));
  expect((await runtime.query('SELECT * FROM courses')).rowCount).toBe(0);
  const role=(await runtime.query('SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0];expect(role).toEqual({rolsuper:false,rolbypassrls:false});
 }finally{await runtime.end();}
});
for(const code of [200,401])test(`E2E-TENANT-015 stale response discarded after identity change / late-${code} @regression`,async ({e,actorPage})=>{
 await e.graded();await e.publish();const page=await actorPage('ST1');
 let release!:()=>void,entered!:()=>void;const gate=new Promise<void>(r=>release=r),started=new Promise<void>(r=>entered=r);
 let held=false;
 await page.route('**/my-grades',async route=>{
  if(held){await route.continue();return;}held=true;
  if(code===401)await e.pool.query('UPDATE users SET active=false WHERE id=$1',[e.data.actors.ST1.id]);
  const response=await route.fetch();expect(response.status()).toBe(code);entered();await gate;
  await route.fulfill({response}).catch(()=>{});
 });
 try {
  await go(page,e.data.courses.C1,'/grades',{waitForData:false});await started;
  await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await login(page,e,'ST2');release();
  await expect(page.getByText(e.data.actors.ST2.name,{exact:true})).toBeVisible();await expect(page.getByText(e.data.actors.ST1.name,{exact:true})).toHaveCount(0);
  await go(page,e.data.courses.C1,'/grades');await expect(page.getByRole('heading',{name:'Aún no hay notas publicadas',exact:true})).toBeVisible();
 }finally{release();}
});

test('E2E-TENANT-013 invalid cursor renders safe error and retry recovers / browser-recovery @extended',async ({e,actorPage})=>{
 await e.graded();await e.graded('MULTI');
 const c=e.data.courses.C1,owner=await e.api('AO'),first=status(await owner.get(`courses/${c}/gradebook?limit=1`),200).body;
 expect(first.nextCursor).toBeTruthy();
 const page=await actorPage('T1'),before=await securitySnapshot(e),pattern='**/api/v1/institution/uc/courses/*/gradebook**';
 await page.route(pattern,async route=>{
  const url=new URL(route.request().url());url.searchParams.set('cursor',first.nextCursor);
  const response=await route.fetch({url:url.href});expect(response.status()).toBe(400);await route.fulfill({response});
 });
 await go(page,c,'/gradebook');
 await expect(page.getByRole('alert').filter({hasText:'Solicitud o cursor inválido (400)'})).toBeVisible();
 await expect(page.getByRole('table')).toHaveCount(0);
 await page.unroute(pattern);await page.getByRole('button',{name:'Reintentar',exact:true}).click();
 await expect(page.getByRole('table')).toBeVisible();
 await expect(page.getByRole('rowheader',{name:e.data.actors.ST1.name+' '+e.data.actors.ST1.email,exact:true})).toBeVisible();
 await expect(page.getByRole('rowheader').filter({hasText:e.data.actors.FST1.name})).toHaveCount(0);
 expect(await securitySnapshot(e)).toEqual(before);
});
