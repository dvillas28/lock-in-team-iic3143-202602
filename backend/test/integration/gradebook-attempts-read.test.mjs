import test from 'node:test';
import assert from 'node:assert/strict';

import {database,http} from './helpers.mjs';
import {gradebookFixture,request,tokens,users} from './gradebook-fixtures.mjs';

test('attempt listing filters, pages and projects teacher/assistant per historical section',async()=>{
 const pool=await database();let app;try{
 const f=await gradebookFixture(pool);app=await http();const t=await tokens(app,f),path=`uc/quizzes/${f.quizzes.second}/attempts`;
 await f.create({quiz:f.quizzes.second,section:f.s2,number:2,status:'graded'});
 const assistant=await request(app,t.assistant,path+'?status=graded&limit=1');assert.equal(assistant.status,200);assert.equal(assistant.body.items.length,1);assert.equal(assistant.body.hasMore,true);
 assert.equal((await request(app,t.teacher,path+'?cursor='+assistant.body.nextCursor)).status,400);
 const next=await request(app,t.assistant,path+'?status=graded&cursor='+assistant.body.nextCursor);assert.equal(next.status,200);assert.equal(assistant.body.items[0].grade,5.1);
 assert.ok(assistant.body.items[0].answers.every(a=>!('isCorrect'in a)&&!('pointsAwarded'in a)));
 const teacher=await request(app,t.owner,path);assert.equal(teacher.status,200);assert.equal(teacher.body.items[0].answers[0].isCorrect,true);
 assert.equal((await request(app,t.student,path)).status,404);
 for(const query of ['?status=unknown','?studentId=bad','?limit=101','?extra=1'])assert.equal((await request(app,t.owner,path+query)).status,400);
 assert.equal((await request(app,t.assistant,path+'?sectionId='+f.s1)).status,404);
 }finally{if(app)await app.close();await pool.end();}
});
test('staff listing uses assistant projection for own attempts with accumulated student role',async()=>{
 const pool=await database();let app;try{
 const f=await gradebookFixture(pool);await f.add(f.s2,users.revoked,'assistant');app=await http();const t=await tokens(app,f);
 const result=await request(app,t.student,`uc/quizzes/${f.quizzes.second}/attempts`);assert.equal(result.status,200);assert.equal(result.body.items[0].grade,5.1);
 assert.equal(result.body.items[0].studentId,users.revoked);assert.ok(result.body.items[0].answers.every(a=>!('isCorrect'in a)&&!('pointsAwarded'in a)));
 }finally{if(app)await app.close();await pool.end();}
});
