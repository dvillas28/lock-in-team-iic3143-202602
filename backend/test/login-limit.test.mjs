import assert from "node:assert/strict";
import { test } from "node:test";
import { NestFactory,Reflector } from "@nestjs/core";
import { ThrottlerGuard,ThrottlerModule,getOptionsToken,getStorageToken } from "@nestjs/throttler";
import app from "../dist/app.module.js";
import controller from "../dist/auth/auth.controller.js";
import filter from "../dist/http/problem.filter.js";

test("login quota admits only five concurrently; spoofing, block and TTL use controlled clock",async t=>{
 const registration=Reflect.getMetadata("imports",app.AppModule).find(entry=>entry.module===ThrottlerModule);
 assert.ok(registration,"production throttler registration missing");
 const context=await NestFactory.createApplicationContext(registration,{logger:false});
 t.after(()=>context.close());
 t.mock.timers.enable({apis:["Date"],now:1000});
 const storage=context.get(getStorageToken());
 const gate=new ThrottlerGuard(context.get(getOptionsToken()),storage,new Reflector());
 await gate.onModuleInit();let verifications=0;
 const attempt=async(ip="127.0.0.1")=>{
  const headers={};let body;
  const response={header:(k,v)=>{headers[k]=v;},setHeader:(k,v)=>{headers[k]=v;},status(){return this;},json(b){body=b;}};
  const context={getClass:()=>controller.AuthController,getHandler:()=>controller.AuthController.prototype.login,switchToHttp:()=>({getRequest:()=>({ip,headers:{"x-forwarded-for":`192.0.2.${Math.random()*100}`},originalUrl:"/api/v1/auth/login"}),getResponse:()=>response})};
  try {await gate.canActivate(context);verifications++;return {status:200,headers};}
  catch(error){new filter.ProblemFilter().catch(error,context);return {status:body.status,headers};}
 };
 try {
  assert.deepEqual((await Promise.all(Array.from({length:5},()=>attempt()))).map(r=>r.status),[200,200,200,200,200]);
  t.mock.timers.tick(10000);
  const sixth=await attempt();assert.equal(sixth.status,429);assert.equal(sixth.headers["Retry-After"],60);assert.equal(verifications,5);
  t.mock.timers.tick(50000);
  const blocked=await attempt();assert.equal(blocked.status,429);assert.equal(blocked.headers["Retry-After"],10);
  t.mock.timers.tick(9999);const last=await attempt();assert.equal(last.status,429);assert.equal(last.headers["Retry-After"],1);
  t.mock.timers.tick(1);assert.equal((await attempt()).status,200);assert.equal(verifications,6);
  t.mock.timers.tick(60000);assert.equal((await attempt()).status,200);
  const burst=await Promise.all(Array.from({length:6},()=>attempt()));assert.equal(burst.filter(r=>r.status===200).length,4);
  for(const ip of ["127.0.0.2","127.0.0.3"]) {
   for(let i=0;i<5;i++)assert.equal((await attempt(ip)).status,200);
  }
  t.mock.timers.tick(59999);assert.equal((await attempt("127.0.0.2")).status,429);
  t.mock.timers.tick(1);assert.equal((await attempt("127.0.0.3")).status,200);
 } finally {storage.onApplicationShutdown();}
});
