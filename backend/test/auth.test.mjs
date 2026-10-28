import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { JwtService } from "@nestjs/jwt";
import argon2 from "argon2";
import auth from "../dist/auth/auth.service.js";
import guard from "../dist/auth/auth.guard.js";

const sub="10000000-0000-4000-8000-000000000003";
test("configuration, strict DTO, real/dummy verification and JWT mandatory claims", async () => {
  const previous=process.env.AUTH_JWT_SECRET;
  try {
    for(const value of [undefined,"","bad","eA==",randomBytes(32).toString("base64")+" "]) {
      if(value===undefined) delete process.env.AUTH_JWT_SECRET; else process.env.AUTH_JWT_SECRET=value;
      assert.throws(()=>new auth.AuthService({},new JwtService()), /configuration/);
    }
    const secret=randomBytes(32);process.env.AUTH_JWT_SECRET=secret.toString("base64");
    let calls=0; let rows=[];
    const database={pool:{query:async()=>{calls++; return {rows};}}};
    database.withIdentity=(_actor,fn)=>fn(database.pool);
    const service=new auth.AuthService(database,new JwtService());await service.onModuleInit();
    for(const body of [null,[],{}, {email:"a@b.c",password:"x",role:"admin"}, {email:3,password:"x"}, {email:"a@@b.c",password:"x"}, {email:"a b@c.d",password:"x"}, {email:"é@b.c",password:"x"}, {email:"a@localhost",password:"x"}, {email:"a@b.c",password:""}, {email:"a@b.c",password:"😀".repeat(33)}, {email:"a@b.c",password:1}, {email:"a".repeat(251)+"@b.c",password:"x"}]) {
      await assert.rejects(service.login(body), e=>e.getStatus()===400);
    }
    assert.equal(calls,0);
    const password=randomBytes(12).toString("hex");
    rows=[{id:sub,active:true,password_hash:await argon2.hash(password)}];
    const result=await service.login({email:"  A@B.C ",password});
    assert.equal(result.expiresIn,900);assert.equal(result.tokenType,"Bearer");
    const claims=service.verifyToken(result.accessToken);
    assert.deepEqual(Object.keys(claims).sort(),["sub","iat","exp","iss","aud"].sort());
    assert.equal(claims.exp-claims.iat,900);
    const jwt=new JwtService();const now=Math.floor(Date.now()/1000);
    const base={sub,iat:now,exp:now+900,iss:"academix-api",aud:"academix-clients"};
    const sign=(payload,options={})=>jwt.sign(payload,{secret,algorithm:"HS256",...options});
    const invalid=[...Object.keys(base).map(key=>{const p={...base};delete p[key];return sign(p,key==="iat"?{noTimestamp:true}:{});}),
      sign({...base,iss:"other"}),sign({...base,aud:"other"}),sign({...base,aud:["academix-clients","other"]}),sign({...base,sub:"invalid"}),sign({...base,iat:now+1,exp:now+901}),sign({...base,exp:now+899}),sign({...base,iat:now-900,exp:now}),sign({...base,iat:now+0.1}),sign(base,{algorithm:"HS384"}),sign(base,{secret:randomBytes(32)}),sign(base,{algorithm:"none"}),"bad"];
    for(const token of invalid) assert.throws(()=>service.verifyToken(token), e=>e.getStatus()===401);
    for(const row of [[],[{...rows[0],active:false}],rows]) {
      rows=row; await assert.rejects(service.login({email:"a@b.c",password:"incorrect"}),e=>e.getStatus()===401);
    }
    rows=[{id:sub,active:true,password_hash:"bad"}];
    await assert.rejects(service.login({email:"a@b.c",password}),e=>e.getStatus()===503);
    database.pool.query=async()=>{throw new Error("internal");};
    await assert.rejects(service.login({email:"a@b.c",password}),e=>e.getStatus()===503);
    const gate=new guard.AuthGuard(service,database);
    for(const headers of [{}, {authorization:"Basic x"}, {authorization:"Bearer "+"x".repeat(4097)}, {authorization:["Bearer x"]}]) {
      await assert.rejects(gate.canActivate({switchToHttp:()=>({getRequest:()=>({headers,rawHeaders:[]})})}),e=>e.getStatus()===401);
    }
  } finally { if(previous===undefined)delete process.env.AUTH_JWT_SECRET;else process.env.AUTH_JWT_SECRET=previous; }
});

test("Argon2 verifies persisted hash for inactive/wrong password and reuses startup dummy for unknown", async t => {
 const previous=process.env.AUTH_JWT_SECRET;process.env.AUTH_JWT_SECRET=randomBytes(32).toString("base64");
 try {
  const password=randomBytes(12).toString("hex");const encoded=await argon2.hash(password);
  let rows=[];const database={pool:{query:async()=>({rows})}};
  database.withIdentity=(_actor,fn)=>fn(database.pool);
    const service=new auth.AuthService(database,new JwtService());await service.onModuleInit();
  const real=argon2.verify;const seen=[];
  t.mock.method(argon2,"verify",async (hash,password)=>{seen.push(hash);return real(hash,password);});
  for(let i=0;i<2;i++) await assert.rejects(service.login({email:"unknown@example.test",password}),e=>e.getStatus()===401);
  assert.equal(seen.length,2);assert.ok(seen[0]===seen[1] && seen[0]!==encoded,"dummy hash not reused");
  rows=[{id:sub,active:false,password_hash:encoded}];
  await assert.rejects(service.login({email:"inactive@example.test",password}),e=>e.getStatus()===401);
  assert.ok(seen[2]===encoded,"inactive skipped persisted verification");
  rows[0].active=true;
  await assert.rejects(service.login({email:"active@example.test",password:"wrong"}),e=>e.getStatus()===401);
  assert.ok(seen[3]===encoded,"wrong password skipped persisted verification");
  const long="😀".repeat(32);rows[0].password_hash=await argon2.hash(long);
  assert.equal((await service.login({email:"a".repeat(250)+"@b.c",password:long})).expiresIn,900);
  const gate=new guard.AuthGuard(service,database);
  let calls=0;database.pool.query=async()=>{calls++;throw new Error("internal");};
  const token=(await new JwtService().sign({sub},{secret:Buffer.from(process.env.AUTH_JWT_SECRET,"base64"),algorithm:"HS256",issuer:"academix-api",audience:"academix-clients",expiresIn:900}));
  const ctx=(header,rawHeaders=[])=>({switchToHttp:()=>({getRequest:()=>({headers:{authorization:header},rawHeaders})})});
  await assert.rejects(gate.canActivate(ctx("Bearer invalid")),e=>e.getStatus()===401);assert.equal(calls,0);
  await assert.rejects(gate.canActivate(ctx(`Bearer ${token}`,["Authorization","x","Authorization","y"])),e=>e.getStatus()===401);assert.equal(calls,0);
  await assert.rejects(gate.canActivate(ctx(`Bearer ${token}`)),e=>e.getStatus()===503);assert.equal(calls,1);
  database.pool.query=async()=>({rows:[]});await assert.rejects(gate.canActivate(ctx(`Bearer ${token}`)),e=>e.getStatus()===401);
 } finally {if(previous===undefined)delete process.env.AUTH_JWT_SECRET;else process.env.AUTH_JWT_SECRET=previous;}
});
