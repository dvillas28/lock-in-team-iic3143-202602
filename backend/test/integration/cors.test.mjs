import assert from "node:assert/strict";
import {test} from "node:test";
import {database,fixture,http,login,authorized,cli,sanitized} from "./helpers.mjs";
const origins=["https://uc.academix.dvillasc.me","https://utfsm.academix.dvillasc.me"];
test("CORS exact origins and unauthenticated OPTIONS never authorize real requests",async()=>{
 const pool=await database();let app;try {
  const env=await fixture(pool);app=await http({CORS_ALLOWED_ORIGINS:JSON.stringify(origins)});
  const token=await login(app,env,"UC");
  for(const origin of [...origins,"https://evil.example","https://uc.academix.dvillasc.me.evil.example"]) {
   const response=await fetch(app.base+"/api/v1/institution/uc/courses",{method:"OPTIONS",headers:{Origin:origin,"Access-Control-Request-Method":"POST","Access-Control-Request-Headers":"authorization,content-type,idempotency-key"}});
   assert.equal(response.headers.get("access-control-allow-origin"),origins.includes(origin)?origin:null);
   if(origins.includes(origin)){assert.equal(response.status,204);assert.match(response.headers.get("vary"),/Origin/);assert.match(response.headers.get("access-control-allow-headers"),/Authorization/i);assert.equal(response.headers.get("access-control-allow-credentials"),null);}
   const real=await fetch(app.base+"/api/v1/institution/uc/me",{headers:{Origin:origin}});assert.equal(real.status,401);
   if(origins.includes(origin))assert.match(real.headers.get("access-control-expose-headers"),/Location/i);
  }
  assert.equal((await fetch(app.base+"/api/v1/institution/utfsm/me",{headers:{...authorized(token).headers,Origin:origins[0]}})).status,404);
  assert.equal((await fetch(app.base+"/api/v1/institution/uc/me",authorized(token))).status,200);
  for (const value of ["[]",JSON.stringify([origins[0]]),JSON.stringify([...origins,"http://localhost:3000"])]) {
   const result=await cli("commands/start",{NODE_ENV:"production",CORS_ALLOWED_ORIGINS:value,PORT:"0"}).result;
   assert.equal(result.code,1);assert.match(result.output,/"category":"config"/);sanitized(result.output);
  }
 }finally{await app?.close();await pool.end();}
});
