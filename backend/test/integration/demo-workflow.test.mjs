import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomBytes} from 'node:crypto';
import {database,migrated,cli,http,runtimeDatabase} from './helpers.mjs';
import {tenantTables} from '../../dist/database/runtime-check.js';
import {smoke} from '../../../scripts/postdeploy-demo.mjs';
test('manifest accounts complete delegated UC/UTFSM workflow with publication and role negatives',async()=>{
 const pool=await database();let app,runtime;try {
  await migrated(pool);
  const env={DEMO_DATA_ENABLED:'true',DEMO_OPERATOR_REF:'workflow-test',SMOKE_DELEGATE_ADMIN:'true'};
  for(const t of ['UC','UTFSM'])for(const r of ['SUPERADMIN','ADMIN','TEACHER','ASSISTANT','STUDENT'])env[`DEMO_${t}_${r}_PASSWORD`]=randomBytes(12).toString('hex');
  assert.equal((await cli('commands/predeploy',env).result).code,0);
  app=await http({RENDER_GIT_COMMIT:"integration-demo",CORS_ALLOWED_ORIGINS:JSON.stringify(['https://uc.academix.dvillasc.me','https://utfsm.academix.dvillasc.me'])});
  assert.equal((await smoke({baseUrl:app.base,env,workflow:true})).status,'ok');
  runtime=await runtimeDatabase();
  await runtime.withIdentity(null,async c=>{for(const table of tenantTables)assert.equal((await c.query(`SELECT * FROM ${table}`)).rowCount,0);});
  for(const slug of ['uc','utfsm']) {
   const actor=(await pool.query('SELECT id FROM users WHERE email=$1',[`superadmin.${slug}@academix.example`])).rows[0].id;
   await runtime.withInstitution(actor,slug,async(c,m)=>{
    for(const table of tenantTables) {
     const rows=(await c.query(`SELECT * FROM ${table}`)).rows;
     assert.ok(rows.length>0,table);assert.ok(rows.every(r=>r.institution_id===m.institution_id),table);
    }
   });
  }
  await pool.query("UPDATE institution_memberships SET is_admin=false WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'admin.%')");
  const before=(await pool.query('SELECT * FROM institution_memberships ORDER BY id')).rows;
  assert.equal((await cli('data-migrations/demo-institutions',{DEMO_OPERATOR_REF:'replay'}).result).code,0);
  assert.deepEqual((await pool.query('SELECT * FROM institution_memberships ORDER BY id')).rows,before);
 }finally{await app?.close();await runtime?.onApplicationShutdown();await pool.end();}
});
