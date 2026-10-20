import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {database,http} from './helpers.mjs';
import {gradebookFixture,request,tokens,users,coursePath} from './gradebook-fixtures.mjs';

test('history sanitizes legacy payloads, filters and preserves admin-owner exception',async()=>{
 const pool=await database();let app;try{
 const f=await gradebookFixture(pool);app=await http();const t=await tokens(app,f),path=coursePath(f)+'/audit-events';
 for(const section of [f.s1,null])await pool.query(`INSERT INTO audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,course_id,section_id,changes)
 VALUES($1,$2,$3,'grade.published','grade',$4,$5,$6,$7)`,[randomUUID(),f.tenants.uc,users.owner,f.grades[0].id,f.own,section,{before:null,after:{grade:6.5,answers:['secret-answer'],password:'secret-password',idempotencyKey:'secret-key',studentId:{secret:'nested'}}}]);
 const result=await request(app,t.owner,path+'?action=grade.published&limit=1');assert.equal(result.status,200);assert.equal(result.body.hasMore,true);assert.deepEqual(result.body.items[0].changes.after,{grade:6.5});
 assert.equal((await request(app,t.owner,path+'?from=2026-10-20T00:00:00Z&to=2026-10-19T00:00:00Z')).status,400);
 for(const token of [t.student,t.assistant])assert.equal((await request(app,token,path)).status,403);
 const teacher=await request(app,t.teacher,path+'?action=grade.published');assert.ok(teacher.body.items.every(e=>e.sectionId!==null));
 await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role='teacher'",[users.owner]);
 assert.equal((await request(app,t.owner,path)).status,200);
 }finally{if(app)await app.close();await pool.end();}
});
