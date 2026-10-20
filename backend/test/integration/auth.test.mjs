import assert from "node:assert/strict";
import { test } from "node:test";
import { database,fixture,http,login,snapshot,sanitized } from "./helpers.mjs";

const path="/api/v1/auth/login";
const send=(app,body,headers={"Content-Type":"application/json"})=>fetch(app.base+path,{method:"POST",headers,body});
test("HTTP login schema, headers, generic failures and no mutations or secret logs",async()=>{
  const pool=await database();let app;const sensitive=[];
  try {
    const env=await fixture(pool);sensitive.push(...Object.values(env)); const before=await snapshot(pool);
    for(const account of ["UC","UTFSM","MULTI","REVOKED"]) {
      app=await http(); sensitive.push(await login(app,env,account));
      sanitized((await app.close()).output,sensitive);
    }
    app=await http();
    const failures=[];
    for(const [email,password] of [["demo-uc", "incorrect"],["unknown","incorrect"],["demo-inactivo",env.DEMO_INACTIVE_PASSWORD]]) {
      const response=await send(app,JSON.stringify({email:email+"@academix.example",password}));
      assert.equal(response.status,401);assert.equal(response.headers.get("www-authenticate"),"Bearer");
      const b=await response.json();delete b.traceId; failures.push(b);
    }
    assert.deepEqual(failures[0],failures[1]);assert.deepEqual(failures[0],failures[2]);
    await app.close(); app=await http();
    for(const [body,headers,status] of [["{",undefined,400],["[]",undefined,400],[JSON.stringify({email:"a@b.c",password:"x",role:"admin"}),undefined,400],["x",{"Content-Type":"text/plain"},415],["x".repeat(4097),undefined,413]]) {
      const response=await send(app,body,headers);assert.equal(response.status,status);
      assert.equal(response.headers.get("content-type").split(";")[0],"application/problem+json");
      const text=await response.text();sanitized(text,sensitive);
    }
    assert.ok(JSON.stringify(await snapshot(pool))===JSON.stringify(before),"login mutated persistence");
  } finally {if(app) sanitized((await app.close()).output,sensitive);await pool.end();}
});

test("concurrent login burst counts successes and failures; forwarded addresses do not bypass",async()=>{
 const pool=await database();let app;
 try {
  const env=await fixture(pool);app=await http();
  const results=await Promise.all(Array.from({length:6},(_,i)=>send(app,JSON.stringify({email:"demo-uc@academix.example",password:i%2?env.DEMO_UC_PASSWORD:"incorrect"}),{"Content-Type":"application/json","X-Forwarded-For":`192.0.2.${i}`})));
  assert.equal(results.filter(r=>r.status===429).length,1);assert.equal(results.filter(r=>[200,401].includes(r.status)).length,5);
  const blocked=results.find(r=>r.status===429);assert.ok(Number(blocked.headers.get("retry-after"))>0);
  assert.equal((await send(app,"{}")).status,429);
 } finally {if(app)sanitized((await app.close()).output);await pool.end();}
});
