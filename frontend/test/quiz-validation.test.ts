import assert from "node:assert/strict";
import { test } from "node:test";
import { quizInput, questionsInput, jsonBody, timestamp } from "../src/lib/quizzes/validation.ts";
import { configuration, localDate } from "../src/components/quizzes/quiz-configuration.tsx";
import { draft, question, id } from "./fixtures/quizzes.ts";
test("validation boundaries and JSON UTF8 bytes include escapes",()=>{
 for(const b of [{title:"x".repeat(201)},{title:"\0"},{instructions:"x".repeat(10001)},{maxAttempts:0},{maxAttempts:2147483648},{opensAt:"2026-02-30T00:00:00Z"},{opensAt:"2026-10-22T00:00:00"},{opensAt:"2026-10-23T00:00:00Z",closesAt:"2026-10-22T00:00:00Z"},{sectionId:"bad"},{createdBy:id(1)},{}]) assert.throws(()=>quizInput(b,draft));
 assert.equal(quizInput({title:"x".repeat(200)},draft).title?.length,200);
 assert.equal(quizInput({maxAttempts:2147483647},draft).maxAttempts,2147483647);
 assert.deepEqual(quizInput({opensAt:null,closesAt:null,maxAttempts:null},draft),{opensAt:null,closesAt:null,maxAttempts:null});
 assert.equal(quizInput({title:"x"},draft).sectionId,undefined);assert.equal(quizInput({sectionId:null},draft).sectionId,null);
 for(const key of ["é","😀","\n",'"']) {
  const body={x:""};while(new TextEncoder().encode(JSON.stringify({...body,x:body.x+key})).length<=4096)body.x+=key;
  const size=new TextEncoder().encode(JSON.stringify(body)).length;body.x+='a'.repeat(4096-size);
  assert.equal(new TextEncoder().encode(JSON.stringify(jsonBody(body))).length,4096);
  assert.throws(()=>jsonBody({x:body.x+'a'}));
 }
 assert.deepEqual(quizInput({opensAt:"2026-10-22T12:00:00.000001Z",closesAt:"2026-10-22T09:00:00.000002-03:00"},draft),{opensAt:"2026-10-22T12:00:00.000001Z",closesAt:"2026-10-22T09:00:00.000002-03:00"});
 assert.throws(()=>quizInput({opensAt:"2026-10-22T12:00:00.000002Z",closesAt:"2026-10-22T09:00:00.000001-03:00"},draft));
 assert.equal(timestamp("2026-10-22T12:00:00.123456-03:00","date"),"2026-10-22T12:00:00.123456-03:00");
});
test("question identity, positions, cents, totals and exactly one correct",()=>{
 const bad=[{...question,id:id(99)},{...question,position:0},{...question,position:2147483648},{...question,prompt:" "},...[0,-1,0.001,Infinity,NaN,1000000].map(points=>({...question,points})),{...question,alternatives:question.alternatives.slice(0,1)},{...question,alternatives:question.alternatives.map(a=>({...a,isCorrect:false}))},{...question,alternatives:question.alternatives.map(a=>({...a,isCorrect:true}))},{...question,alternatives:question.alternatives.map(a=>({...a,id:"a"}))},{...question,alternatives:[{...question.alternatives[0],text:"\0"},question.alternatives[1]]}];
 for(const q of bad)assert.throws(()=>questionsInput([q],draft));
 assert.throws(()=>questionsInput([question,question],draft));
 const {id:unused,...fresh}=question;assert.ok(unused);
 assert.throws(()=>questionsInput([{...fresh,points:999999.99},{...fresh,position:2,points:0.01}]));
 assert.equal(questionsInput([{...fresh,points:999999.99}])[0].points,999999.99);
 assert.deepEqual(questionsInput([],draft),[]);
});
test("unchanged local datetime preserves microseconds and partial patch does not reinterpret null",()=>{
 const original={...draft,opensAt:"2026-10-22T12:00:00.123456Z"};
 const data=new FormData();for(const [k,v] of Object.entries({title:draft.title,sectionId:draft.sectionId!,instructions:"",opensAt:localDate(original.opensAt),closesAt:"",maxAttempts:""}))data.set(k,v);
 assert.equal(configuration(data,original).opensAt,original.opensAt);
 data.set('opensAt','2026-10-23T12:30');assert.match(configuration(data,original).opensAt!,/Z$/);
 data.set('opensAt','bad');assert.throws(()=>configuration(data,original));
});
