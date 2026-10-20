import assert from 'node:assert/strict';
import {test} from 'node:test';
import access from '../dist/quizzes/quiz-access.js';
import dto from '../dist/quizzes/quiz-dto.js';
test('quiz academic ownership, section scopes and immutable state use the same policy',()=>{
 const base={owner:false,roles:[{role:'teacher',section_id:'a'},{role:'student',section_id:'b'}]};
 assert.equal(access.canAuthorQuiz(base,'a'),true);assert.equal(access.canAuthorQuiz(base,'b'),false);
 assert.equal(access.canAuthorQuiz(base,null),false);
 assert.equal(access.canAuthorQuiz({...base,owner:true},null),true);
 assert.equal(access.canAuthorQuiz({owner:true,roles:[]},null),false);
 access.requireDraft({published_at:null});
 assert.throws(()=>access.requireDraft({published_at:new Date()}),e=>e.getStatus()===409);
});
test('quiz student DTO is an explicit nested projection; audit never retains question content',()=>{
 const row={id:'q',course_id:'c',section_id:null,title:'Control',instructions:null,opens_at:null,closes_at:null,max_attempts:null,published_at:null,created_by:'u',
 questions:[{id:'p',position:1,prompt:'Pregunta',points:1,secret:'hidden',alternatives:[{id:'a',text:'Sí',isCorrect:true,secret:'hidden'}]}]};
 assert.equal(dto.authoringDto(row).questions[0].alternatives[0].isCorrect,true);
 assert.deepEqual(dto.studentDto(row).questions,[{id:'p',position:1,prompt:'Pregunta',points:1,alternatives:[{id:'a',text:'Sí'}]}]);
 assert.equal('questions' in dto.summaryDto(row),false);
 assert.equal('questions' in dto.quizSnapshot(row),false);
 assert.equal('instructions' in dto.quizSnapshot(row),false);
});
