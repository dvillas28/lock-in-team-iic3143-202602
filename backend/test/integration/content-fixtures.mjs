import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
import {coursesFixture,users,request} from './course-fixtures.mjs';
import {login} from './helpers.mjs';
export {users,request};
export const hostile='<script>alert(1)</script><img src=x onerror="alert(1)"><iframe/><svg onload="x"/>[x](javascript:alert(1)) [d](data:text/html,x) &lt;b&gt;';
export async function contentFixture(pool,seedContent=false) {
 const f=await coursesFixture(pool);
 await pool.query('UPDATE institution_memberships SET is_admin=false WHERE institution_id=$1 AND user_id=$2',[f.tenants.uc,users.other]);
 await f.add(f.s2,users.other,'teacher');
 await pool.query('UPDATE users SET active=true WHERE id=$1',[users.inactive]);
 await pool.query('UPDATE institution_memberships SET active=true WHERE institution_id=$1 AND user_id=ANY($2::uuid[])',[f.tenants.uc,[users.revoked,users.inactive]]);
 await f.add(f.s1,users.revoked,'student');await f.add(f.s2,users.inactive,'assistant');
 const admin=randomUUID();
 await pool.query('INSERT INTO users(id,email,name,password_hash) SELECT $1,\u0027content-admin@example.test\u0027,\u0027Admin\u0027,password_hash FROM users WHERE id=$2',[admin,users.owner]);
 await pool.query('INSERT INTO institution_memberships(id,institution_id,user_id,is_admin,is_super_admin) VALUES($1,$2,$3,true,true)',[randomUUID(),f.tenants.uc,admin]);
 const modules=[],materials=[],foreignModule=randomUUID(),foreignMaterial=randomUUID();
 if(seedContent) {
  await pool.query('INSERT INTO course_modules(id,institution_id,course_id,title,position,published_at) VALUES($1,$2,$3,\u0027Foreign\u0027,1,now())',[foreignModule,f.tenants.utfsm,f.foreign]);
  await pool.query('INSERT INTO materials(id,institution_id,module_id,title,markdown_body,created_by,published_at) VALUES($1,$2,$3,\u0027Foreign\u0027,\u0027Foreign source\u0027,$4,now())',[foreignMaterial,f.tenants.utfsm,foreignModule,users.foreign]);
 }
 if(seedContent)for(const parent of [false,true])for(const item of [false,true]) {
  const module=randomUUID(),material=randomUUID();modules.push(module);materials.push(material);
  await pool.query('INSERT INTO course_modules(id,institution_id,course_id,title,position,published_at) VALUES($1,$2,$3,\u0027Module\u0027,$4,CASE WHEN $5 THEN now() END)',[module,f.tenants.uc,f.own,modules.length,parent]);
  await pool.query('INSERT INTO materials(id,institution_id,module_id,title,markdown_body,created_by,published_at) VALUES($1,$2,$3,\u0027Material\u0027,$4,$5,CASE WHEN $6 THEN now() END)',[material,f.tenants.uc,module,hostile,users.other,item]);
 }
 return {...f,admin,modules,materials,foreignModule,foreignMaterial};
}
export async function tokens(app,f) {
 const owner=await login(app,f.env),teacher=await login(app,f.env,'UC'),student=await login(app,f.env,'REVOKED'),assistant=await login(app,f.env,'INACTIVE');
 const response=await fetch(app.base+'/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'content-admin@example.test',password:f.env.DEMO_MULTI_PASSWORD})});
 assert.equal(response.status,200);return {owner,teacher,student,assistant,admin:(await response.json()).accessToken};
}
export async function waitForLock(pool,pattern,count=1) {
 for(let i=0;i<150;i++) {
  if((await pool.query("SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE $1",[pattern])).rowCount>=count)return;
  await delay(10);
 }
 assert.fail('Expected PostgreSQL lock wait');
}
