import assert from "node:assert/strict";
import { test } from "node:test";
import pg from "pg";
import { database,fixture,http,login,authorized,sanitized,testUrl,terminateHttpConnections } from "./helpers.mjs";
test("same JWT sees committed membership/institution/user revocation and fails closed on DB loss",async()=>{
 const pool=await database();let app;let token;
 try {
  const env=await fixture(pool);app=await http();token=await login(app,env);
  const get=slug=>fetch(`${app.base}/api/v1/institutions/${slug}/me`,authorized(token));
  const list=()=>fetch(`${app.base}/api/v1/institutions`,authorized(token));
  const alternating=await Promise.all(Array.from({length:20},async(_,i)=>{
   const slug=i%2?"uc":"utfsm";const response=await get(slug);assert.equal(response.status,200);
   assert.equal((await response.json()).institutionMembership.institution.slug,slug);
  }));assert.equal(alternating.length,20);
  for(const table of ["institution_memberships","institutions"]) {
   const where=table==="institutions"?"slug='uc'":"user_id='10000000-0000-4000-8000-000000000003' AND institution_id=(SELECT id FROM institutions WHERE slug='uc')";
   const client=await pool.connect();
   try {
    await client.query("BEGIN");await client.query(`UPDATE ${table} SET active=false WHERE ${where}`);
    assert.equal((await get("uc")).status,200,"uncommitted revocation became visible");
    await client.query("ROLLBACK");assert.equal((await get("uc")).status,200);
    await client.query("BEGIN");await client.query(`UPDATE ${table} SET active=false WHERE ${where}`);await client.query("COMMIT");
   } finally {client.release();}
   assert.deepEqual((await (await list()).json()).items.map(i=>i.slug),["utfsm"]);
   assert.equal((await get("uc")).status,404);assert.equal((await get("utfsm")).status,200);
   await pool.query(`UPDATE ${table} SET active=true WHERE ${where}`);
  }
  await pool.query("UPDATE users SET active=false WHERE id='10000000-0000-4000-8000-000000000003'");
  assert.equal((await list()).status,401);assert.equal((await get("uc")).status,401);assert.equal((await get("utfsm")).status,401);
  await pool.query("UPDATE users SET active=true WHERE id='10000000-0000-4000-8000-000000000003'");
  const url=new URL(testUrl());const name=url.pathname.slice(1);url.pathname="/postgres";
  const maintenance=new pg.Client({connectionString:url.href,application_name:"academix-http"});await maintenance.connect();
  try {
   await maintenance.query(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS false`);
   await terminateHttpConnections(pool);
   assert.equal((await maintenance.query("SELECT 1 AS alive")).rows[0].alive,1,"other database connection terminated");
   for(const response of await Promise.all([list(),get("uc"),get("utfsm")])) {
    assert.equal(response.status,503);sanitized(await response.text(),[token]);
   }
  } finally {try {await maintenance.query(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS true`);} finally {await maintenance.end();}}
  assert.equal((await list()).status,200);assert.equal((await get("uc")).status,200);
 } finally {if(app)sanitized((await app.close()).output,token?[token]:[]);await pool.end();}
});

test("institutional flags and academic roles refresh with an existing JWT",async()=>{
 const {coursesFixture,request,users}=await import("./course-fixtures.mjs");
 const pool=await database();let app;
 try{
  const f=await coursesFixture(pool);app=await http();const token=await login(app,f.env);
  assert.equal((await request(app,token,"uc/me")).body.institutionMembership.isSuperAdmin,true);
  await pool.query("UPDATE institution_memberships SET is_admin=false,is_super_admin=false WHERE user_id=$1 AND institution_id=$2",[users.owner,f.tenants.uc]);
  const me=(await request(app,token,"uc/me")).body;
  assert.equal(me.institutionMembership.isAdmin,false);assert.equal(me.institutionMembership.isSuperAdmin,false);assert.equal(me.sectionMemberships.length,3);
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1",[users.owner]);
  assert.deepEqual((await request(app,token,"uc/me")).body.sectionMemberships,[]);
 }finally{if(app)await app.close();await pool.end();}
});
