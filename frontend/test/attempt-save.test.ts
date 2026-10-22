import assert from "node:assert/strict";
import {test} from "node:test";
import {AttemptOperations} from "../src/lib/attempts/operations.ts";
import {mount,reply,attempt,quiz,course,user,answers,deferred} from "./fixtures/attempts.ts";
test("full snapshot freezes edits/double save; empty requires explicit intent",async()=>{
 const wait=deferred<Response>();const ui=await mount(null,r=>r.method==="PUT"?wait.promise:reply(r),"student");
 const ops=new AttemptOperations(ui.session,"uc",user("student"),course,quiz,{...attempt,answers});
 try{ops.setDraft([]);await ops.save();assert.equal(ui.requests.some(r=>r.method==="PUT"),false);
 const p=ops.save(true);ops.setDraft(answers);await ops.save(true);assert.deepEqual(ops.getSnapshot().draft,[]);wait.resolve(Response.json(attempt));await p;assert.equal(ops.getSnapshot().phase,"saved");assert.deepEqual(ops.getSnapshot().confirmed,[]);}finally{ops.dispose();await ui.close();}
});
test("failed PUT preserves draft; uncertain PUT stays blocked even after GET",async()=>{
 for(const status of [422,503,0]){
 const ui=await mount(null,r=>r.method==="PUT"?(status?Response.json({},{status}):Promise.reject(new Error("lost"))):reply(r),"student");const ops=new AttemptOperations(ui.session,"uc",user("student"),course,quiz,attempt);
 try{ops.setDraft(answers);await ops.save();assert.deepEqual(ops.getSnapshot().draft,answers);assert.deepEqual(ops.getSnapshot().confirmed,[]);
 if(status!==422){assert.doesNotMatch(ops.getSnapshot().message,/su clave/);await ops.consult();await ops.save();await ops.submit();await ops.cancel();assert.equal(ops.getSnapshot().pending,"save");assert.equal(ui.requests.filter(r=>r.method==="PUT").length,1);assert.equal(ui.requests.some(r=>r.url.endsWith("/submit")||r.url.endsWith("/cancel")),false);}
 }finally{ops.dispose();await ui.close();}
 }
});
