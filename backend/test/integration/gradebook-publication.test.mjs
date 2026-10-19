import test from 'node:test';
import assert from 'node:assert/strict';

import {database,http,sanitized} from './helpers.mjs';
import {gradebookFixture,request,tokens,users,selection,coursePath,snapshot,question} from './gradebook-fixtures.mjs';
import {failAudit,restoreAudit} from './course-fixtures.mjs';
test('explicit publication is all-or-nothing, durable, immutable and authorized on replay',async()=>{
 const pool=await database();let app;try{
 const f=await gradebookFixture(pool);app=await http();let t=await tokens(app,f);const path=coursePath(f)+'/gradebook/publications',body=selection(f),before=await snapshot(pool);
 for(const input of [{...body,studentIds:[users.revoked,users.inactive]},{...body,gradeItemIds:[...body.gradeItemIds,f.items.second]},{...body,sectionIds:[f.s2]}]) {
  assert.equal((await request(app,t.owner,path,'POST',input,'fail')).status,409);assert.deepEqual(await snapshot(pool),before);
 }
 const cancelled=await f.create({number:2,status:'cancelled'});
 await pool.query('UPDATE grades SET attempt_id=$1 WHERE id=$2',[cancelled,f.grades[0].id]);
 assert.equal((await request(app,t.owner,path,'POST',body,'ungraded')).status,409);
 await pool.query('UPDATE grades SET attempt_id=$1 WHERE id=$2',[f.grades[0].attempt,f.grades[0].id]);
 const active=await f.create({number:3});assert.equal((await request(app,t.owner,path,'POST',body,'fail')).status,409);
 await pool.query("UPDATE quiz_attempts SET status='cancelled',cancelled_at=now() WHERE id=$1",[active]);
 for(const grade of f.grades.slice(0,2)) {
  await failAudit(pool,'grade.published',grade.id);const snap=await snapshot(pool);
  assert.equal((await request(app,t.owner,path,'POST',{...body,gradeItemIds:[f.items.section,f.items.global]},'audit-sentinel-key')).status,500);
  assert.deepEqual(await snapshot(pool),snap);await restoreAudit(pool);
 }
 await pool.query("CREATE FUNCTION fail_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'receipt failure'; END $$; CREATE TRIGGER fail_receipt BEFORE INSERT ON grade_publications FOR EACH ROW EXECUTE FUNCTION fail_receipt()");
 const snap=await snapshot(pool);assert.equal((await request(app,t.owner,path,'POST',{...body,gradeItemIds:[f.items.section,f.items.global]},'audit-sentinel-key')).status,500);assert.deepEqual(await snapshot(pool),snap);
 await pool.query('DROP TRIGGER fail_receipt ON grade_publications; DROP FUNCTION fail_receipt()');
 const published=await request(app,t.owner,path,'POST',{...body,gradeItemIds:[f.items.section,f.items.global]},'audit-sentinel-key');assert.equal(published.status,200);assert.equal(published.body.publishedCount,2);
 assert.equal((await pool.query("SELECT count(DISTINCT published_at) AS n FROM grades WHERE published_at IS NOT NULL")).rows[0].n,'1');
 const confirmed=await snapshot(pool);
 assert.deepEqual((await request(app,t.owner,path,'POST',{...body,gradeItemIds:[f.items.global,f.items.section]},'audit-sentinel-key')).body,published.body);assert.deepEqual(await snapshot(pool),confirmed);
 assert.equal((await request(app,t.owner,path,'POST',body,'audit-sentinel-key')).status,409);
 assert.equal((await request(app,t.owner,path,'POST',body,'other-key')).body.code,'GRADE_ALREADY_PUBLISHED');
 const logs=await app.close();sanitized(logs.output,['audit-sentinel-key',t.owner,question.prompt,'isCorrect','pointsAwarded',users.revoked]);assert.match(logs.output,/"operation":"http","outcome":"error"/);
 for(const line of logs.output.trim().split('\n'))assert.deepEqual(Object.keys(JSON.parse(line)).sort(),['category','operation','outcome']);
 app=await http();t=await tokens(app,f);assert.deepEqual((await request(app,t.owner,path,'POST',{...body,gradeItemIds:[f.items.global,f.items.section]},'audit-sentinel-key')).body,published.body);
 await pool.query('UPDATE enrollments SET active=false WHERE user_id=$1 AND role=\'teacher\'',[users.owner]);assert.equal((await request(app,t.owner,path,'POST',{...body,gradeItemIds:[f.items.global,f.items.section]},'audit-sentinel-key')).status,403);
 }finally{if(app)await app.close();await pool.end();}
});
