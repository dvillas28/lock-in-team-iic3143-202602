import {randomUUID} from 'node:crypto';
import {attemptFixture,request,tokens,users,queued,waitForLock,question} from './attempt-fixtures.mjs';
export {request,tokens,users,queued,waitForLock,question};
export const coursePath=f=>`uc/courses/${f.own}`;
export const selection=f=>({gradeItemIds:[f.items.section],sectionIds:[f.s1],studentIds:[users.revoked]});
export const snapshot=async pool=>Promise.all(['courses','grade_items','grades','grade_publications','audit_events'].map(async t=>(await pool.query(`SELECT * FROM ${t} ORDER BY id`)).rows));
export async function gradebookFixture(pool,{published=false,sc=false}={}) {
 const f=await attemptFixture(pool),items={};
 if(sc)for(const name of ['third','fourth'])f.quizzes[name]=await f.make({published:true,section:f.s1});
 for(const [name,id] of Object.entries(f.quizzes)) {
  const row=(await pool.query('SELECT id FROM grade_items WHERE quiz_id=$1',[id])).rows[0];if(row)items[name]=row.id;
 }
 const names=sc?['section','global','second','third','fourth']:['section','global','second'];
 for(const [index,name] of names.entries())await pool.query('UPDATE grade_items SET weight_percent=$1 WHERE id=$2',[(sc?[15,15,25,10,35]:[40,30,30])[index],items[name]]);
 await pool.query('UPDATE grade_items SET weight_percent=100 WHERE id=$1',[items.foreign]);
 const graded=async({quiz=f.quizzes.section,student=users.revoked,section=f.s1,grade=6.5,percent=90,number=1,published=false}={})=>{
  const attempt=await f.create({quiz,student,section,status:'graded',grade,percent,number,answers:[{questionId:question.id??randomUUID(),alternativeId:'a',isCorrect:true,pointsAwarded:2.5}]}),id=randomUUID();
  const item=(await pool.query('SELECT id FROM grade_items WHERE quiz_id=$1',[quiz])).rows[0].id;
  const tenant=(await pool.query('SELECT institution_id FROM quizzes WHERE id=$1',[quiz])).rows[0].institution_id;
  await pool.query(`INSERT INTO grades(id,institution_id,grade_item_id,quiz_id,student_id,section_id,attempt_id,score_percent,grade_value,published_at)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,CASE WHEN $10 THEN now() END)`,[id,tenant,item,quiz,student,section,attempt,percent,grade,published]);return {id,attempt,item};
 };
 const grades=[];
 for(const [i,name] of names.entries())grades.push(await graded({quiz:f.quizzes[name],section:name==='second'?f.s2:f.s1,grade:(sc?[6.5,6.8,5.1,7.0,2]:[6.5,6.8,5.1])[i],published:published && (!sc || i<4)}));
 return {...f,items,grades,graded};
}
