import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {database,http} from './helpers.mjs';
import {gradebookFixture,request,tokens,users,coursePath} from './gradebook-fixtures.mjs';

test('owner student without teacher submits legitimately but cannot read own or other grade history',async()=>{
 const pool=await database();let app;try{
  const f=await gradebookFixture(pool);app=await http();const t=await tokens(app,f),base=coursePath(f),audit=base+'/audit-events';
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role='teacher'",[users.owner]);
  const start=await request(app,t.owner,f.startPath,'POST',{},randomUUID());assert.equal(start.status,201);
  const attempt=`uc/quiz-attempts/${start.body.id}`;
  assert.equal((await request(app,t.owner,attempt+'/submit','POST',{},randomUUID())).status,200);
  const grade=(await pool.query('SELECT * FROM grades WHERE attempt_id=$1',[start.body.id])).rows[0];
  assert.ok(grade);assert.equal(grade.published_at,null);
  const detail=await request(app,t.owner,attempt);assert.equal(detail.status,200);
  for(const key of ['grade','scorePercent','scorePoints','gradeValue'])assert.ok(!(key in detail.body));
  assert.deepEqual((await request(app,t.owner,base+'/my-grades')).body.items,[]);
  const hidden=await request(app,t.owner,audit+'?resourceType=grade');assert.equal(hidden.status,200);
  assert.deepEqual(hidden.body,{items:[],hasMore:false,nextCursor:null},'grade events exposed to owner without teacher');
  // A second legitimate attempt creates grade.updated, without granting pauta access.
  const second=await request(app,t.owner,f.startPath,'POST',{},randomUUID());assert.equal(second.status,201);
  assert.equal((await request(app,t.owner,`uc/quiz-attempts/${second.body.id}/submit`,'POST',{},randomUUID())).status,200);
  await pool.query(`INSERT INTO audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,course_id,section_id,changes)
   VALUES($1,$2,$3,'grade.created','grade',$4,$5,$6,$7)`,[randomUUID(),f.tenants.uc,users.other,f.grades[0].id,f.own,f.s1,{before:null,after:{grade:6.5}}]);
  const checks=['resourceType=grade','action=grade.created','action=grade.updated','action=grade.published',`resourceId=${grade.id}`,
   `resourceType=grade&actorUserId=${users.owner}`,`resourceType=grade&sectionId=${f.s1}`,
   'resourceType=grade&from=2000-01-01T00:00:00Z&to=2100-01-01T00:00:00Z'];
  async function privateHistory(){
   for(const query of checks){const r=await request(app,t.owner,audit+'?'+query);assert.equal(r.status,200);assert.deepEqual(r.body,{items:[],hasMore:false,nextCursor:null});}
   const all=(await request(app,t.owner,audit)).body;assert.ok(all.items.length>0);assert.ok(all.items.every(e=>e.resourceType!=='grade'));
   const ids=[];let cursor=null;
   do{const r=await request(app,t.owner,audit+'?limit=1'+(cursor?'&cursor='+cursor:''));assert.equal(r.status,200);
    assert.equal(r.body.items.length,1);assert.ok(r.body.items.every(e=>e.resourceType!=='grade'));ids.push(r.body.items[0].id);
    assert.equal(r.body.hasMore,r.body.nextCursor!==null);cursor=r.body.nextCursor;
   }while(cursor);
   assert.equal(new Set(ids).size,ids.length);
   const allowed=(await pool.query("SELECT id FROM audit_events WHERE course_id=$1 AND resource_type<>'grade' ORDER BY occurred_at,id",[f.own])).rows.map(e=>e.id);
   assert.deepEqual(ids,allowed);
  }
  await privateHistory();
  const published=await request(app,t.teacher,base+'/gradebook/publications','POST',{
   gradeItemIds:[f.items.section],sectionIds:[f.s1],studentIds:[users.owner,users.revoked]},randomUUID());assert.equal(published.status,200);
  const own=await request(app,t.owner,base+'/my-grades');assert.equal(own.status,200);assert.equal(own.body.items.length,1);
  assert.equal(own.body.items[0].gradeItemId,grade.grade_item_id);assert.equal(own.body.items[0].grade,1);await privateHistory();
  for(const token of [t.student,t.assistant])assert.equal((await request(app,token,audit)).status,403);
  assert.equal((await request(app,t.admin,audit)).status,404);
 }finally{if(app)await app.close();await pool.end();}
});

test('grade-only history is empty and old cursors revalidate roles, context and active identity',async()=>{
 const pool=await database();let app;try{
  const f=await gradebookFixture(pool);app=await http();const t=await tokens(app,f),path=coursePath(f)+'/audit-events';
  for(let i=0;i<3;i++)await pool.query(`INSERT INTO audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,course_id,section_id,changes)
   VALUES($1,$2,$3,'grade.created','grade',$4,$5,$6,$7)`,[randomUUID(),f.tenants.uc,users.owner,f.grades[0].id,f.own,f.s1,{before:null,after:{grade:6.5}}]);
  const page=await request(app,t.owner,path+'?limit=1');assert.equal(page.status,200);assert.equal(page.body.hasMore,true);
  const continuation=path+'?limit=1&cursor='+page.body.nextCursor;
  for(const [token,url] of [[t.teacher,continuation],[t.owner,continuation+'&resourceType=grade'],[t.owner,continuation.replace(f.own,f.other)]])
   assert.equal((await request(app,token,url)).status,400);
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role='teacher'",[users.owner]);
  for(const url of [path,continuation]){const r=await request(app,t.owner,url);assert.equal(r.status,200);assert.deepEqual(r.body,{items:[],hasMore:false,nextCursor:null});}
  for(const [table,where,status] of [['users','id=$1',401],['institution_memberships','user_id=$1',404],['institutions','id=$1',404]]){
   const id=table==='institutions'?f.tenants.uc:users.owner;
   await pool.query(`UPDATE ${table} SET active=false WHERE ${where}`,[id]);
   for(const url of [path,continuation])assert.equal((await request(app,t.owner,url)).status,status);
   await pool.query(`UPDATE ${table} SET active=true WHERE ${where}`,[id]);
  }
 }finally{if(app)await app.close();await pool.end();}
});
