import assert from 'node:assert/strict';
import {test} from 'node:test';
import {database,http} from './helpers.mjs';
import {quizFixture,tokens,request,question,users,waitForLock} from './quiz-fixtures.mjs';
const layers=f=>[
 {sql:'UPDATE users SET active=$1 WHERE id=$2',args:[false,users.owner],wait:'SELECT id FROM public.users%',get:401,create:401},
 {sql:'UPDATE institutions SET active=$1 WHERE id=$2',args:[false,f.tenants.uc],wait:'SELECT id FROM public.institutions%',get:404,create:404},
 {sql:'UPDATE institution_memberships SET active=$1 WHERE institution_id=$2 AND user_id=$3',args:[false,f.tenants.uc,users.owner],wait:'SELECT m.id FROM public.institution_memberships%',get:404,create:404},
 {sql:"UPDATE enrollments SET active=$1 WHERE section_id=$2 AND user_id=$3 AND role='teacher'",args:[false,f.s1,users.owner],wait:'%public.enrollments%',get:404,create:403},
 {sql:'UPDATE institution_memberships SET is_admin=$1 WHERE institution_id=$2 AND user_id=$3',args:[false,f.tenants.uc,users.owner],wait:'SELECT m.id FROM public.institution_memberships%',get:404,create:403},
];
test('US2 stale links and US1 writes revalidate every revoked layer, retaining independent roles',async()=>{
 const pool=await database();let app;try{
  const f=await quizFixture(pool,true);app=await http();const t=await tokens(app,f),path='uc/quizzes/'+f.quizzes.globalDraft;
  for(const layer of layers(f)){
   await pool.query(layer.sql,layer.args);
   assert.equal((await request(app,t.owner,path+'/authoring')).status,layer.get);
   assert.equal((await request(app,t.owner,`uc/courses/${f.own}/quizzes`,'POST',{title:'Denied',questions:[question]})).status,layer.create);
   assert.equal((await request(app,t.owner,path,'PATCH',{title:'Denied'})).status,layer.get);
   assert.equal((await request(app,t.owner,path+'/publish','POST')).status,layer.get);
   if(layer.create===403)assert.equal((await request(app,t.owner,'uc/quizzes/'+f.quizzes.global)).status,200);
   await pool.query(layer.sql,[true,...layer.args.slice(1)]);
  }
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role='student'",[users.revoked]);
  assert.equal((await request(app,t.student,'uc/quizzes/'+f.quizzes.section)).status,404);
  assert.equal((await pool.query('SELECT * FROM audit_events')).rowCount,0);
 }finally{if(app)await app.close();await pool.end();}
});
test('US1 revocation vs each create/PATCH/publish serializes in both commit orders for every layer',async()=>{
 const pool=await database();let app;try{
  const f=await quizFixture(pool);app=await http();const t=await tokens(app,f);
  await pool.query('CREATE TABLE quiz_test_gate(id integer PRIMARY KEY); INSERT INTO quiz_test_gate VALUES(1)');
  await pool.query("CREATE FUNCTION quiz_audit_gate() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM id FROM quiz_test_gate WHERE id=1 FOR UPDATE; RETURN NEW; END $$; CREATE TRIGGER quiz_audit_gate BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION quiz_audit_gate()");
  for(const layer of layers(f))for(const method of ['create','patch','publish'])for(const writeFirst of [false,true]){
   const id=await f.make({section:null}),path='uc/quizzes/'+id;
   const write=()=>method==='create'?request(app,t.owner,`uc/courses/${f.own}/quizzes`,'POST',{title:'Created',questions:[question]}):
    request(app,t.owner,path+(method==='publish'?'/publish':''),method==='publish'?'POST':'PATCH',method==='publish'?undefined:{title:'Changed'});
   const c=await pool.connect();let pending,revoke;
   try{
    await c.query('BEGIN');
    if(writeFirst){
     await c.query('SELECT id FROM quiz_test_gate WHERE id=1 FOR UPDATE');
     pending=write();await waitForLock(pool,'INSERT INTO public.audit_events%');
     revoke=pool.query(layer.sql,layer.args);
     const target=layer.sql.startsWith('UPDATE enrollments')?'UPDATE enrollments%':layer.sql.startsWith('UPDATE users')?'UPDATE users%':layer.sql.startsWith('UPDATE institutions ')?'UPDATE institutions%':'UPDATE institution_memberships%';
     await waitForLock(pool,target);await c.query('COMMIT');
     assert.equal((await pending).status,method==='create'?201:200);await revoke;
    }else{
     await c.query(layer.sql,layer.args);pending=write();await waitForLock(pool,layer.wait);await c.query('COMMIT');
     assert.equal((await pending).status,method==='create'?layer.create:layer.get);
    }
   }finally{await c.query('ROLLBACK');c.release();await Promise.allSettled([pending,revoke]);}
   await pool.query(layer.sql,[true,...layer.args.slice(1)]);
  }
 }finally{if(app)await app.close();await pool.end();}
});
