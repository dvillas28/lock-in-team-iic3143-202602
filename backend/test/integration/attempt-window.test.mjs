import assert from 'node:assert/strict';
import {test} from 'node:test';
import {database,http} from './helpers.mjs';
import {attemptFixture,tokens,request,path,state,waitForLock} from './attempt-fixtures.mjs';
import access from '../../dist/attempts/attempt-access.js';
test('DB window NULL limits, inclusive open/exclusive close; save/submit after lock wait reject without cancellation',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);app=await http();const t=await tokens(app,f);
  for(const op of ['start','save','submit']){
   const quiz=await f.make({published:true}),id=op==='start'?null:await f.create({quiz}),c=await pool.connect();let pending;
   try{
    await c.query('BEGIN');await c.query('SELECT * FROM public.courses WHERE id=$1 FOR UPDATE',[f.own]);
    pending=op==='start'?request(app,t.student,`uc/sections/${f.s1}/quizzes/${quiz}/attempts`,'POST',undefined,quiz):request(app,t.student,path(id)+(op==='save'?'/answers':'/submit'),op==='save'?'PUT':'POST',op==='save'?{answers:[]}:undefined,quiz);
    await waitForLock(pool,'SELECT * FROM public.courses%');
    await c.query('UPDATE quizzes SET closes_at=clock_timestamp() WHERE id=$1',[quiz]);await c.query('COMMIT');
    const before=await state(pool);assert.equal((await pending).status,409);assert.deepEqual(await state(pool),before);
    if(id){assert.equal((await request(app,t.student,path(id))).body.status,'inProgress');assert.equal((await request(app,t.student,path(id)+'/cancel','POST')).status,204);}
   }finally{await c.query('ROLLBACK');c.release();if(pending)await pending;}
  }
  const c=await pool.connect();try{
   // One DB timestamp is used as both boundary and clock: exercises the actual production predicate.
   const q=(await pool.query('SELECT * FROM quizzes LIMIT 1')).rows[0];
   const query=c.query.bind(c);
   c.query=(sql,args)=>typeof sql==='string' && sql.includes('clock_timestamp() AS now')?query(sql.replace('clock_timestamp() AS now',"'2026-10-19T00:00:00Z'::timestamptz AS now"),args):query(sql,args);
   for(const [opens_at,closes_at,allowed] of [[null,null,true],['2026-10-19T00:00:00Z',null,true],[null,'2026-10-19T00:00:00Z',false],['2026-10-19T00:00:01Z',null,false]]){
    if(allowed)await access.requireWindow(c,{...q,opens_at,closes_at});else await assert.rejects(access.requireWindow(c,{...q,opens_at,closes_at}),e=>e.getStatus()===409);
   }
  }finally{c.release();}
 }finally{if(app)await app.close();await pool.end();}
});
