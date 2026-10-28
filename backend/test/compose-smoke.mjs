// Run explicitly from the repo root: node backend/test/compose-smoke.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JwtService } from "@nestjs/jwt";

const root=new URL("../../",import.meta.url);
const dir=await mkdtemp(join(tmpdir(),"academix-compose-"));
const override=join(dir,"isolation.yaml");
const env={...process.env,
 NEXT_PUBLIC_PORTAL_ORIGIN:"http://localhost:3000",
 NEXT_PUBLIC_INSTITUTION_ORIGINS:JSON.stringify({"http://uc.localhost:3000":"uc","http://utfsm.localhost:3000":"utfsm"}),
 POSTGRES_DB:"academix_identity_compose_test",POSTGRES_USER:"identity_fixture",
 POSTGRES_PASSWORD:randomBytes(24).toString("hex"),RUNTIME_PASSWORD:randomBytes(24).toString("hex"),AUTH_JWT_SECRET:randomBytes(32).toString("base64")};
for(const name of ["UC","UTFSM","MULTI","REVOKED","INACTIVE"])env[`DEMO_${name}_PASSWORD`]=randomBytes(12).toString("hex");
const values=[env.RUNTIME_PASSWORD,env.POSTGRES_PASSWORD,env.AUTH_JWT_SECRET,...Object.entries(env).filter(([key])=>key.startsWith("DEMO_")).map(([,v])=>v)];
const compose=["compose","-p",`academix-identity-${process.pid}`,"-f",join(root.pathname,"docker-compose.yml"),"-f",override];
function docker(...args){
 try {return execFileSync("docker",[...compose,...args],{cwd:root,env,encoding:"utf8",stdio:["ignore","pipe","pipe"],timeout:180000});}
 catch(error) {
  let output=String(error.stderr??'')+String(error.stdout??'');
  for(const value of values.filter(Boolean))output=output.replaceAll(value,'[redacted]');
  output=output.replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[database URL]');
  throw new Error(`Compose ${args[0]} failed: ${output.slice(-2000)}`);
 }
}
const clean=text=>{
 assert.ok(values.every(value=>!text.includes(value)),"credential in runtime output");
 assert.ok(!/\$argon2|password_hash|@academix\.example/.test(text),"sensitive runtime output");
};
try {
 await writeFile(override,'services:\n  postgres:\n    ports: !reset []\n  backend:\n    ports: !override ["127.0.0.1::3001"]\n');
 console.log("Compose: building backend image and starting isolated PostgreSQL 17/backend");
 docker("up","--build","--wait","--wait-timeout","90","postgres","backend");
 const address=docker("port","backend","3001").trim();const base=`http://${address}`;
 const version=docker("exec","-T","postgres","psql","-U",env.POSTGRES_USER,"-d",env.POSTGRES_DB,"-Atc","SHOW server_version_num");
 assert.equal(Math.floor(Number(version.trim())/10000),17);
 const migrate=JSON.parse(docker("exec","-T","backend","node","dist/commands/migrate.js"));
 assert.equal(migrate.created,0);assert.equal(migrate.existing,11);
 const seed=()=>JSON.parse(docker("exec","-T","backend","node","dist/seeds/demo.js"));
 assert.deepEqual(seed().created,{institutions:2,users:5,memberships:6});
 const fingerprint=()=>docker("exec","-T","postgres","psql","-U",env.POSTGRES_USER,"-d",env.POSTGRES_DB,"-Atc",
  "SELECT md5((SELECT jsonb_agg(t ORDER BY id)::text FROM users t)||(SELECT jsonb_agg(t ORDER BY id)::text FROM institutions t)||(SELECT jsonb_agg(t ORDER BY id)::text FROM institution_memberships t))").trim();
 const before=fingerprint();assert.deepEqual(seed().created,{institutions:0,users:0,memberships:0});
 assert.ok(before===fingerprint(),"repeated seed mutated persistence");
 for(const path of ["/health","/ready"])assert.equal((await fetch(base+path)).status,200);
 for(const [account,slugs] of [["MULTI",["uc","utfsm"]],["UC",["uc"]],["UTFSM",["utfsm"]],["REVOKED",[]]]) {
  const email=`demo-${account.toLowerCase().replace("revoked","revocado")}@academix.example`;
  const response=await fetch(base+"/api/v1/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password:env[`DEMO_${account}_PASSWORD`]})});
  assert.equal(response.status,200);assert.equal(response.headers.get("cache-control"),"no-store");
  const body=await response.json();values.push(body.accessToken);assert.equal(body.expiresIn,900);
  const claims=new JwtService().verify(body.accessToken,{secret:Buffer.from(env.AUTH_JWT_SECRET,"base64"),algorithms:["HS256"],issuer:"academix-api",audience:"academix-clients"});
  assert.equal(claims.exp-claims.iat,900);
  const headers={Authorization:`Bearer ${body.accessToken}`};
  const list=await fetch(base+"/api/v1/institutions",{headers});assert.equal(list.status,200);
  assert.deepEqual((await list.json()).items.map(i=>i.slug),slugs);
  for(const slug of ["uc","utfsm"]) {
   const me=await fetch(`${base}/api/v1/institution/${slug}/me`,{headers});
   assert.equal(me.status,slugs.includes(slug)?200:404);
   const text=await me.text();assert.ok(!text.includes(body.accessToken));
   if(me.ok){const context=JSON.parse(text);assert.equal(context.institutionMembership.institution.slug,slug);assert.deepEqual(context.sectionMemberships,[]);}
  }
 }
 assert.ok(before===fingerprint(),"HTTP mutated persistence");
 clean(docker("logs","--no-color","backend"));
 console.log("Compose PASS: PostgreSQL 17, migration repeat, seed repeat, public probes, login/list/me, isolation, no mutations, sanitized logs");
} finally {
 try {docker("down","--volumes","--remove-orphans");} finally {await rm(dir,{recursive:true,force:true});}
}
