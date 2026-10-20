import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {quizFixture,tokens,users,question,queued,waitForLock} from './quiz-fixtures.mjs';
export {tokens,users,question,queued,waitForLock};
export async function attemptFixture(pool) {
 const f=await quizFixture(pool,true);
 const create=async({quiz=f.quizzes.section,student=users.revoked,section=f.s1,number=1,answers=[],status='in_progress',score=0,percent=0,grade=1}={})=>{
  const q=(await pool.query('SELECT * FROM quizzes WHERE id=$1',[quiz])).rows[0],id=randomUUID();
  await pool.query(`INSERT INTO quiz_attempts(id,institution_id,course_id,quiz_id,section_id,student_id,attempt_number,status,answers,start_key,submit_key,submitted_at,cancelled_at,score_points,score_percent,grade_value)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8::text,$9,$10::text,CASE WHEN $8::text='graded' THEN $10::text END,CASE WHEN $8::text='graded' THEN now() END,CASE WHEN $8::text='cancelled' THEN now() END,
   CASE WHEN $8::text='graded' THEN $11::numeric END,CASE WHEN $8::text='graded' THEN $12::numeric END,CASE WHEN $8::text='graded' THEN $13::numeric END)`,
   [id,q.institution_id,q.course_id,quiz,section,student,number,status,JSON.stringify(answers),randomUUID(),score,percent,grade]);return id;
 };
 return {...f,create,startPath:`uc/sections/${f.s1}/quizzes/${f.quizzes.section}/attempts`};
}
export async function request(app,token,path,method='GET',body,key) {
 const response=await fetch(app.base+'/api/v1/institutions/'+path,{method,headers:{Authorization:'Bearer '+token,
  ...(body===undefined?{}:{'Content-Type':'application/json'}),...(key===undefined?{}:{'Idempotency-Key':key})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 assert.equal(response.headers.get('cache-control'),'no-store');
 return {status:response.status,body:response.status===204?null:await response.json(),headers:response.headers};
}
export const path=id=>'uc/quiz-attempts/'+id;
export const state=async pool=>Promise.all(['quiz_attempts','grades','audit_events'].map(async table=>(await pool.query(`SELECT * FROM ${table} ORDER BY id`)).rows));
