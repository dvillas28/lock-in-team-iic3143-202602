import assert from "node:assert/strict";
import {test} from "node:test";
import {attemptDto, submissionReceipt, answersInput} from "../src/lib/attempts/validation.ts";
import {attempt, graded, cancelled, receipt, answers, quiz, id} from "./fixtures/attempts.ts";
test("attempt validates IDs, state/date combinations, student fields; staff projection strips grading",()=>{
 assert.deepEqual(attemptDto(attempt,{id:attempt.id,studentId:attempt.studentId}),attempt);
 for(const v of [{...attempt,id:"bad"},{...attempt,attemptNumber:0},{...attempt,startedAt:"2026-02-30T00:00:00Z"},{...attempt,status:"graded"},{...graded,cancelledAt:graded.submittedAt},{...cancelled,submittedAt:graded.submittedAt},{...attempt,grade:null},{...attempt,answers:[{...answers[0],isCorrect:false}]}]) assert.throws(()=>attemptDto(v,{studentId:attempt.studentId}));
 assert.throws(()=>attemptDto(attempt,{id:id(90)}));assert.throws(()=>attemptDto(attempt,{studentId:id(90)}));
 assert.throws(()=>attemptDto({...attempt,id:attempt.id+"\n"}));
 assert.deepEqual(attemptDto({...graded,grade:7,scorePercent:100,answers:[{...answers[0],isCorrect:true,pointsAwarded:2}]},{staff:true}),{...graded,answers:[]});
 assert.deepEqual(submissionReceipt(receipt,attempt.id),receipt);
 for(const v of [cancelled,{...receipt,grade:null},{...receipt,score:100},{...receipt,submittedAt:null}])assert.throws(()=>submissionReceipt(v,attempt.id));
});
test("answers are full, unique, scoped, strings and JSON UTF-8 bounded",()=>{
 assert.deepEqual(answersInput(answers,quiz),{answers});assert.deepEqual(answersInput([],quiz),{answers:[]});
 for(const v of [[...answers,...answers],[{...answers[0],questionId:id(99)}],[{...answers[0],alternativeId:"foreign"}],[{...answers[0],studentId:id(1)}]])assert.throws(()=>answersInput(v,quiz));
 const big={...quiz,questions:[{...quiz.questions[0],alternatives:[{id:"á".repeat(2100),text:"x"}]}]};
 assert.throws(()=>answersInput([{questionId:big.questions[0].id,alternativeId:big.questions[0].alternatives[0].id}],big),/4096/);
});
