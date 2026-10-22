import assert from "node:assert/strict";
import {test} from "node:test";
import {createElement as h} from "react";
import {AttemptDetail} from "../src/components/attempts/attempt-detail.tsx";
import {AttemptOperations} from "../src/lib/attempts/operations.ts";
import {mount,reply,attempt,quiz,course,user,answers,deferred,tenants,flush} from "./fixtures/attempts.ts";
test("logout, actor/context changes discard late mutation and erase draft/keys",async()=>{
 for(const action of ["logout","actor","tenant","resource"]){
 const wait=deferred<Response>();const ui=await mount(null,r=>r.method==="PUT"?wait.promise:reply(r),"student");const ops=new AttemptOperations(ui.session,"uc",user("student"),course,quiz,attempt);
 const off=ops.subscribe(()=>{});
 try{ops.setDraft(answers);const p=ops.save();await flush();if(action==="logout")await ui.settle(()=>ui.session.logout());else if(action==="resource")ops.dispose();else await ui.actor(action==="actor"?"teacher":"student",action==="tenant"?"utfsm":"uc");wait.resolve(Response.json({...attempt,answers}));await p;assert.equal(ops.getSnapshot().attempt,undefined);assert.deepEqual(ops.getSnapshot().draft,[]);await ops.replay();assert.equal(ui.requests.filter(r=>r.method==="PUT").length,1);}finally{off();ops.dispose();await ui.close();}
 }
});
test("UC/UTFSM 401/403/404 and historical quiz 404 clear private attempt data",async()=>{
 for(const tenant of tenants)for(const status of [401,403,404]){
 const ui=await mount(h(AttemptDetail,{attemptId:attempt.id}),r=>r.url.includes("/quizzes/")?Response.json({},{status}):reply(r),"student",tenant);
 try{assert.doesNotMatch(ui.doc.body.textContent!,/Sección histórica|Por institución|Confirmar envío/);assert.equal(ui.doc.querySelectorAll('input[type="radio"]').length,0);assert.equal(ui.session.getSnapshot().context?.user,undefined);}finally{await ui.close();}
 }
});

test("late JSON bodies after revocation cannot restore data or chain another mutation",async()=>{
 for(const operation of ['start','save','submit'] as const){
 const body=deferred<Uint8Array>();
 const ui=await mount(null,r=>r.method==='GET'?reply(r):new Response(new ReadableStream({async start(c){c.enqueue(await body.promise);c.close();}}),{headers:{'Content-Type':'application/json'}}),'student');
 const ops=new AttemptOperations(ui.session,'uc',user('student'),course,quiz,operation==='start'?undefined:attempt),off=ops.subscribe(()=>{});
 try{if(operation==='save')ops.setDraft(answers);const p=operation==='start'?ops.start(attempt.sectionId):operation==='save'?ops.save():ops.submit(true);await flush();await ui.actor('assistant');
 body.resolve(new TextEncoder().encode(JSON.stringify(attempt)));await p;assert.equal(ops.getSnapshot().attempt,undefined);assert.deepEqual(ops.getSnapshot().draft,[]);assert.equal(ui.requests.filter(r=>r.url.includes('/quiz-attempts/')&&r.method==='GET').length,0);
 }finally{off();ops.dispose();await ui.close();}
 }
});
