import {test,expect} from '../fixtures/test.ts';
import {status,Api} from '../helpers/api.ts';
import {securitySnapshot,courseInput,pages} from '../helpers/security.ts';
import {operation,superadminInput,onboardingInput,fixturePassword} from '../helpers/operator.ts';
import pg from 'pg';

test('E2E-ADMIN-001 membership directory contains only active institution members / directory @extended',async ({e})=>{
 const api=await e.api('SA'),rows=await pages(api,'memberships');
 const expected=(await e.pool.query('SELECT m.id FROM institution_memberships m JOIN users u ON u.id=m.user_id WHERE m.institution_id=$1 AND m.active AND u.active',[e.data.tenants.uc])).rows.map(r=>r.id).sort();
 expect(rows.map(r=>r.id).sort()).toEqual(expected);expect(new Set(rows.map(r=>r.id)).size).toBe(rows.length);expect(JSON.stringify(rows)).not.toMatch(/password_hash|accessToken/);
 for(const limit of ['0','101'])status(await api.get('memberships?limit='+limit),400);
 const cursor=status(await api.get('memberships?limit=1'),200).body.nextCursor;expect(cursor).toBeTruthy();status(await (await e.api('FSA','utfsm')).get('memberships?cursor='+encodeURIComponent(cursor)),400);
});
test('E2E-ADMIN-002 delegated admin gains course creation without academic authority / grant @regression',async ({e,actorPage})=>{
 const page=await actorPage('MEMBER'),api=await e.api('MEMBER'),sa=await e.api('SA');await expect(page.getByText('Crear curso',{exact:true})).toHaveCount(0);
 status(await sa.put(`memberships/${e.data.actors.MEMBER.membership.uc}/course-admin`,{isAdmin:true}),200);
 const refreshed=page.waitForResponse(r=>r.url().endsWith('/me'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await refreshed;
 await expect(page.locator('summary').filter({hasText:/^Crear curso$/})).toBeVisible();
 expect(status(await api.get('me'),200).body.institutionMembership.isAdmin).toBe(true);
 const created=status(await api.post('courses',courseInput),201).body;
 expect((await e.pool.query('SELECT created_by FROM courses WHERE id=$1',[created.id])).rows[0].created_by).toBe(e.data.actors.MEMBER.id);
 expect(await e.count('audit_events',"action='membership.adminChanged'")).toBe(1);
 expect((await e.pool.query('SELECT e.role FROM enrollments e JOIN sections s ON s.id=e.section_id WHERE s.course_id=$1 AND e.user_id=$2 AND e.active',[created.id,e.data.actors.MEMBER.id])).rows.map(r=>r.role)).toEqual(['teacher']);
 status(await api.get(`courses/${e.data.courses.C1}`),404);status(await api.get(`quizzes/${e.data.quizzes.Q1}/authoring`),404);
});
test('E2E-ADMIN-003 revocation is effective and replay is a no-op / revoke @regression',async ({e,actorPage})=>{
 const page=await actorPage('AO'),sa=await e.api('SA'),api=await e.api('AO'),target=`memberships/${e.data.actors.AO.membership.uc}/course-admin`;
 status(await sa.put(target,{isAdmin:false}),200);expect(await e.count('audit_events',"action='membership.adminChanged'")).toBe(1);const before=await securitySnapshot(e);status(await sa.put(target,{isAdmin:false}),200);expect(await securitySnapshot(e)).toEqual(before);
 const refreshed=page.waitForResponse(r=>r.url().endsWith('/me'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await refreshed;
 await expect(page.getByText('Crear curso',{exact:true})).toHaveCount(0);status(await api.post('courses',courseInput),403);status(await api.patch(`courses/${e.data.courses.C1}`,{name:'attack'}),403);
 expect(status(await api.get('me'),200).body.sectionMemberships.some((r:any)=>r.role==='teacher')).toBe(true);
});
for(const actor of ['AO','T1','AS1','ST1'])test(`E2E-ADMIN-004 non-superadmin cannot delegate flags / ${actor} @extended`,async ({e})=>{
 const api=await e.api(actor),target=`memberships/${e.data.actors[actor].membership.uc}/course-admin`,before=await securitySnapshot(e);
 status(await api.get('memberships'),403);status(await api.put(target,{isAdmin:true}),403);
 for(const extra of [{isSuperAdmin:true},{active:true}])status(await api.put(target,{isAdmin:true,...extra}),400);
 expect(await securitySnapshot(e)).toEqual(before);
});
test('E2E-ADMIN-005 foreign inactive and missing delegation targets remain hidden / targets @extended',async ({e})=>{
 const api=await e.api('SA'),before=await securitySnapshot(e);
 for(const id of [e.data.actors.FSA.membership.utfsm,e.data.actors.REVOKED.membership.uc,e.data.actors.INACTIVE.membership.uc,e.id('absent-membership')])status(await api.put(`memberships/${id}/course-admin`,{isAdmin:true}),404);
 status(await (await e.api('FSA','utfsm')).put(`memberships/${e.data.actors.SA.membership.uc}/course-admin`,{isAdmin:true}),404);
 expect(await securitySnapshot(e)).toEqual(before);
});
test('E2E-ADMIN-006 superadmin and admin flags remain independent / independent-flags @regression',async ({e,actorPage})=>{
 const page=await actorPage('SA'),api=await e.api('SA'),target=`memberships/${e.data.actors.SA.membership.uc}/course-admin`;
 for(const enabled of [true,false]){
  status(await api.put(target,{isAdmin:enabled}),200);
  const refreshed=page.waitForResponse(r=>r.url().endsWith('/me'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await refreshed;
  const m=status(await api.get('me'),200).body.institutionMembership;expect(m.isAdmin).toBe(enabled);expect(m.isSuperAdmin).toBe(true);
  if(enabled){await expect(page.locator('summary').filter({hasText:/^Crear curso$/})).toBeVisible();status(await api.post('courses',courseInput),201);}else{await expect(page.getByText('Crear curso',{exact:true})).toHaveCount(0);status(await api.post('courses',{...courseInput,code:'Denied'}),403);}
 }
});
test('E2E-ADMIN-007 onboarding replay preserves credentials edits and flags / onboarding @extended',async ({e})=>{
 const input=onboardingInput(e),first=await operation(e,'onboard-institution',input);expect(first.outcome).toBe('applied');
 const changedPassword=e.password+'x',initial=await fixturePassword(changedPassword);
 await e.pool.query('UPDATE users SET password_hash=$1,name=$2 WHERE id=$3',[initial,'Edited user',input.ONBOARD_USER_ID]);
 await e.pool.query('UPDATE institutions SET name=$1 WHERE id=$2',['Edited institution',first.institutionId]);
 await e.pool.query('UPDATE institution_memberships SET is_admin=false WHERE institution_id=$1',[first.institutionId]);
 const second=await operation(e,'onboard-institution',input);expect(second.outcome).toBe('alreadyApplied');
 expect((await e.pool.query('SELECT name FROM institutions WHERE id=$1',[first.institutionId])).rows[0].name).toBe('Edited institution');
 expect((await e.pool.query('SELECT password_hash FROM users WHERE id=$1',[input.ONBOARD_USER_ID])).rows[0].password_hash===initial).toBe(true);
 expect((await e.pool.query('SELECT is_admin FROM institution_memberships WHERE institution_id=$1',[first.institutionId])).rows[0].is_admin).toBe(false);
 const r=status(await new Api().request('/api/v1/auth/login','POST',{email:input.ONBOARD_USER_EMAIL,password:changedPassword}),200);expect(r.body.tokenType).toBe('Bearer');
 status(await new Api().request('/api/v1/auth/login','POST',{email:input.ONBOARD_USER_EMAIL,password:e.password}),401);
 expect(await e.count('audit_events',"action='membership.onboarded'")).toBe(1);
});
test('E2E-ADMIN-008 superadmin recovery is audited idempotent and unavailable to runtime / recovery @extended',async ({e})=>{
 const input={...superadminInput(e,'true'),SUPERADMIN_USER_ID:e.data.actors.MEMBER.id};const result=await operation(e,'set-superadmin',input);expect(result.outcome).toBe('applied');
 const before=await securitySnapshot(e);expect((await operation(e,'set-superadmin',input)).outcome).toBe('alreadyApplied');expect(await securitySnapshot(e)).toEqual(before);
 const events=(await e.pool.query("SELECT changes FROM audit_events WHERE action='membership.superAdminChanged' AND changes->'after'->>'operationId'=$1",[input.SUPERADMIN_OPERATION_ID])).rows;
 expect(events).toHaveLength(1);expect(events[0].changes.after).toMatchObject({source:'operatorMigration',operatorRef:'e2e-isolated-operator',operationId:input.SUPERADMIN_OPERATION_ID});
 const runtime=new pg.Pool({connectionString:e.url('academix_runtime')});try{await expect(runtime.query('UPDATE institution_memberships SET is_super_admin=false WHERE id=$1',[e.data.actors.MEMBER.membership.uc])).rejects.toMatchObject({code:'42501'});}finally{await runtime.end();}
 expect(await securitySnapshot(e)).toEqual(before);
});
test('E2E-ADMIN-009 last superadmin cannot be revoked without replacement / replacement @extended',async ({e})=>{
 const input=superadminInput(e),before=await securitySnapshot(e);
 await expect(operation(e,'set-superadmin',input)).rejects.toThrow(/exit 1/);expect(await securitySnapshot(e)).toEqual(before);
 const result=await operation(e,'set-superadmin',{...input,SUPERADMIN_REPLACEMENT_USER_ID:e.data.actors.MEMBER.id});expect(result.changed).toBe(2);
 const rows=(await e.pool.query('SELECT user_id,is_super_admin FROM institution_memberships WHERE id=ANY($1::uuid[])',[[e.data.actors.SA.membership.uc,e.data.actors.MEMBER.membership.uc]])).rows;
 expect(rows.find(r=>r.user_id===e.data.actors.SA.id).is_super_admin).toBe(false);expect(rows.find(r=>r.user_id===e.data.actors.MEMBER.id).is_super_admin).toBe(true);
 expect(await e.count('audit_events',"action='membership.superAdminChanged'")).toBe(2);
});
test('E2E-ADMIN-010 onboarding refuses changed replay and unowned slug collision / collision @extended',async ({e})=>{
 const existing=(await e.pool.query('SELECT name,password_hash FROM users WHERE id=$1',[e.data.actors.MEMBER.id])).rows[0];
 const input=onboardingInput(e,true);expect((await operation(e,'onboard-institution',input)).outcome).toBe('applied');expect(JSON.stringify((await e.pool.query('SELECT name,password_hash FROM users WHERE id=$1',[e.data.actors.MEMBER.id])).rows[0])===JSON.stringify(existing)).toBe(true);const before=await securitySnapshot(e);
 await expect(operation(e,'onboard-institution',{...input,ONBOARD_INSTITUTION_NAME:'Changed'})).rejects.toThrow(/exit 1/);
 await expect(operation(e,'onboard-institution',{...input,ONBOARD_USER_ID:e.data.actors.T1.id})).rejects.toThrow(/exit 1/);
 await expect(operation(e,'onboard-institution',{...input,ONBOARD_OPERATION_ID:e.key(),ONBOARD_INSTITUTION_SLUG:'uc'})).rejects.toThrow(/exit 1/);
 expect(await securitySnapshot(e)).toEqual(before);
});
test('E2E-ADMIN-011 delegation cannot pass committed superadmin revocation / concurrent-revocation @extended',async ({e,actorPage})=>{
 const page=await actorPage('SA'),api=await e.api('SA');
 status(await api.put(`memberships/${e.data.actors.MEMBER.membership.uc}/course-admin`,{isAdmin:true}),200);
 const lock=await e.pool.connect();await lock.query('BEGIN');await lock.query('SELECT id FROM institutions WHERE id=$1 FOR UPDATE',[e.data.tenants.uc]);
 const pending=operation(e,'set-superadmin',{...superadminInput(e),SUPERADMIN_REPLACEMENT_USER_ID:e.data.actors.MEMBER.id});
 const competing=api.put(`memberships/${e.data.actors.T1.membership.uc}/course-admin`,{isAdmin:true});
 try{await expect.poll(async()=>Number((await e.pool.query("SELECT count(*) AS n FROM pg_stat_activity WHERE datname=$1 AND wait_event_type='Lock'",[e.dbName])).rows[0].n)).toBeGreaterThanOrEqual(2);}finally{await lock.query('ROLLBACK');lock.release();}
 await pending;const result=await competing;expect([200,403]).toContain(result.status);
 expect((await e.pool.query('SELECT is_admin FROM institution_memberships WHERE id=$1',[e.data.actors.T1.membership.uc])).rows[0].is_admin).toBe(result.status===200);
 expect(await e.count('audit_events',"action='membership.adminChanged'")).toBe(result.status===200?2:1);const before=await securitySnapshot(e);status(await api.put(`memberships/${e.data.actors.T1.membership.uc}/course-admin`,{isAdmin:true}),403);expect(await securitySnapshot(e)).toEqual(before);
 const refreshed=page.waitForResponse(r=>r.url().endsWith('/me'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await refreshed;
 expect(status(await api.get('me'),200).body.institutionMembership.isSuperAdmin).toBe(false);
});
