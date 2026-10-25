import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { once } from "node:events";
import { test } from "node:test";
import { academicDemoManifest, academicDemoVersion } from "../../dist/seeds/demo-academic-manifest.js";
import { database, migrated, cli, secrets, sanitized, http, login, authorized } from "./helpers.mjs";

const academicEnv=()=>({...secrets(),DEMO_ACADEMIC_DATA_ENABLED:"true",DEMO_OPERATOR_REF:"academic-seed-test"});
const run=env=>cli("seeds/demo",env).result;
async function snapshot(pool) {
  return Promise.all(["users","institutions","institution_memberships","courses","sections","enrollments","audit_events","demo_data_runs"]
    .map(async table=>(await pool.query(`SELECT * FROM ${table} ORDER BY ${table==="demo_data_runs"?"version":"id"}`)).rows));
}
const unchanged=(before,after)=>assert.ok(JSON.stringify(before)===JSON.stringify(after),"seed changed persisted data");

test("academic seed validates opt-in configuration before connecting and stays disabled by default",async()=>{
  let connections=0;const server=createServer(socket=>{connections++;socket.destroy();});
  server.listen(0,"127.0.0.1");await once(server,"listening");
  try{
    for(const extra of [{DEMO_ACADEMIC_DATA_ENABLED:"TRUE"},{DEMO_OPERATOR_REF:""}]){
      const result=await run({...academicEnv(),...extra,MIGRATION_DATABASE_URL:`postgres://127.0.0.1:${server.address().port}/academic_validation_test`});
      assert.equal(result.code,1);assert.match(result.output,/config/);sanitized(result.output);
    }
    assert.equal(connections,0);
  }finally{await new Promise(resolve=>server.close(resolve));}
  const pool=await database();try{
    await migrated(pool);assert.equal((await run({...secrets(),DEMO_ACADEMIC_DATA_ENABLED:"false"})).code,0);
    for(const table of ["courses","sections","enrollments","audit_events","demo_data_runs"])
      assert.equal((await pool.query(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n,0);
  }finally{await pool.end();}
});

test("academic seed creates both tenant courses, scoped roles and operational evidence, with real HTTP isolation",async()=>{
  const pool=await database();const env=academicEnv();let app;
  try{
    await migrated(pool);const result=await run(env);assert.equal(result.code,0);sanitized(result.output,Object.entries(env).filter(([key])=>key.endsWith('_PASSWORD')).map(([,value])=>value));
    assert.equal(JSON.parse(result.output).academic.outcome,"applied");
    for(const [table,count]of [["courses",2],["sections",2],["enrollments",4],["audit_events",0],["demo_data_runs",1]])
      assert.equal((await pool.query(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n,count);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM institution_memberships WHERE is_admin OR is_super_admin")).rows[0].n,0);
    const marker=(await pool.query("SELECT * FROM demo_data_runs WHERE version=$1",[academicDemoVersion])).rows[0];
    assert.equal(marker.operator_ref,env.DEMO_OPERATOR_REF);assert.match(marker.input_fingerprint,/^[a-f0-9]{64}$/);
    assert.equal(marker.result.length,2);assert.ok(marker.result.every(t=>t.institutionId && t.courseId && t.sectionId && t.teacherId && t.studentId));
    app=await http();
    const uc=await login(app,env,"UC"),utfsm=await login(app,env,"UTFSM"),student=await login(app,env,"MULTI");
    for(const [index,slug,teacher]of [[0,"uc",uc],[1,"utfsm",utfsm]]){
      for(const token of [teacher,student]){
        const response=await fetch(`${app.base}/api/v1/institution/${slug}/courses`,authorized(token));assert.equal(response.status,200);
        assert.deepEqual((await response.json()).items.map(c=>c.id),[academicDemoManifest[index].courseId]);
        const me=await fetch(`${app.base}/api/v1/institution/${slug}/me`,authorized(token));assert.equal(me.status,200);
        assert.ok((await me.json()).sectionMemberships.some(m=>m.role===(token===teacher?'teacher':'student')));
      }
      const foreign=await fetch(`${app.base}/api/v1/institution/${slug}/courses`,authorized(index===0?utfsm:uc));assert.equal(foreign.status,404);
      const forbidden=await fetch(`${app.base}/api/v1/institution/${slug}/courses/${academicDemoManifest[index].courseId}`,{
        method:"PATCH",headers:{...authorized(student).headers,"Content-Type":"application/json"},body:JSON.stringify({name:"forbidden"})});
      assert.equal(forbidden.status,403);
    }
  }finally{await app?.close();await pool.end();}
});

test("academic replay is concurrent, preserves passwords, edits and revocations, and never restores permissions",async()=>{
  const pool=await database();const env=academicEnv();
  try{
    await migrated(pool);const results=await Promise.all([run(env),run(env)]);assert.ok(results.every(r=>r.code===0));
    assert.deepEqual(results.map(r=>JSON.parse(r.output).academic.outcome).sort(),["alreadyApplied","applied"]);
    await pool.query("UPDATE courses SET name='Edited by teacher' WHERE id=$1",[academicDemoManifest[0].courseId]);
    await pool.query("UPDATE sections SET capacity=7 WHERE id=$1",[academicDemoManifest[0].sectionId]);
    await pool.query("UPDATE enrollments SET active=false WHERE id=$1",[academicDemoManifest[0].teacherEnrollmentId]);
    await pool.query("UPDATE institution_memberships SET active=false WHERE user_id=$1",[academicDemoManifest[0].studentId]);
    await pool.query("UPDATE users SET active=false WHERE id=$1",[academicDemoManifest[1].teacherId]);
    const before=await snapshot(pool);
    for(let i=0;i<2;i++){
      const replay=await run({...academicEnv(),DEMO_OPERATOR_REF:"repeat"});assert.equal(replay.code,0);
      assert.equal(JSON.parse(replay.output).academic.outcome,"alreadyApplied");unchanged(before,await snapshot(pool));
    }
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM demo_data_runs")).rows[0].n,1);
  }finally{await pool.end();}
});

test("academic collisions and operational ledger failure roll back both tenants atomically",async()=>{
  const pool=await database();
  try{
    await migrated(pool);assert.equal((await run(secrets())).code,0);
    const t=academicDemoManifest[1],tenant=(await pool.query("SELECT id FROM institutions WHERE slug=$1",[t.slug])).rows[0].id;
    await pool.query("INSERT INTO courses(id,institution_id,code,name,term,created_by) VALUES($1,$2,$3,'Existing',$4,$5)",[randomUUID(),tenant,t.code,t.term,t.teacherId]);
    const before=await snapshot(pool);const collision=await run(academicEnv());assert.equal(collision.code,1);assert.match(collision.output,/conflict/);unchanged(before,await snapshot(pool));
    await migrated(pool);assert.equal((await run(secrets())).code,0);
    await pool.query(`CREATE FUNCTION public.fail_demo_marker() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'sensitive marker failure'; END $$;
      CREATE TRIGGER fail_demo_marker BEFORE INSERT ON demo_data_runs FOR EACH ROW EXECUTE FUNCTION fail_demo_marker()`);
    const initial=await snapshot(pool);const failure=await run(academicEnv());assert.equal(failure.code,1);sanitized(failure.output);unchanged(initial,await snapshot(pool));
    await pool.query("DROP TRIGGER fail_demo_marker ON demo_data_runs; DROP FUNCTION fail_demo_marker()");assert.equal((await run(academicEnv())).code,0);
    await pool.query("DELETE FROM demo_data_runs WHERE version=$1",[academicDemoVersion]);
    const unmarked=await snapshot(pool);assert.equal((await run(academicEnv())).code,1);unchanged(unmarked,await snapshot(pool));
  }finally{await pool.end();}
});

test("first academic application refuses inactive tenant, identity or membership and foreign reserved IDs",async()=>{
  const pool=await database();
  try{
    for(const edit of ["UPDATE institutions SET active=false WHERE slug='utfsm'",
      "UPDATE users SET active=false WHERE email='demo-multi@academix.example'",
      "UPDATE institution_memberships SET active=false WHERE user_id='10000000-0000-4000-8000-000000000003'"]){
      await migrated(pool);assert.equal((await run(secrets())).code,0);await pool.query(edit);
      const before=await snapshot(pool);const result=await run(academicEnv());assert.equal(result.code,1);assert.match(result.output,/conflict/);unchanged(before,await snapshot(pool));
    }
    await migrated(pool);assert.equal((await run(secrets())).code,0);
    const t=academicDemoManifest[0],foreign=(await pool.query("SELECT id FROM institutions WHERE slug='utfsm'")).rows[0].id;
    await pool.query("INSERT INTO courses(id,institution_id,code,name,term,created_by) VALUES($1,$2,'FOREIGN','Existing','DEMO',$3)",[t.courseId,foreign,academicDemoManifest[1].teacherId]);
    const before=await snapshot(pool);assert.equal((await run(academicEnv())).code,1);unchanged(before,await snapshot(pool));
  }finally{await pool.end();}
});
