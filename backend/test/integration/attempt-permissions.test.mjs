import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import service from '../../dist/attempts/attempts.service.js';
import audit from '../../dist/audit/audit.service.js';
import {database,http} from './helpers.mjs';
import {attemptFixture,tokens,request,path,users,state} from './attempt-fixtures.mjs';
test('live permissions, historical section, accumulated roles, teacher and tenant isolation',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);app=await http();const t=await tokens(app,f),id=await f.create(),p=path(id);
  await f.add(f.s1,users.inactive,'assistant');
  for(const [token,endpoint] of [[t.student,'utfsm/quiz-attempts/'+id],[t.student,path(randomUUID())],[t.admin,p]])assert.equal((await request(app,token,endpoint)).status,404);
  assert.equal((await request(app,t.assistant,p+'/cancel','POST')).status,403);
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role='student'",[users.revoked]);await f.add(f.s2,users.revoked,'student');
  assert.equal((await request(app,t.student,p)).body.sectionId,f.s1);
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role='teacher' AND section_id=$2",[users.other,f.s1]);
  assert.ok([403,404].includes((await request(app,t.teacher,p+'/cancel','POST')).status));
  await f.add(f.s2,users.owner,'teacher');await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND section_id=$2 AND role='teacher'",[users.owner,f.s1]);
  assert.equal((await request(app,t.owner,p)).status,200);
  await pool.query('UPDATE institution_memberships SET active=false WHERE user_id=$1',[users.revoked]);
  assert.equal((await request(app,t.student,p)).status,404);
  assert.equal((await request(app,t.owner,p+'/cancel','POST')).status,204);
 }finally{if(app)await app.close();await pool.end();}
});
test('same JWT revalidates user, institution, membership and enrollment; assistant+student allowed, teacher+student blocked',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);app=await http();const t=await tokens(app,f),id=await f.create(),p=path(id);
  await f.add(f.s1,users.revoked,'assistant');assert.ok(!('grade' in (await request(app,t.student,p)).body));
  for(const [table,column,idValue,status] of [['users','id',users.revoked,401],['institutions','id',f.tenants.uc,404],['institution_memberships','user_id',users.revoked,404],['enrollments','user_id',users.revoked,404]]){
   await pool.query(`UPDATE ${table} SET active=false WHERE ${column}=$1`,[idValue]);const before=await state(pool);
   for(const [suffix,method,body,key] of [['','GET'],['/answers','PUT',{answers:[]}],['/cancel','POST'],['/submit','POST',undefined,'revoked']])
    assert.equal((await request(app,t.student,p+suffix,method,body,key)).status,status);
   assert.deepEqual(await state(pool),before);await pool.query(`UPDATE ${table} SET active=true WHERE ${column}=$1`,[idValue]);
  }
  await f.add(f.s1,users.revoked,'teacher');
  assert.ok([403,404].includes((await request(app,t.student,p+'/answers','PUT',{answers:[]})).status));
  assert.equal((await request(app,t.student,f.startPath,'POST',undefined,'blocked')).status,403);
 }finally{if(app)await app.close();await pool.end();}
});

test('every attempt route rejects cross-tenant resources and other owners without changes',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);app=await http();const t=await tokens(app,f),local=await f.create(),foreign=await f.create({quiz:f.quizzes.foreign,student:users.foreign,section:f.s4});
  for(const p of ['uc/quiz-attempts/'+foreign,'utfsm/quiz-attempts/'+local]){
   const before=await state(pool);
   for(const [suffix,method,body,key] of [['','GET'],['/answers','PUT',{answers:[]}],['/cancel','POST'],['/submit','POST',undefined,'tenant']])
    assert.equal((await request(app,t.student,p+suffix,method,body,key)).status,404);
   assert.deepEqual(await state(pool),before);
  }
  assert.equal((await request(app,t.student,`uc/sections/${f.s1}/quizzes/${f.quizzes.foreign}/attempts`,'POST',undefined,'foreign')).status,404);
  await pool.query('UPDATE enrollments SET active=false WHERE user_id=$1',[users.inactive]);await f.add(f.s2,users.inactive,'student');
  for(const [suffix,method,body,key] of [['','GET'],['/answers','PUT',{answers:[]}],['/cancel','POST'],['/submit','POST',undefined,'owner']])
   assert.equal((await request(app,t.assistant,path(local)+suffix,method,body,key)).status,404);
  // An admin owner without teacher has no academic access, even if superadmin remains.
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role IN ('teacher','student')",[users.owner]);
  assert.equal((await request(app,t.owner,path(local))).status,404);
  assert.equal((await request(app,t.owner,path(local)+'/cancel','POST')).status,404);
 }finally{if(app)await app.close();await pool.end();}
});

test('invisible quiz start stays 404; foreign answers and rubric are never loaded before access',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool),q=(await pool.query('SELECT questions FROM quizzes WHERE id=$1',[f.quizzes.section])).rows[0].questions[0];
  const id=await f.create({answers:[{questionId:q.id,alternativeId:'a'}]});
  app=await http();const t=await tokens(app,f);
  const before=await state(pool),draft=await f.make({section:f.s2});
  for(const quiz of [f.quizzes.section,draft,randomUUID()])
   assert.equal((await request(app,t.assistant,`uc/sections/${f.s2}/quizzes/${quiz}/attempts`,'POST',undefined,'hidden')).status,404);
  assert.deepEqual(await state(pool),before);
  const connect=pool.connect.bind(pool),loaded=[];
  pool.connect=async()=>{
   const c=await connect(),query=c.query.bind(c),release=c.release.bind(c);
   c.query=async(...args)=>{
    const result=await query(...args);
    if(/^SELECT \* FROM public\.(quiz_attempts|quizzes)/.test(args[0]))loaded.push(result.rowCount);
    return result;
   };
   c.release=()=>{c.query=query;c.release=release;release();};return c;
  };
  try{
   const attempts=new service.AttemptsService({pool},new audit.AuditService());
   await assert.rejects(attempts.get(users.inactive,'uc',id),e=>e.getStatus()===404);
   assert.deepEqual(loaded,[]);
   await assert.rejects(attempts.start(users.inactive,'uc',f.quizzes.section,f.s2,'hidden',undefined),e=>e.getStatus()===404);
   assert.deepEqual(loaded,[]);
  }finally{pool.connect=connect;}
 }finally{if(app)await app.close();await pool.end();}
});
