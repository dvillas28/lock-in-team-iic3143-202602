import assert from 'node:assert/strict';
import {test} from 'node:test';
import {database,http} from './helpers.mjs';
import {contentFixture,tokens,request,users,waitForLock} from './content-fixtures.mjs';
const routes=f=>[`uc/courses/${f.own}/modules`,`uc/modules/${f.modules[3]}`,`uc/modules/${f.modules[3]}/materials`,`uc/materials/${f.materials[3]}`];
test('US2 same JWT loses all four links on committed User/Institution/membership/last enrollment revocation',async()=>{
 const pool=await database();try {
  for(const kind of ['user','institution','membership','enrollment']) {
   const f=await contentFixture(pool,true),app=await http();try {
    const t=await tokens(app,f),paths=routes(f);
    const operations={user:['UPDATE users SET active=false WHERE id=$1',[users.revoked]],institution:['UPDATE institutions SET active=false WHERE id=$1',[f.tenants.uc]],membership:['UPDATE institution_memberships SET active=false WHERE institution_id=$1 AND user_id=$2',[f.tenants.uc,users.revoked]],enrollment:['UPDATE enrollments SET active=false WHERE user_id=$1',[users.revoked]]};
    const c=await pool.connect();try {
     await c.query('BEGIN');await c.query(...operations[kind]);
     const pending=request(app,t.student,paths[3]);
     const pattern={user:'%public.users%',institution:'%public.institutions%',membership:'%public.institution_memberships%',enrollment:'%public.enrollments%'}[kind];
     await waitForLock(pool,pattern);await c.query('COMMIT');assert.equal((await pending).status,kind==='user'?401:404);
    }finally{await c.query('ROLLBACK');c.release();}
    for(const path of paths)assert.equal((await request(app,t.student,path)).status,kind==='user'?401:404);
   }finally{await app.close();}
  }
 }finally{await pool.end();}
});
test('US2 role union: losing teacher retains student publication; another section retains reading',async()=>{
 const pool=await database();let app;try {
  const f=await contentFixture(pool,true);app=await http();const t=await tokens(app,f);
  await f.add(f.s2,users.revoked,'student');
  await pool.query('UPDATE enrollments SET active=false WHERE user_id=$1 AND section_id=$2',[users.revoked,f.s1]);
  for(const path of routes(f))assert.equal((await request(app,t.student,path)).status,200);
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role='teacher'",[users.owner]);
  assert.equal((await request(app,t.owner,`uc/modules/${f.modules[0]}`)).status,404);
  for(const path of routes(f))assert.equal((await request(app,t.owner,path)).status,200);
 }finally{if(app)await app.close();await pool.end();}
});
test('US2 visibility races use course lock: hide first denies, read first finishes before hide',async()=>{
 const pool=await database();let app;const blocker=await pool.connect();try {
  const f=await contentFixture(pool,true);app=await http();const t=await tokens(app,f),path=`uc/materials/${f.materials[3]}`;
  for(const table of ['course_modules','materials']) {
   const id=table==='course_modules'?f.modules[3]:f.materials[3];
   await blocker.query('BEGIN');await blocker.query('SELECT id FROM courses WHERE id=$1 FOR UPDATE',[f.own]);await blocker.query(`UPDATE ${table} SET published_at=NULL WHERE id=$1`,[id]);
   let pending=request(app,t.student,path);await waitForLock(pool,'SELECT * FROM public.courses%');await blocker.query('COMMIT');assert.equal((await pending).status,404);
   assert.equal((await request(app,t.student,path)).status,404);await pool.query(`UPDATE ${table} SET published_at=now() WHERE id=$1`,[id]);
   await blocker.query('BEGIN');await blocker.query('SELECT id FROM enrollments WHERE user_id=$1 FOR UPDATE',[users.revoked]);
   pending=request(app,t.student,path);await waitForLock(pool,'%public.enrollments%');
   const hide=(async()=>{const c=await pool.connect();try{await c.query('BEGIN');await c.query('SELECT id FROM courses WHERE id=$1 FOR UPDATE',[f.own]);await c.query(`UPDATE ${table} SET published_at=NULL WHERE id=$1`,[id]);await c.query('COMMIT');}finally{await c.query('ROLLBACK');c.release();}})();
   await waitForLock(pool,'SELECT id FROM courses%');await blocker.query('COMMIT');assert.equal((await pending).status,200);await hide;
   assert.equal((await request(app,t.student,path)).status,404);await pool.query(`UPDATE ${table} SET published_at=now() WHERE id=$1`,[id]);
  }
  await blocker.query('BEGIN');await blocker.query('SELECT id FROM courses WHERE id=$1 FOR UPDATE',[f.own]);
  const reading=request(app,t.student,path);await waitForLock(pool,'SELECT * FROM public.courses%');
  const revoke=pool.query('UPDATE institution_memberships SET active=false WHERE user_id=$1 AND institution_id=$2',[users.revoked,f.tenants.uc]);await waitForLock(pool,'UPDATE institution_memberships%');
  await blocker.query('COMMIT');assert.equal((await reading).status,200);await revoke;assert.equal((await request(app,t.student,path)).status,404);
 }finally{await blocker.query('ROLLBACK');blocker.release();if(app)await app.close();await pool.end();}
});
test('US2 rolled-back revocation releases the waiting reader without removing access',async()=>{
 const pool=await database();let app;const blocker=await pool.connect();try{
  const f=await contentFixture(pool,true);app=await http();const t=await tokens(app,f),path=`uc/materials/${f.materials[3]}`;
  await blocker.query('BEGIN');await blocker.query('UPDATE institution_memberships SET active=false WHERE user_id=$1 AND institution_id=$2',[users.revoked,f.tenants.uc]);
  const read=request(app,t.student,path);await waitForLock(pool,'%public.institution_memberships%');await blocker.query('ROLLBACK');assert.equal((await read).status,200);
  assert.equal((await request(app,t.student,path)).status,200);assert.equal((await pool.query('SELECT * FROM audit_events')).rowCount,0);
 }finally{await blocker.query('ROLLBACK');blocker.release();if(app)await app.close();await pool.end();}
});
