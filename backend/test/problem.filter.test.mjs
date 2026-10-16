import assert from "node:assert/strict";
import { test } from "node:test";
import { HttpException } from "@nestjs/common";
import filter from "../dist/http/problem.filter.js";

test("Problem sanitizes every status, generates traceId and preserves headers/probes", () => {
  for (const status of [400,401,403,404,409,413,415,422,429,500,503]) {
    const headers = {"Retry-After": 60}; let body, actual;
    const response = {setHeader(k,v) {headers[k]=v;}, status(s) {actual=s;return this;}, json(b) {body=b;}};
    const host = {switchToHttp:()=>({getRequest:()=>({originalUrl:"/api/v1/test?secret=sentinel",headers:{"x-trace-id":"sentinel"}}),getResponse:()=>response})};
    new filter.ProblemFilter().catch(new HttpException("sentinel",status), host);
    assert.equal(actual,status); assert.equal(headers["Retry-After"],60);
    assert.equal(headers["Content-Type"],"application/problem+json");
    assert.equal(body.instance,"/api/v1/test"); assert.equal(body.status,status);
    assert.deepEqual(Object.keys(body).sort(),["type","title","status","detail","code","instance","traceId","errors"].sort());
    assert.ok(!JSON.stringify(body).includes("sentinel")); assert.match(body.traceId,/^[0-9a-f-]{36}$/);
    if(status===401) assert.equal(headers["WWW-Authenticate"],"Bearer");
  }
});

test("readiness aliases preserve the public JSON failure contract", () => {
 for(const path of ["/ready","/ready/","/READY","/READY/?probe=1"]) {
  let body,actual;const headers={};
  const response={setHeader(k,v){headers[k]=v;},status(s){actual=s;return this;},json(b){body=b;}};
  new filter.ProblemFilter().catch(new HttpException("internal",503),{switchToHttp:()=>({getRequest:()=>({originalUrl:path}),getResponse:()=>response})});
  assert.equal(actual,503);assert.deepEqual(body,{status:"unavailable"});
  assert.equal(headers["Content-Type"],undefined);
 }
});

test("unexpected errors and validation fields never reflect arbitrary payloads", () => {
 for(const error of [new Error("sentinel"),new HttpException({field:"email",message:"sentinel"},400),new HttpException({field:"sentinel"},400)]) {
  let body;
  const response={setHeader(){},status(){return this;},json(b){body=b;}};
  new filter.ProblemFilter().catch(error,{switchToHttp:()=>({getRequest:()=>({url:"/test"}),getResponse:()=>response})});
  assert.ok(!JSON.stringify(body).includes("sentinel"));
  if(error instanceof HttpException && error.getResponse().field==="email")assert.deepEqual(body.errors,[{field:"email",message:"Campo inválido."}]);
 }
});

test("database connection failures are sanitized as 503; other failures stay 500",()=>{
 for(const [code,expected] of [["ECONNREFUSED",503],["08006",503],["57P01",503],["23505",500]]) {
  let actual,body;
  const response={setHeader(){},status(s){actual=s;return this;},json(b){body=b;}};
  new filter.ProblemFilter().catch(Object.assign(new Error("sentinel"),{code}),{switchToHttp:()=>({getRequest:()=>({url:"/test"}),getResponse:()=>response})});
  assert.equal(actual,expected);assert.ok(!JSON.stringify(body).includes("sentinel"));
 }
});
