import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {database,http,login} from './helpers.mjs';
import {gradebookFixture,request,tokens,users,coursePath,snapshot} from './gradebook-fixtures.mjs';

test('historical section scope, owner teacher, admin revocation and immutable sanitized history',async()=>{
 const pool=await database();let app;try{
  const f=await gradebookFixture(pool);app=await http();const t=await tokens(app,f),path=coursePath(f)+'/audit-events';
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND section_id=$2 AND role='teacher'",[users.other,f.s2]);
  await f.add(f.s2,users.inactive,'teacher');
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role='student'",[users.revoked]);
  const events=[];
  for(const [section,type,action] of [[f.s1,'grade','grade.created'],[f.s2,'grade','grade.updated'],[null,'grade','grade.published'],
   [f.s1,'quizAttempt','attempt.graded'],[null,'course','course.updated']]){
   const id=randomUUID();events.push({id,section,type});
   await pool.query(`INSERT INTO audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,course_id,section_id,changes,occurred_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'2020-01-01'::timestamptz + $10::integer*interval '1 second')`,
   [id,f.tenants.uc,users.owner,action,type,f.grades[0].id,f.own,section,{before:{grade:4,scorePercent:60,password:'legacy-secret'},after:{grade:6.5,scorePercent:90,answers:['legacy-answer'],isCorrect:true,password:'legacy-secret',token:'legacy-token',name:'safe'}},events.length]);
  }
  const foreignId=randomUUID();await pool.query(`INSERT INTO audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,course_id,section_id,changes)
   VALUES($1,$2,$3,'grade.created','grade',$4,$5,$6,'{"before":null,"after":{"grade":7}}')`,[foreignId,f.tenants.utfsm,users.foreign,f.grades[0].id,f.foreign,f.s4]);
  const before=await snapshot(pool),attempts=(await pool.query('SELECT * FROM quiz_attempts ORDER BY id')).rows;
  async function visible(token,expected){const r=await request(app,token,path);assert.equal(r.status,200);assert.deepEqual(new Set(r.body.items.map(e=>e.id)),new Set(expected));return r;}
  const owner=await visible(t.owner,events.map(e=>e.id));
  for(const e of owner.body.items){
   for(const forbidden of ['legacy-secret','legacy-answer','legacy-token','isCorrect'])assert.ok(!JSON.stringify(e).includes(forbidden));
   if(e.resourceType==='grade')assert.deepEqual(e.changes,{before:{grade:4,scorePercent:60},after:{grade:6.5,scorePercent:90}});
   else assert.ok(!JSON.stringify(e.changes).includes('grade'));
  }
  await visible(t.teacher,events.filter(e=>e.section===f.s1).map(e=>e.id));
  await visible(t.assistant,events.filter(e=>e.section===f.s2).map(e=>e.id));
  assert.equal((await request(app,t.teacher,path+'?sectionId='+f.s2)).status,404);
  const cursor=(await request(app,t.owner,path+'?limit=1')).body.nextCursor;assert.ok(cursor);
  await pool.query('UPDATE institution_memberships SET is_admin=false WHERE user_id=$1',[users.owner]);
  await visible(t.owner,events.filter(e=>e.section===f.s1).map(e=>e.id));
  const continued=await request(app,t.owner,path+'?limit=1&cursor='+cursor);assert.equal(continued.status,200);
  assert.ok(continued.body.items.every(e=>e.sectionId===f.s1));
  await app.close();app=await http();
  const foreign=await login(app,f.env,'UTFSM');
  t.owner=await login(app,f.env);
  for(const [token,url] of [[t.owner,`utfsm/courses/${f.own}/audit-events`],[foreign,path],[t.owner,`uc/courses/${f.foreign}/audit-events`]])
   assert.equal((await request(app,token,url)).status,404);
  const foreignPath=`utfsm/courses/${f.foreign}/audit-events`;await f.add(f.s4,users.foreign,'teacher',f.tenants.utfsm);
  const r=await request(app,foreign,foreignPath);assert.equal(r.status,200);assert.deepEqual(r.body.items.map(e=>e.id),[foreignId]);
  assert.equal((await request(app,foreign,foreignPath+'?cursor='+cursor)).status,400);
  assert.deepEqual(await snapshot(pool),before);assert.deepEqual((await pool.query('SELECT * FROM quiz_attempts ORDER BY id')).rows,attempts);
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role='teacher'",[users.owner]);
  assert.equal((await request(app,t.owner,path)).status,403);
 }finally{if(app)await app.close();await pool.end();}
});
