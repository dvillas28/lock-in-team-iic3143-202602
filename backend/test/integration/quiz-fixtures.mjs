import {randomUUID} from 'node:crypto';
import {contentFixture,tokens,request,users,waitForLock} from './content-fixtures.mjs';
export {tokens,request,users,waitForLock};
export const question={prompt:'Pregunta centinela privada',position:1,points:2.5,alternatives:[{id:'a',text:'Alternativa centinela',isCorrect:true},{id:'b',text:'Otra opción',isCorrect:false}]};
export async function quizFixture(pool,seed=false) {
 const f=await contentFixture(pool);
 await f.add(f.s1,users.other,'teacher');
 const make=async({course=f.own,tenant=f.tenants.uc,section=f.s1,published=false,creator=users.owner,questions=[{...question,id:randomUUID()}]}={})=>{
  const id=randomUUID();await pool.query(`INSERT INTO quizzes(id,institution_id,course_id,section_id,title,questions,created_by,published_at)
   VALUES($1,$2,$3,$4,'Control',$5,$6,CASE WHEN $7 THEN now() END)`,[id,tenant,course,section,JSON.stringify(questions),creator,published]);
  if(published)await pool.query("INSERT INTO grade_items(id,institution_id,course_id,quiz_id,title) VALUES($1,$2,$3,$4,'Control')",[randomUUID(),tenant,course,id]);
  return id;
 };
 const quizzes=seed?{draft:await make(),section:await make({published:true}),global:await make({section:null,published:true}),
  globalDraft:await make({section:null}),second:await make({section:f.s2,published:true}),
  foreign:await make({course:f.foreign,tenant:f.tenants.utfsm,section:f.s4,published:true,creator:users.foreign})}:{};
 return {...f,make,quizzes};
}
export async function queued(pool,course,first,second) {
 const blocker=await pool.connect();let a,b;
 try {
  await blocker.query('BEGIN');await blocker.query('SELECT id FROM courses WHERE id=$1 FOR UPDATE',[course]);
  a=first();await waitForLock(pool,'SELECT * FROM public.courses%');
  b=second();await waitForLock(pool,'SELECT * FROM public.courses%',2);
  await blocker.query('COMMIT');return await Promise.all([a,b]);
 }finally{await blocker.query('ROLLBACK');blocker.release();await Promise.allSettled([a,b]);}
}
export const snapshot=pool=>Promise.all(['quizzes','grade_items','audit_events'].map(async table=>(await pool.query(`SELECT * FROM ${table} ORDER BY id`)).rows));
