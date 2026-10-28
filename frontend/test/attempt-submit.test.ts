import assert from "node:assert/strict";
import {test} from "node:test";
import {AttemptOperations} from "../src/lib/attempts/operations.ts";
import {mount,reply,attempt,quiz,course,user,answers,receipt,graded,deferred} from "./fixtures/attempts.ts";
test("submit saves current snapshot first, double click one operation",async()=>{
 const wait=deferred<Response>();const ui=await mount(null,r=>r.method==="PUT"?wait.promise:r.url.endsWith("/submit")?Response.json(receipt):reply(r),"student");const ops=new AttemptOperations(ui.session,"uc",user("student"),course,quiz,attempt);
 try{ops.setDraft(answers);const p=ops.submit();await ops.submit();ops.setDraft([]);wait.resolve(Response.json({...attempt,answers}));await p;
 const mutations=ui.requests.filter(r=>["PUT","POST"].includes(r.method)&&!r.url.endsWith("/login"));assert.deepEqual(mutations.map(r=>r.method),["PUT","POST"]);assert.deepEqual(ops.getSnapshot().receipt,receipt);assert.equal(ops.getSnapshot().attempt?.status,"graded");}finally{ops.dispose();await ui.close();}
});
test("failed/uncertain save never submits",async()=>{
 for(const status of [422,503]){const ui=await mount(null,r=>r.method==="PUT"?Response.json({},{status}):reply(r),"student");const ops=new AttemptOperations(ui.session,"uc",user("student"),course,quiz,attempt);
 try{ops.setDraft(answers);await ops.submit();assert.equal(ui.requests.some(r=>r.url.endsWith("/submit")),false);}finally{ops.dispose();await ui.close();}}
});
test("lost POST/409 preserves key; consult inProgress never unlocks; replay POST only",async()=>{
 let post=0;const ui=await mount(null,r=>r.url.endsWith("/submit")?(++post===1?Promise.reject(new Error("lost")):post===2?Response.json({},{status:409}):Response.json(receipt)):reply(r),"student");const ops=new AttemptOperations(ui.session,"uc",user("student"),course,quiz,{...attempt,answers});
 try{await ops.submit();assert.equal(ops.getSnapshot().pending,"submit");await ops.consult();await ops.save();await ops.cancel();await ops.replay();assert.equal(ops.getSnapshot().pending,"submit");await ops.replay();
 const req=ui.requests.filter(r=>r.url.endsWith("/submit"));assert.equal(req.length,3);assert.equal(new Set(req.map(r=>r.headers.get("Idempotency-Key"))).size,1);assert.equal(ui.requests.some(r=>r.method==="PUT"||r.url.endsWith("/cancel")),false);assert.deepEqual(ops.getSnapshot().receipt,receipt);}finally{ops.dispose();await ui.close();}
});
test("GET graded reconstructs receipt, never a cancelled receipt",async()=>{
 const ui=await mount(null,r=>r.url.endsWith("/submit")?Promise.reject(new Error("lost")):reply(r,graded),"student");const ops=new AttemptOperations(ui.session,"uc",user("student"),course,quiz,attempt);
 try{await ops.submit();await ops.consult();assert.deepEqual(ops.getSnapshot().receipt,receipt);}finally{ops.dispose();await ui.close();}
});
