import assert from 'node:assert/strict';
import {test} from 'node:test';
import {database,http} from './helpers.mjs';
import {attemptFixture,tokens,request,path,queued,users} from './attempt-fixtures.mjs';
test('US1 deterministic Course lock barriers: double start, save/save, save/cancel and author/start',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);app=await http();const t=await tokens(app,f);
  const started=await queued(pool,f.own,()=>request(app,t.student,f.startPath,'POST',undefined,'A'),()=>request(app,t.student,f.startPath,'POST',undefined,'B'));
  assert.deepEqual(started.map(r=>r.status),[201,409]);const id=started[0].body.id;
  const q=(await pool.query('SELECT questions FROM quizzes WHERE id=$1',[f.quizzes.section])).rows[0].questions[0];
  const save=a=>()=>request(app,t.student,path(id)+'/answers','PUT',{answers:[{questionId:q.id,alternativeId:a}]});
  assert.deepEqual((await queued(pool,f.own,save('a'),save('b'))).map(r=>r.status),[200,200]);
  assert.equal((await request(app,t.student,path(id))).body.answers[0].alternativeId,'b');
  const cancel=()=>request(app,t.student,path(id)+'/cancel','POST');
  assert.deepEqual((await queued(pool,f.own,save('a'),cancel)).map(r=>r.status),[200,204]);
  assert.deepEqual((await pool.query('SELECT answers FROM quiz_attempts WHERE id=$1',[id])).rows[0].answers,[{questionId:q.id,alternativeId:'a'}]);
  const second=await request(app,t.student,f.startPath,'POST',undefined,'B');
  assert.equal(second.body.attemptNumber,2);
  assert.deepEqual((await queued(pool,f.own,()=>request(app,t.student,path(second.body.id)+'/cancel','POST'),()=>request(app,t.student,path(second.body.id)+'/answers','PUT',{answers:[]}))).map(r=>r.status),[204,409]);
  for(const order of ['start','edit']){
   const quiz=await f.make({published:true}),start=()=>request(app,t.student,`uc/sections/${f.s1}/quizzes/${quiz}/attempts`,'POST',undefined,quiz);
   const edit=()=>request(app,t.teacher,'uc/quizzes/'+quiz,'PATCH',{questions:[]});
   const r=await queued(pool,f.own,order==='start'?start:edit,order==='start'?edit:start);
   assert.deepEqual(r.map(x=>x.status),order==='start'?[201,409]:[409,201]);
  }
  const quiz=await f.make({published:true}),route=`uc/sections/${f.s1}/quizzes/${quiz}/attempts`;
  const r=await queued(pool,f.own,()=>request(app,t.student,route,'POST',undefined,'same'),()=>request(app,t.student,route,'POST',undefined,'same'));
  assert.deepEqual(r.map(x=>x.status),[201,201]);assert.deepEqual(r[0].body,r[1].body);
  assert.equal((await pool.query("SELECT * FROM quiz_attempts WHERE quiz_id=$1 AND student_id=$2 AND status='in_progress'",[quiz,users.revoked])).rowCount,1);
 }finally{if(app)await app.close();await pool.end();}
});
test('US2 deterministic submit races: same/different keys, save/submit and submit/cancel both orders',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);app=await http();const t=await tokens(app,f);
  for(const same of [true,false]){
   const quiz=await f.make({published:true}),id=await f.create({quiz}),submit=key=>()=>request(app,t.student,path(id)+'/submit','POST',undefined,key);
   const r=await queued(pool,f.own,submit(id+'A'),submit(id+(same?'A':'B')));
   assert.deepEqual(r.map(x=>x.status),[200,same?200:409]);if(same)assert.deepEqual(r[0].body,r[1].body);
   assert.equal((await pool.query('SELECT * FROM grades WHERE quiz_id=$1',[quiz])).rowCount,1);
   assert.equal((await pool.query("SELECT * FROM audit_events WHERE action='attempt.graded' AND resource_id=$1",[id])).rowCount,1);
  }
  for(const other of ['save','cancel'])for(const first of ['submit','other']){
   const quiz=await f.make({published:true}),id=await f.create({quiz}),q=(await pool.query('SELECT questions FROM quizzes WHERE id=$1',[quiz])).rows[0].questions[0];
   const submit=()=>request(app,t.student,path(id)+'/submit','POST',undefined,id);
   const operation=()=>request(app,t.student,path(id)+(other==='save'?'/answers':'/cancel'),other==='save'?'PUT':'POST',other==='save'?{answers:[{questionId:q.id,alternativeId:'a'}]}:undefined);
   const r=await queued(pool,f.own,first==='submit'?submit:operation,first==='submit'?operation:submit);
   assert.deepEqual(r.map(x=>x.status),first==='submit'?[200,409]:other==='save'?[200,200]:[204,409]);
   const a=(await pool.query('SELECT * FROM quiz_attempts WHERE id=$1',[id])).rows[0];
   assert.equal(a.status,first==='other' && other==='cancel'?'cancelled':'graded');
   if(other==='save')assert.equal(a.grade_value,first==='other'?'7.0':'1.0');
  }
 }finally{if(app)await app.close();await pool.end();}
});

