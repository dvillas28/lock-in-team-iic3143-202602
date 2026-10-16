import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { database,fixture,http,login,authorized,sanitized,snapshot } from "./helpers.mjs";
test("CurrentUser projection, empty roles, indistinguishable contexts and auth before slug",async()=>{
 const pool=await database();let app;const tokens=[];
 try {
  const env=await fixture(pool);
  const institutionId=randomUUID();
  await pool.query("INSERT INTO institutions(id,slug,name) VALUES($1,'legacy--campus','Legacy campus')",[institutionId]);
  await pool.query("INSERT INTO institution_memberships(id,institution_id,user_id) VALUES($1,$2,'10000000-0000-4000-8000-000000000003')",[randomUUID(),institutionId]);
  app=await http();
  const multi=await login(app,env);const uc=await login(app,env,"UC");const utfsm=await login(app,env,"UTFSM");tokens.push(multi,uc,utfsm);
  const get=(slug,token)=>fetch(`${app.base}/api/v1/institutions/${slug}/me`,authorized(token));
  const before=await snapshot(pool);
  const listed=await fetch(app.base+"/api/v1/institutions",authorized(multi));
  assert.ok((await listed.json()).items.some(i=>i.slug==="legacy--campus"));
  let userId;
  for(const slug of ["uc","utfsm","uc","legacy--campus"]) {
   const response=await get(slug,multi);assert.equal(response.status,200);assert.equal(response.headers.get("cache-control"),"no-store");
   const body=await response.json();assert.deepEqual(Object.keys(body).sort(),["email","id","institutionMembership","name","sectionMemberships"]);
   assert.deepEqual(body.sectionMemberships,[]);assert.equal(body.institutionMembership.institution.slug,slug);
   assert.equal(body.institutionMembership.active,true);assert.equal(body.institutionMembership.institution.active,true);
   assert.deepEqual(Object.keys(body.institutionMembership).sort(),["active","id","institution"]);
   if(userId)assert.equal(body.id,userId);userId=body.id;
   assert.ok(!JSON.stringify(body).includes("password"));assert.ok(!JSON.stringify(body).includes(multi));
  }
  const hidden=[];
  for(const [slug,token] of [["utfsm",uc],["uc",utfsm],["absent",multi]]) {
   const response=await get(slug,token);assert.equal(response.status,404);const body=await response.json();delete body.instance;delete body.traceId;hidden.push(body);
  }
  assert.deepEqual(hidden[0],hidden[1]);assert.deepEqual(hidden[0],hidden[2]);
  for(const slug of ["UPPER","-a","a-","a_","a".repeat(64),"%27%20OR%201%3D1"]) {
   assert.equal((await get(slug,multi)).status,400);assert.equal((await get(slug,"invalid")).status,401);
  }
  assert.equal((await get("a".repeat(63),multi)).status,404);
  assert.equal((await get("a--b",multi)).status,404);
  assert.ok(JSON.stringify(await snapshot(pool))===JSON.stringify(before),"context reads mutated persistence");
 } finally {if(app)sanitized((await app.close()).output,tokens);await pool.end();}
});
