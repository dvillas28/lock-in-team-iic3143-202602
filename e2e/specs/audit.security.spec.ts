import {test,expect} from '../fixtures/test.ts';
import {status} from '../helpers/api.ts';
import {pages,securitySnapshot,deniedUI} from '../helpers/security.ts';
import {ownerStudentHistory} from '../helpers/audit-profile.ts';
import {go} from '../helpers/browser.ts';

test('E2E-AUDIT-003 owner-student audit never reveals grade history / owner-student @smoke',async ({e,actorPage})=>{
 const fixture=await ownerStudentHistory(e),page=await actorPage('AO-ST'),api=await e.api('AO-ST');
 const before=await securitySnapshot(e),rows=await pages(api,`courses/${fixture.course}/audit-events`);
 expect(rows.length).toBeGreaterThan(0);expect(rows.some(r=>r.resourceType==='course')).toBe(true);expect(rows.some(r=>r.resourceType==='grade')).toBe(false);
 expect(status(await api.get(`courses/${fixture.course}/audit-events?resourceType=grade&limit=1`),200).body.items).toEqual([]);
 expect((await e.pool.query("SELECT count(*)::int AS n FROM audit_events WHERE course_id=$1 AND resource_type='grade' AND action='grade.published'",[fixture.course])).rows[0].n).toBe(2);
 await go(page,fixture.course,'/audit');await expect(page.getByRole('heading',{name:'Auditoría del curso',exact:true})).toBeVisible();
 expect(await securitySnapshot(e)).toEqual(before);
});
test('E2E-AUDIT-004 cursor cannot preserve grade access after teaching revocation / revoked-owner @regression',async ({e,actorPage})=>{
 await e.graded();await e.publish();await e.graded('ST1',[true,true],e.data.quizzes.Q2);await e.publish('Q2');
 const api=await e.api('AO'),path=`courses/${e.data.courses.C1}/audit-events`,page=await actorPage('AO');
 const first=status(await api.get(path+'?resourceType=grade&limit=1'),200).body;expect(first.items).toHaveLength(1);expect(first.nextCursor).toBeTruthy();
 await go(page,e.data.courses.C1,'/audit');
 status(await api.patch(`sections/${e.data.sections.S1}/enrollments/${e.id('enrollment/S1/AO/teacher')}`,{active:false}),200);
 const next=status(await api.get(path+'?resourceType=grade&limit=1&cursor='+encodeURIComponent(first.nextCursor)),200).body;expect(next.items).toEqual([]);
 const refreshed=page.waitForResponse(r=>r.url().endsWith('/me'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await refreshed;
 const visible=await pages(api,path);expect(visible.every(r=>r.resourceType!=='grade')).toBe(true);expect(visible.length).toBeGreaterThan(0);
});
for(const actor of ['ST1','AS1','SA'])test(`E2E-AUDIT-005 academic audit denies unauthorized roles / ${actor} @regression`,async ({e,actorPage})=>{
 await e.graded();await e.publish();const page=await actorPage(actor),api=await e.api(actor),before=await securitySnapshot(e);
 status(await api.get(`courses/${e.data.courses.C1}/audit-events`),actor==='SA'?404:403);
 status(await (await e.api('T1')).get(`courses/${e.data.courses.C1}/audit-events`),200);
 await deniedUI(page,`/courses/${e.data.courses.C1}/audit`);await expect(page.getByRole('table')).toHaveCount(0);expect(await securitySnapshot(e)).toEqual(before);
});
test('E2E-AUDIT-008 audit snapshots omit answers marking keys and credentials / snapshots @regression',async ({e,actorPage})=>{
 const api=await e.api('AO'),q=status(await api.post(`courses/${e.data.courses.C1}/quizzes`,{title:'Audit metadata',sectionId:e.data.sections.S1,questions:[{position:1,prompt:'SECRET_QUESTION',points:1,alternatives:[{id:'a',text:'SECRET_CORRECT',isCorrect:true},{id:'b',text:'B',isCorrect:false}]}]}),201).body;
 status(await api.patch(`quizzes/${q.id}`,{instructions:'Updated instructions'}),200);status(await api.post(`quizzes/${q.id}/publish`),200);
 await e.graded();await e.publish();const page=await actorPage('AO');
 const rows=await pages(api,`courses/${e.data.courses.C1}/audit-events`),sql=(await e.pool.query('SELECT changes FROM audit_events')).rows;
 const check=(value:unknown)=>{
  const text=JSON.stringify(value);expect(text).not.toMatch(/SECRET_QUESTION|SECRET_CORRECT|"questions"|"alternatives"|"answers"|"isCorrect"|"pointsAwarded"|"accessToken"|"password"|"request"|"authorization"/i);expect(text.includes(e.password)).toBe(false);
 };
 check(rows);check(sql);expect(rows.some(r=>r.action==='quiz.published')).toBe(true);expect(rows.some(r=>r.action==='grade.published')).toBe(true);
 await go(page,e.data.courses.C1,'/audit');await expect(page.getByText('SECRET_QUESTION',{exact:true})).toHaveCount(0);
});