async function publishSQL(pool,tenant,course,quiz,student) {
 const c=await pool.connect();try{
  await c.query('BEGIN');await c.query('SELECT * FROM public.courses WHERE id=$1 FOR UPDATE',[course]);
  await c.query('SELECT id FROM quizzes WHERE institution_id=$1 AND id=$2 FOR UPDATE',[tenant,quiz]);
  const attempts=(await c.query('SELECT * FROM quiz_attempts WHERE institution_id=$1 AND quiz_id=$2 AND student_id=$3 ORDER BY id FOR UPDATE',[tenant,quiz,student])).rows;
  if(attempts.some(a=>a.status==='in_progress')){await c.query('ROLLBACK');return {status:409};}
  await c.query('SELECT id FROM grades WHERE institution_id=$1 AND quiz_id=$2 AND student_id=$3 FOR UPDATE',[tenant,quiz,student]);
  await c.query('UPDATE courses SET grade_items_locked_at=COALESCE(grade_items_locked_at,clock_timestamp()) WHERE id=$1',[course]);
  await c.query('UPDATE grades SET published_at=clock_timestamp(),updated_at=clock_timestamp() WHERE institution_id=$1 AND quiz_id=$2 AND student_id=$3 AND published_at IS NULL',[tenant,quiz,student]);
  await c.query(`INSERT INTO audit_events(id,institution_id,actor_user_id,course_id,action,resource_type,resource_id,changes)
   VALUES(gen_random_uuid(),$1,$2,$3,'grade.published','grade',$4,'{}')`,[tenant,users.owner,course,quiz]);
  await c.query('COMMIT');return {status:200};
 }finally{await c.query('ROLLBACK');c.release();}
}
test('SQL publication protocol races start/submit/cancel in both deterministic lock orders (no future HTTP endpoint)',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);app=await http();const t=await tokens(app,f),quizzes=[];
  for(let i=0;i<6;i++)quizzes.push(await f.make({published:true}));
  for(const operation of ['start','submit','cancel'])for(const first of ['operation','publication']){
   const quiz=quizzes.shift(),old=await f.create({quiz,status:'graded',percent:100,grade:7});
   await pool.query(`INSERT INTO grades(id,institution_id,grade_item_id,quiz_id,student_id,section_id,attempt_id,score_percent,grade_value)
    SELECT gen_random_uuid(),$1,id,$2,$3,$4,$5,100,7 FROM grade_items WHERE quiz_id=$2`,[f.tenants.uc,quiz,users.revoked,f.s1,old]);
   const id=operation==='start'?null:await f.create({quiz,number:2});
   const mutate=()=>operation==='start'?request(app,t.student,`uc/sections/${f.s1}/quizzes/${quiz}/attempts`,'POST',undefined,quiz):request(app,t.student,path(id)+'/'+operation,'POST',undefined,quiz);
   const publish=()=>publishSQL(pool,f.tenants.uc,f.own,quiz,users.revoked);
   const r=await queued(pool,f.own,first==='operation'?mutate:publish,first==='operation'?publish:mutate);
   const expected=first==='operation'?(operation==='start'?[201,409]:operation==='submit'?[200,200]:[204,200]):operation==='start'?[200,409]:operation==='submit'?[409,200]:[409,204];
   assert.deepEqual(r.map(x=>x.status),expected);
   const grades=(await pool.query('SELECT * FROM grades WHERE quiz_id=$1',[quiz])).rows;assert.equal(grades.length,1);
   if(grades[0].published_at)assert.equal((await pool.query("SELECT * FROM quiz_attempts WHERE quiz_id=$1 AND status='in_progress'",[quiz])).rowCount,0);
  }
 }finally{if(app)await app.close();await pool.end();}
});

test('real HTTP authoring publication versus start has both serial outcomes',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);app=await http();const t=await tokens(app,f);
  for(const first of ['start','publish']){
   const quiz=await f.make(),start=()=>request(app,t.student,`uc/sections/${f.s1}/quizzes/${quiz}/attempts`,'POST',undefined,quiz);
   const publish=()=>request(app,t.teacher,'uc/quizzes/'+quiz+'/publish','POST');
   const r=await queued(pool,f.own,first==='start'?start:publish,first==='start'?publish:start);
   assert.deepEqual(r.map(x=>x.status),first==='start'?[404,200]:[200,201]);
   assert.equal((await pool.query('SELECT * FROM quiz_attempts WHERE quiz_id=$1',[quiz])).rowCount,first==='start'?0:1);
  }
 }finally{if(app)await app.close();await pool.end();}
});
