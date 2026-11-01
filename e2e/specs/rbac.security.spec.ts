import {test,expect} from '../fixtures/test.ts';
import {status} from '../helpers/api.ts';
import {weights as currentCourseWeights} from '../helpers/academic.ts';
import {course,go,compatibilityNavigate} from '../helpers/browser.ts';
import {academic,securitySnapshot,deniedUI,courseInput,rejectNonStaffWrites} from '../helpers/security.ts';

const weights=(e:import('../fixtures/environment.ts').Environment)=>({items:[{gradeItemId:e.id('item/Q1'),weightPercent:100}]});

test('E2E-RBAC-001 superadmin flag grants no academic access / superadmin @regression',async ({e,actorPage})=>{
 const page=await actorPage('SA'),api=await e.api('SA'),before=await securitySnapshot(e);
 await expect(page.getByText('Crear curso',{exact:true})).toHaveCount(0);expect(status(await api.get('courses'),200).body.items).toEqual([]);
 status(await api.post('courses',courseInput),403);
 for(const path of [`courses/${e.data.courses.C1}`,`courses/${e.data.courses.C1}/gradebook`,`quizzes/${e.data.quizzes.Q1}/authoring`])status(await api.get(path),404);
 await deniedUI(page,`/courses/${e.data.courses.C1}/gradebook`);expect(await securitySnapshot(e)).toEqual(before);
});
test('E2E-RBAC-002 other owner needs contextual roles and cannot configure / other-admin @regression',async ({e,actorPage})=>{
 const page=await actorPage('AX'),api=await e.api('AX'),path=`courses/${e.data.courses.C1}`;
 status(await api.get(path),404);status(await api.patch(path,{name:'attack'}),404);status(await api.post(path+'/sections',{code:'attack'}),404);
 await e.pool.query('INSERT INTO enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,$5)',[e.id('ax-teacher'),e.data.tenants.uc,e.data.sections.S1,e.data.actors.AX.id,'teacher']);
 const before=await securitySnapshot(e);status(await api.get(path),200);status(await api.patch(path,{name:'attack'}),403);status(await api.post(path+'/sections',{code:'attack'}),403);
 expect(await securitySnapshot(e)).toEqual(before);await course(page,e.data.courses.C3);
});
test('E2E-RBAC-003 ownership without teaching grants only administration / owner-only @regression',async ({e,actorPage})=>{
 const page=await actorPage('AO-ONLY'),api=await e.api('AO-ONLY'),c=e.data.courses.COWNER;
 await course(page,c);status(await api.patch(`courses/${c}`,{name:'Owner configured'}),200);status(await api.post(`courses/${c}/sections`,{code:'owner-section'}),201);
 const before=await securitySnapshot(e);
 for(const path of [`courses/${c}/modules`,`courses/${c}/quizzes`])status(await api.get(path),404);
 status(await api.get(`courses/${c}/gradebook`),403);status(await api.put(`courses/${c}/gradebook/weights`,weights(e)),403);
 const audit=status(await api.get(`courses/${c}/audit-events`),200).body;expect(audit.items.every((r:any)=>r.resourceType!=='grade')).toBe(true);
 expect(await securitySnapshot(e)).toEqual(before);await expect(page.getByRole('link',{name:'Libro de notas',exact:true})).toHaveCount(0);
});
test('E2E-RBAC-004 teacher writes own academia without global administration / teacher @regression',async ({e,actorPage})=>{
 const page=await actorPage('T1'),api=await e.api('T1'),c=e.data.courses.C1;
 status(await api.post(`courses/${c}/modules`,{title:'Teacher module',position:3}),201);
 status(await api.post(`modules/${e.data.modules.M1}/materials`,{title:'Teacher material',markdownBody:'Evidence'}),201);
 status(await api.post(`courses/${c}/quizzes`,{title:'Teacher quiz',sectionId:e.data.sections.S1}),201);
 const before=await securitySnapshot(e);status(await api.patch(`courses/${c}`,{name:'attack'}),403);status(await api.post(`courses/${c}/sections`,{code:'attack'}),403);status(await api.put(`courses/${c}/gradebook/weights`,{items:await currentCourseWeights(e,c,'T1')}),200);status(await api.post(`courses/${c}/quizzes`,{title:'Global',sectionId:null}),403);
 expect(await securitySnapshot(e)).toEqual(before);await go(page,c,'/modules');await expect(page.locator('summary').filter({hasText:/^Crear módulo$/})).toBeVisible();
});
for(const {id,actor} of [{id:'E2E-RBAC-005',actor:'AS1'},{id:'E2E-RBAC-006',actor:'ST1'}])test(`${id} projections and writes obey contextual role / ${actor} @smoke`,async ({e,actorPage})=>{
 const a=await academic(e,'uc',true),other=status(await (await e.api('ST2')).post(`sections/${e.data.sections.S2}/quizzes/${e.data.quizzes.QS2}/attempts`,undefined,e.key()),201).body;
 const page=await actorPage(actor),api=await e.api(actor),c=e.data.courses.C1;
 const before=await securitySnapshot(e);
 status(await api.get(`courses/${c}/gradebook`),actor==='AS1'?200:403);
 const own=status(await api.get(`quiz-attempts/${a.attempt}`),200).body;
 expect(JSON.stringify(own)).not.toMatch(/isCorrect|pointsAwarded/);
 if(actor==='ST1'){expect(own).not.toHaveProperty('grade');status(await api.get(`quiz-attempts/${other.id}`),404);status(await api.get(`courses/${c}/audit-events`),403);status(await api.get(`quizzes/${e.data.quizzes.QD}`),404);}
 else {status(await api.get(`quizzes/${e.data.quizzes.Q1}/attempts`),200);status(await api.get(`sections/${e.data.sections.S1}/enrollments`),200);}
 await rejectNonStaffWrites(e,api);
 status(await api.get('users?search=E2E'),403);
 status(await api.get(`courses/${c}/grade-items`),actor==='AS1'?200:403);
 if(actor==='AS1')status(await api.post(`sections/${e.data.sections.S1}/quizzes/${e.data.quizzes.Q1}/attempts`,undefined,e.key()),403);
 status(await api.get(`quizzes/${e.data.quizzes.Q1}/authoring`),403);
 const deniedAttempt=actor==='ST1'?other.id:a.attempt,deniedStatus=actor==='ST1'?404:403;
 for(const suffix of ['submit','cancel'])status(await api.post(`quiz-attempts/${deniedAttempt}/${suffix}`,undefined,e.key()),deniedStatus);
 status(await api.put(`quiz-attempts/${deniedAttempt}/answers`,{answers:[]}),deniedStatus);
 status(await api.post(`courses/${c}/quizzes`,{title:'attack',sectionId:e.data.sections.S1}),403);
 status(await api.post(`courses/${c}/gradebook/publications`,e.selection(),e.key()),403);status(await api.put(`courses/${c}/gradebook/weights`,weights(e)),403);
 if(actor==='ST1')status(await api.get(`sections/${e.data.sections.S1}/enrollments`),403);
 expect(await securitySnapshot(e)).toEqual(before);
 await deniedUI(page,`/courses/${c}/quizzes/${e.data.quizzes.Q1}/authoring`);
});
test('E2E-RBAC-007 revoking admin preserves teaching / admin-revocation @regression',async ({e,actorPage})=>{
 const page=await actorPage('AO'),owner=await e.api('AO'),sa=await e.api('SA');await course(page,e.data.courses.C1);
 status(await sa.put(`memberships/${e.data.actors.AO.membership.uc}/course-admin`,{isAdmin:false}),200);
 const refresh=page.waitForResponse(r=>r.url().endsWith('/me'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await refresh;
 expect(status(await owner.get('me'),200).body.institutionMembership.isAdmin).toBe(false);
 status(await owner.patch(`courses/${e.data.courses.C1}`,{name:'attack'}),403);status(await owner.put(`courses/${e.data.courses.C1}/gradebook/weights`,{items:await currentCourseWeights(e,e.data.courses.C1,'AO')}),200);
 status(await owner.patch(`materials/${e.data.materials.R1}`,{title:'Still teacher'}),200);
 await expect(page.getByText('Configurar curso',{exact:true})).toHaveCount(0);
});
test('E2E-RBAC-008 owner teacher extends academic scope to other sections / global-owner @regression',async ({e,actorPage})=>{
 const page=await actorPage('AO'),api=await e.api('AO'),teacher=await e.api('T1'),c=e.data.courses.C1;
 status(await api.get(`courses/${c}/gradebook?sectionId=${e.data.sections.S2}`),200);
 const q=status(await api.post(`courses/${c}/quizzes`,{title:'Owner S2',sectionId:e.data.sections.S2,questions:[{position:1,prompt:'Q',points:1,alternatives:[{id:'a',text:'A',isCorrect:true},{id:'b',text:'B',isCorrect:false}]}]}),201).body;
 status(await api.post(`quizzes/${q.id}/publish`),200);const before=await securitySnapshot(e);
 status(await teacher.get(`courses/${c}/gradebook?sectionId=${e.data.sections.S2}`),404);status(await teacher.post(`courses/${c}/quizzes`,{title:'attack',sectionId:e.data.sections.S2}),404);status(await teacher.post(`courses/${c}/quizzes`,{title:'attack',sectionId:null}),403);
 expect(await securitySnapshot(e)).toEqual(before);await go(page,c,'/quizzes');await expect(page.getByText('Owner S2',{exact:true})).toBeVisible();
});
for(const {id,actor} of [{id:'E2E-RBAC-009',actor:'TS-SAME'},{id:'E2E-RBAC-010',actor:'TS-CROSS'}])test(`${id} teaching and student capabilities evaluated per quiz / ${actor} @${actor==='TS-SAME'?'smoke':'regression'}`,async ({e,actorPage})=>{
 const page=await actorPage(actor),api=await e.api(actor);await go(page,e.data.courses.C1,'/quizzes');
 status(await api.get(`quizzes/${e.data.quizzes.Q1}/authoring`),actor==='TS-SAME'?200:403);
 const before=await securitySnapshot(e);
 const r=await api.post(`sections/${e.data.sections.S1}/quizzes/${e.data.quizzes.Q1}/attempts`,undefined,e.key());
 status(r,actor==='TS-SAME'?403:201);
 if(actor==='TS-SAME')expect(await securitySnapshot(e)).toEqual(before);
 if(actor==='TS-CROSS')status(await api.put(`quiz-attempts/${r.body.id}/answers`,{answers:e.answers()}),200);
 await compatibilityNavigate(page,`/courses/${e.data.courses.C1}/quizzes/${e.data.quizzes.Q1}`);
 await expect(page.getByRole('button',{name:'Iniciar nuevo intento',exact:true})).toHaveCount(actor==='TS-SAME'?0:1);
});
test('E2E-RBAC-011 assistant-student uses different own and staff projections / assistant-student @regression',async ({e,actorPage})=>{
 const a=await e.graded('AS-ST'),other=await e.attempt('ST1'),page=await actorPage('AS-ST'),api=await e.api('AS-ST');
 const own=status(await api.get(`quiz-attempts/${a.id}`),200).body;expect(own).not.toHaveProperty('grade');expect(JSON.stringify(own)).not.toMatch(/isCorrect|pointsAwarded/);
 const staff=status(await api.get(`quizzes/${e.data.quizzes.Q1}/attempts`),200).body;expect(staff.items.find((r:any)=>r.id===a.id)).toHaveProperty('grade');expect(JSON.stringify(staff)).not.toMatch(/isCorrect|pointsAwarded/);
 status(await api.put(`quiz-attempts/${other.id}/answers`,{answers:[]}),403);
 await go(page,e.data.courses.C1,'/gradebook');await expect(page.getByRole('heading',{name:'Libro de notas',exact:true})).toBeVisible();
});
test('E2E-RBAC-012 revoked teacher cannot retain cursor privilege / teacher-revocation @regression',async ({e,actorPage})=>{
 await e.graded();await e.graded('MULTI');const page=await actorPage('T1'),api=await e.api('T1');
 const path=`courses/${e.data.courses.C1}/gradebook`,first=status(await api.get(path+'?limit=1'),200).body;expect(first.nextCursor).toBeTruthy();
 await go(page,e.data.courses.C1,'/gradebook');
 status(await (await e.api('AO')).patch(`sections/${e.data.sections.S1}/enrollments/${e.id('enrollment/S1/T1/teacher')}`,{active:false}),200);
 status(await api.get(path+'?cursor='+encodeURIComponent(first.nextCursor)),404);
 const refresh=page.waitForResponse(r=>r.url().endsWith('/me'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await refresh;
 await expect(page.getByRole('heading',{name:'Libro de notas',exact:true})).toHaveCount(0);
});
test('E2E-RBAC-013 query display hints do not escalate student / visual-hints @regression',async ({e,actorPage})=>{
 const page=await actorPage('ST1'),api=await e.api('ST1'),c=e.data.courses.C1,before=await securitySnapshot(e);
 await compatibilityNavigate(page,`/courses/${c}?role=teacher&experience=admin`);await expect(page.getByRole('heading',{name:'Curso E2E C1',exact:true})).toBeVisible();await expect(page.getByText('Configurar curso',{exact:true})).toHaveCount(0);
 status(await api.post(`courses/${c}/quizzes`,{title:'attack',sectionId:e.data.sections.S1}),403);status(await api.post(`courses/${c}/gradebook/publications`,e.selection(),e.key()),403);
 await deniedUI(page,`/courses/${c}/quizzes/${e.data.quizzes.Q1}/authoring?role=teacher`);expect(await securitySnapshot(e)).toEqual(before);
});
