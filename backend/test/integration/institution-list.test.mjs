import assert from "node:assert/strict";
import { test } from "node:test";
import { database,fixture,http,login,authorized,sanitized } from "./helpers.mjs";
test("authorized lists are ordered, active, isolated and empty without memberships",async()=>{
 const pool=await database();let app;
 try {
  const env=await fixture(pool);app=await http();
  for(const [account,expected] of [["UC",["uc"]],["UTFSM",["utfsm"]],["MULTI",["uc","utfsm"]],["REVOKED",[]]]) {
   const token=await login(app,env,account);const response=await fetch(app.base+"/api/v1/institutions",authorized(token));
   assert.equal(response.status,200);assert.equal(response.headers.get("cache-control"),"no-store");
   const body=await response.json();assert.deepEqual(Object.keys(body),["items"]);
   assert.deepEqual(body.items.map(i=>i.slug),expected);
   for(const item of body.items){assert.deepEqual(Object.keys(item).sort(),["active","id","name","slug"]);assert.equal(item.active,true);}
  }
  assert.equal((await fetch(app.base+"/api/v1/institutions")).status,401);
  assert.equal((await fetch(app.base+"/api/v1/unknown")).status,404);
  const token=await login(app,env);
  await pool.query("UPDATE institutions SET active=false WHERE slug='uc'");
  const get=()=>fetch(app.base+"/api/v1/institutions",authorized(token));
  assert.deepEqual((await (await get()).json()).items.map(i=>i.slug),["utfsm"]);
  const { createApiClient } = await import("../../../frontend/src/lib/api/client.ts");
  const client=createApiClient({baseUrl:app.base,getToken:()=>token});
  assert.equal((await client.GET("/health")).response.status,200);
  assert.equal((await client.GET("/ready")).response.status,200);
  const typed=await client.GET("/api/v1/institutions");
  assert.deepEqual(typed.data.items.map(i=>i.slug),["utfsm"]);
  await pool.query("ALTER TABLE institution_memberships RENAME TO unavailable_fixture");
  assert.equal((await get()).status,503);
 } finally {if(app)sanitized((await app.close()).output);await pool.end();}
});
