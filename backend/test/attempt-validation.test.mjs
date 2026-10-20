import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import validation from '../dist/attempts/attempt-validation.js';
import dto from '../dist/attempts/attempt-dto.js';
test('strict answers, empty body and original idempotency header',()=>{
 const {answersInput,emptyBody,idempotencyKey}=validation,id=randomUUID();
 assert.deepEqual(answersInput({answers:[]}),[]);
 assert.deepEqual(answersInput({answers:[{questionId:id,alternativeId:'a'}]}),[{questionId:id,alternativeId:'a'}]);
 for(const body of [null,[],{}, {answers:[],studentId:id},{answers:[{questionId:id,alternativeId:'a',isCorrect:true}]},
  {answers:[{questionId:id,alternativeId:'a'},{questionId:id,alternativeId:'b'}]}, {answers:[{questionId:'bad',alternativeId:'a'}]},
  {answers:[{questionId:id,alternativeId:''}]}, {answers:'bad'}])assert.throws(()=>answersInput(body));
 emptyBody(undefined);emptyBody({});for(const b of [null,[],{id}])assert.throws(()=>emptyBody(b));
 for(const key of ['', 'a'.repeat(201),'a\n','a\u0085',undefined])assert.throws(()=>idempotencyKey(['Idempotency-Key',key]));
 assert.equal(idempotencyKey(['idempotency-key','A']), 'A');
 assert.throws(()=>idempotencyKey(['Idempotency-Key','A','idempotency-key','B']));
});
test('student/assistant projections never serialize correction or private keys',()=>{
 const row={id:randomUUID(),quiz_id:randomUUID(),section_id:randomUUID(),student_id:randomUUID(),attempt_number:1,
  started_at:'2026-01-01',submitted_at:'2026-01-02',cancelled_at:null,status:'graded',score_percent:'60.00',grade_value:'4.0',
  start_key:'private',submit_key:'secret',answers:[{questionId:randomUUID(),alternativeId:'a',isCorrect:true,pointsAwarded:1}]};
 const student=dto.attemptDto(row,'student'),assistant=dto.attemptDto(row,'assistant'),teacher=dto.attemptDto(row,'teacher');
 for(const view of [student,assistant])for(const key of ['isCorrect','pointsAwarded','private','secret'])assert.ok(!JSON.stringify(view).includes(key));
 assert.ok(!('grade' in student));assert.equal(assistant.grade,4);assert.equal(teacher.answers[0].isCorrect,true);
 assert.deepEqual(dto.submissionReceipt(row),{id:row.id,status:'graded',submittedAt:'2026-01-02'});
 assert.equal(dto.attemptDto({...row,status:'in_progress',answers:[],score_percent:null,grade_value:null},'teacher').grade,null);
});
