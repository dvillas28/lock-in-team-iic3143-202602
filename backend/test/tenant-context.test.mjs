import assert from "node:assert/strict";
import {test} from "node:test";
import {TenantGuard} from "../dist/tenancy/tenant.guard.js";
test("only path params establish context; globals never infer tenant",()=>{
 const guard=new TenantGuard();
 for(const value of ["uc","utfsm","a-b","0"]) {
  const request={params:{institutionSlug:value},userId:"actor"};
  assert.equal(guard.canActivate({switchToHttp:()=>({getRequest:()=>request})}),true);
  assert.deepEqual(request.tenant,{actor:"actor",slug:value});
 }
 for(const institutionSlug of ["","UPPER","-uc","a-","a".repeat(64)])assert.throws(()=>guard.canActivate({switchToHttp:()=>({getRequest:()=>({params:{institutionSlug}})})}),e=>e.getStatus()===400);
 const request={params:{},headers:{host:"uc.example",origin:"https://utfsm.example","x-institution":"uc"},query:{institutionSlug:"uc"},body:{institutionSlug:"utfsm"}};
 assert.equal(guard.canActivate({switchToHttp:()=>({getRequest:()=>request})}),true);assert.equal(request.tenant,undefined);
});
