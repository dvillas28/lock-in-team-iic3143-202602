import assert from 'node:assert/strict';
import {test} from 'node:test';
import validation from '../dist/quizzes/quiz-validation.js';
const {validateQuiz,validatePublish}=validation;
const question={prompt:'¿Cuánto es 2+2?',position:1,points:1,alternatives:[{id:'a',text:'4',isCorrect:true},{id:'b',text:'5',isCorrect:false}]};
test('quiz inputs are exact, preserve IDs and reject malformed nested state',()=>{
 const draft=validateQuiz({title:'  Control  ',questions:[question]});
 assert.equal(draft.title,'Control');assert.equal(draft.sectionId,null);assert.equal(draft.maxAttempts,null);
 assert.match(draft.questions[0].id,/^[0-9a-f-]{36}$/);validatePublish(draft);
 const updated=validateQuiz({questions:[{...question,id:draft.questions[0].id,prompt:'Editada'}]},draft);
 assert.equal(updated.questions[0].id,draft.questions[0].id);
 assert.notEqual(validateQuiz({questions:[question]},draft).questions[0].id,draft.questions[0].id);
 assert.equal(validateQuiz({sectionId:null},draft).sectionId,null);
 for(const input of [null,[],{},'x',{title:4},{title:'x',extra:true},{title:'x',questions:{}},{title:'x',questions:[{...question,extra:1}]},{title:'x',questions:[{...question,alternatives:[{...question.alternatives[0],extra:1},question.alternatives[1]]}]}])
  assert.throws(()=>validateQuiz(input),e=>e.getStatus()===400);
 for(const input of [{title:' '},{title:'a'.repeat(201)},{title:'x',instructions:'a'.repeat(10001)},{title:'x',instructions:'a\0b'},
  {title:'x',maxAttempts:0},{title:'x',maxAttempts:1.5},{title:'x',maxAttempts:2147483648},{title:'x',opensAt:'2026-01-02T00:00:00Z',closesAt:'2026-01-01T00:00:00Z'}])
  assert.throws(()=>validateQuiz(input),e=>e.getStatus()===422);
 for(const q of [{...question,points:0},{...question,points:NaN},{...question,points:Infinity},{...question,points:1.001},
  {...question,points:1000000},{...question,position:0},{...question,prompt:' '},
  {...question,alternatives:[question.alternatives[0]]},{...question,alternatives:question.alternatives.map(a=>({...a,isCorrect:true}))},
  {...question,alternatives:question.alternatives.map(a=>({...a,isCorrect:false}))},
  {...question,alternatives:question.alternatives.map(a=>({...a,id:'same'}))}])
  assert.throws(()=>validateQuiz({title:'x',questions:[q]}),e=>e.getStatus()===422);
 assert.throws(()=>validateQuiz({title:'x',questions:[question,question]}),e=>e.getStatus()===422);
 assert.throws(()=>validateQuiz({title:'x',questions:[{...question,id:draft.questions[0].id}]}),e=>e.getStatus()===400);
 assert.throws(()=>validateQuiz({questions:[{...question,id:'10000000-0000-4000-8000-000000000099'}]},draft),e=>e.getStatus()===422);
 assert.throws(()=>validateQuiz({questions:[{...question,id:draft.questions[0].id},{...question,id:draft.questions[0].id,position:2}]},draft),e=>e.getStatus()===422);
 assert.throws(()=>validatePublish(validateQuiz({title:'vacío'})),e=>e.getStatus()===422);
 assert.equal(validateQuiz({title:'x',questions:[{...question,points:0.29}]}).questions[0].points,0.29);
 assert.equal(validateQuiz({title:'x',maxAttempts:null,questions:[{...question,points:999999.99}]}).maxAttempts,null);
});
test('quiz dates require real timezone-aware calendar values, normalize offsets and retain microseconds',()=>{
 const draft=validateQuiz({title:'x',opensAt:'2026-10-19T12:30:00.123456-03:00',closesAt:'2026-10-20T00:00:00Z'});
 assert.equal(draft.opensAt,'2026-10-19T15:30:00.123456Z');
 for(const opensAt of [4,'2026-02-30T00:00:00Z','2026-01-01','2026-01-01T00:00:00','2026-01-01T00:00:00+25:00','0000-01-01T00:00:00Z'])
  assert.throws(()=>validateQuiz({title:'x',opensAt}),e=>e.getStatus()===400);
 assert.equal(validateQuiz({title:'x',opensAt:null}).opensAt,null);
 assert.throws(()=>validateQuiz({closesAt:'2026-10-18T00:00:00Z'},draft),e=>e.getStatus()===422);
});
