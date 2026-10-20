import test from 'node:test';
import assert from 'node:assert/strict';

import {database,http} from './helpers.mjs';
import {gradebookFixture,request,tokens,users,coursePath} from './gradebook-fixtures.mjs';

test('independent SQL fixtures prove SC-002, historical rows and no student leaks',async()=>{
 const pool=await database();let app;try{
 const f=await gradebookFixture(pool,{published:true,sc:true});app=await http();const t=await tokens(app,f),path=coursePath(f);
 const own=await request(app,t.student,path+'/my-grades');assert.equal(own.status,200);assert.equal(own.body.partialAverage,6.1);assert.equal(own.body.publishedWeightPercent,65);assert.equal(own.body.isPartial,true);assert.equal(own.body.items.length,4);
 assert.ok(own.body.items.every(g=>!('studentId'in g) && !('answers'in g)));
 const teacher=await request(app,t.owner,path+'/gradebook?limit=1');assert.equal(teacher.status,200);assert.equal(teacher.body.hasMore,true);
 const second=await request(app,t.owner,path+'/gradebook?limit=1&cursor='+teacher.body.nextCursor);assert.equal(second.status,200);assert.equal(second.body.hasMore,false);assert.notEqual(teacher.body.items[0].sectionId,second.body.items[0].sectionId);
 const assistant=await request(app,t.assistant,path+'/gradebook');assert.equal(assistant.status,200);assert.ok(assistant.body.items.every(r=>r.sectionId===f.s2));
 await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND section_id=$2 AND role='student'",[users.revoked,f.s1]);await f.add(f.s2,users.revoked,'student');
 assert.deepEqual((await request(app,t.student,path+'/my-grades')).body,own.body);
 assert.equal((await request(app,t.student,path+'/my-grades?studentId='+users.owner)).status,400);
 assert.equal((await request(app,t.student,path+'/gradebook')).status,403);
 }finally{if(app)await app.close();await pool.end();}
});
test('no published grades and zero published weight return null; NUMERIC HALF_UP tie',async()=>{
 const pool=await database();let app;try{
 const f=await gradebookFixture(pool);app=await http();const t=await tokens(app,f),path=coursePath(f)+'/my-grades';
 assert.equal((await request(app,t.student,path)).body.partialAverage,null);
 await pool.query('UPDATE grade_items SET weight_percent=CASE WHEN id=$1 THEN 100 ELSE 0 END WHERE course_id=$2',[f.items.second,f.own]);
 await pool.query('UPDATE grades SET published_at=now() WHERE id=$1',[f.grades[0].id]);
 const zero=(await request(app,t.student,path)).body;assert.equal(zero.partialAverage,null);assert.equal(zero.publishedWeightPercent,0);assert.equal(zero.isPartial,true);
 assert.equal((await pool.query('SELECT round((6.0::numeric*50+6.1::numeric*50)/100,1) AS value')).rows[0].value,'6.1');
 }finally{if(app)await app.close();await pool.end();}
});

test('HALF_UP tie uses the real my-grades query with published fixture grades',async()=>{
 const pool=await database();let app;try{
 const f=await gradebookFixture(pool);
 await pool.query('UPDATE grade_items SET weight_percent=CASE WHEN id=ANY($1::uuid[]) THEN 50 ELSE 0 END WHERE course_id=$2',[[f.items.section,f.items.global],f.own]);
 // Attempt terminal snapshots stay immutable; create new graded snapshots, then repoint only unpublished Grades.
 for(const [i,grade] of [6.0,6.1].entries()){
  const quiz=i===0?f.quizzes.section:f.quizzes.global,attempt=await f.create({quiz,number:2,status:'graded',grade,percent:90});
  await pool.query('UPDATE grades SET attempt_id=$1,grade_value=$2 WHERE id=$3',[attempt,grade,f.grades[i].id]);
 }
 await pool.query('UPDATE grades SET published_at=now() WHERE id=ANY($1::uuid[])',[[f.grades[0].id,f.grades[1].id]]);
 app=await http();const t=await tokens(app,f);const result=await request(app,t.student,coursePath(f)+'/my-grades');assert.equal(result.body.partialAverage,6.1);assert.equal(result.body.publishedWeightPercent,100);
 }finally{if(app)await app.close();await pool.end();}
});
