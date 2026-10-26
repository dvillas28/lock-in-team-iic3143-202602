import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { QuizEditor } from "../src/components/quizzes/quiz-editor.tsx";
import { mount, reply, course, draft, deferred, id } from "./fixtures/quizzes.ts";
const view=()=>h(QuizEditor,{courseId:course.id,quizId:draft.id});
test("pending private read/write is discarded on logout, tenant, user, revocation and expiry",async()=>{
 for(const operation of ['read','write'])for(const change of ['logout','tenant','user','revocation','expiry']) {
 const realNow=Date.now;let clock=realNow();if(change==='expiry')Date.now=()=>clock;
 let held=false;const pending=deferred<Response>();const ui=await mount(view(),r=>{if((operation==='read'&&r.url.endsWith('/authoring')&&!held)||r.method==='PATCH'){held=true;return pending.promise;}return reply(r);},'teacher');
 try{
 if(operation==='write')await ui.submit('form',{title:'Privado'});
 if(change==='logout')await ui.settle(()=>ui.session.logout());
 else if(change==='expiry'){clock+=1000000;await ui.settle(()=>ui.session.checkExpiry());}
 else await ui.actor(change==='revocation'?'student':change==='user'?'foreign':'teacher',change==='tenant'?'utfsm':'uc');
 await ui.settle(()=>pending.resolve(Response.json({...draft,title:'Privado',courseId:change==='tenant'?id(11):course.id})));
 assert.doesNotMatch(ui.doc.body.textContent!,/Privado|Quiz creado|Quiz actualizado|Publicación confirmada/,operation+":"+change);
 assert.equal(ui.dom.window.localStorage.length,0);assert.equal(ui.dom.window.sessionStorage.length,0);assert.doesNotMatch(ui.dom.window.location.href,/Privado|isCorrect/);
 }finally{await ui.close();Date.now=realNow;}
 }
});
test("403/404 in authoring clears private form and revalidates context; 401 expires session",async()=>{
 for(const status of [401,403,404]) {
 const ui=await mount(view(),r=>r.method==='PATCH'?Response.json({detail:'SECRET'},{status}):reply(r),'teacher');
 try{await ui.submit('form',{title:'Privado'});assert.equal(ui.doc.querySelector('form'),null);assert.doesNotMatch(ui.doc.body.textContent!,/SECRET|Privado|Por institución/);if(status!==401)assert.ok(ui.requests.filter(r=>r.url.endsWith('/me')).length>1);}finally{await ui.close();}
 }
});
