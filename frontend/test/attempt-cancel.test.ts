import assert from "node:assert/strict";
import {test} from "node:test";
import {AttemptOperations} from "../src/lib/attempts/operations.ts";
import {mount,reply,attempt,quiz,course,user,id,cancelled,graded} from "./fixtures/attempts.ts";
test("authorized 204 remains confirmed when followup read fails; no invented date",async()=>{
 const ui=await mount(null,r=>r.url.endsWith("/cancel")?new Response(null,{status:204}):Response.json({},{status:503}),"teacher");const ops=new AttemptOperations(ui.session,"uc",user("teacher"),course,quiz,{...attempt,studentId:id(90)});
 try{await ops.cancel();assert.equal(ops.getSnapshot().cancelConfirmed,true);await ops.consult();assert.equal(ops.getSnapshot().cancelConfirmed,true);assert.equal(ops.getSnapshot().attempt?.cancelledAt,null);}finally{ops.dispose();await ui.close();}
});
test("cancel uncertain permits explicit repeat/GET; terminal and unauthorized have no mutation",async()=>{
 let count=0;const ui=await mount(null,r=>r.url.endsWith("/cancel")?(++count===1?Promise.reject(new Error("lost")):new Response(null,{status:204})):reply(r,cancelled),"student");
 const ops=new AttemptOperations(ui.session,"uc",user("student"),course,quiz,attempt);
 try{await ops.cancel();assert.equal(ops.getSnapshot().pending,"cancel");await ops.replay();assert.equal(ops.getSnapshot().cancelConfirmed,true);await ops.consult();assert.equal(ops.getSnapshot().attempt?.cancelledAt,cancelled.cancelledAt);assert.equal(ops.getSnapshot().receipt,undefined);
 for(const p of ["assistant","owner","super"]){const denied=new AttemptOperations(ui.session,"uc",user(p),course,quiz,{...attempt,studentId:id(90)});await denied.cancel();denied.dispose();}const terminal=new AttemptOperations(ui.session,"uc",user("student"),course,quiz,graded);await terminal.cancel();terminal.dispose();assert.equal(count,2);
 }finally{ops.dispose();await ui.close();}
});

test("confirmed 204 cannot be replaced by an inconsistent later terminal read",async()=>{
 const ui=await mount(null,r=>r.url.endsWith('/cancel')?new Response(null,{status:204}):reply(r,graded),'student');
 const ops=new AttemptOperations(ui.session,'uc',user('student'),course,quiz,attempt);
 try{await ops.cancel();await ops.consult();assert.equal(ops.getSnapshot().cancelConfirmed,true);assert.equal(ops.getSnapshot().receipt,undefined);}finally{ops.dispose();await ui.close();}
});
