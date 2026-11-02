import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import service from '../dist/attempts/attempts.service.js';
const tenant=randomUUID(),actor=randomUUID(),course=randomUUID(),quiz=randomUUID(),section=randomUUID();
const attempt={id:randomUUID(),institution_id:tenant,course_id:course,quiz_id:quiz,section_id:section,student_id:actor,attempt_number:1,status:'graded',
 started_at:'2026-11-01T10:00:00.123456Z',cursor_date:'2026-11-01T10:00:00.123456Z',submitted_at:'2026-11-01T10:01:00Z',cancelled_at:null,
 answers:[{questionId:randomUUID(),alternativeId:'a',isCorrect:true,pointsAwarded:2}],score_percent:'100',grade_value:'7'};
function fixture(options={}) {
 const queries=[];
 const q={id:quiz,course_id:course,section_id:section,published_at:new Date(),opens_at:null,closes_at:null,max_attempts:3,...options.quiz};
 const c={query:async(sql,args=[])=>{
  queries.push({sql,args});
  let rows=[];
  if(sql.startsWith('SELECT active FROM'))rows=[{active:options.active!==false}];
  else if(sql.startsWith('SELECT m.*'))rows=options.member===false?[]:[{institution_id:tenant,user_id:actor,is_admin:false}];
  else if(sql.startsWith('SELECT course_id,'))rows=[{course_id:course,quiz_id:quiz}];
  else if(sql.startsWith('SELECT * FROM public.courses'))rows=[{id:course,created_by:randomUUID()}];
  else if(sql.startsWith('SELECT e.*'))rows=(options.roles??['student']).map(role=>({role,section_id:section}));
  else if(sql.startsWith('SELECT q.section_id'))rows=[{section_id:section}];
  else if(sql.startsWith('SELECT * FROM public.quizzes'))rows=[q];
  else if(sql.includes('AS used,'))rows=[{used:options.used??1,active:options.activeAttemptId??null}];
  else if(sql.startsWith('SELECT * FROM public.grades'))rows=options.publishedGrade?[{published_at:new Date()}]:[];
  else if(sql.includes('AS opened,'))rows=[{opened:options.opened!==false,unclosed:options.unclosed!==false}];
  else if(sql.startsWith('SELECT a.*,'))rows=options.rows??[attempt];
  else assert.match(sql,/^SELECT (id|m.id)/);
  return {rows};
 }};
 return {queries,api:new service.AttemptsService({withInstitution:async(a,slug,fn)=>{assert.equal(a,actor);assert.equal(slug,'uc');return fn(c);}},{} )};
}

test('own history is tenant/actor scoped, paginated newest first and strips grades and correction',async()=>{
 const next={...attempt,id:randomUUID()};
 const {api,queries}=fixture({rows:[attempt,next],activeAttemptId:next.id});
 const page=await api.mine(actor,'uc',quiz,{limit:'1'});
 assert.equal(page.items.length,1);assert.equal(page.hasMore,true);
 assert.equal(page.availability.activeAttemptId,next.id);
 assert.equal(page.availability.canStart,false);assert.equal(page.availability.reason,'activeAttempt');
 assert.equal(page.availability.remainingAttempts,2);
 assert.equal('grade'in page.items[0],false);assert.equal('scorePercent'in page.items[0],false);
 assert.deepEqual(page.items[0].answers,[{questionId:attempt.answers[0].questionId,alternativeId:'a'}]);
 const history=queries.find(x=>x.sql.startsWith('SELECT a.*,'));
 assert.deepEqual(history.args.slice(0,3),[tenant,quiz,actor]);
 assert.match(history.sql,/a.institution_id=\$1 AND a.quiz_id=\$2 AND a.student_id=\$3/);
 assert.match(history.sql,/ORDER BY a.started_at DESC,a.id DESC/);
 await api.mine(actor,'uc',quiz,{limit:'1',cursor:page.nextCursor});
 assert.equal(queries.at(-1).args[3],attempt.started_at);
 assert.ok(queries.every(x=>x.sql.startsWith('SELECT')));
});

test('availability uses full history and server time; querying never writes academic data',async()=>{
 for(const [options,reason] of [[{},null],[{used:3},'limitReached'],[{publishedGrade:true},'gradesPublished'],[{opened:false},'notOpen'],[{unclosed:false},'closed']]){
  const {api,queries}=fixture({...options,rows:[]});
  const r=await api.mine(actor,'uc',quiz,{});
  assert.equal(r.availability.reason,reason);assert.equal(r.availability.canStart,reason===null);
  assert.ok(queries.every(x=>x.sql.startsWith('SELECT')));
 }
 const {api}=fixture({used:100,quiz:{max_attempts:null}});
 assert.equal((await api.mine(actor,'uc',quiz,{})).availability.remainingAttempts,null);
});

test('every request revalidates enrollment, identity and tenant; no student filter can broaden scope',async()=>{
 for(const [options,status] of [[{roles:['teacher','student']},403],[{roles:['assistant']},403],[{roles:[]},404],[{member:false},404],[{active:false},401]]){
  const {api,queries}=fixture(options);
  await assert.rejects(api.mine(actor,'uc',quiz,{}),e=>e.getStatus()===status);
  assert.equal(queries.some(x=>x.sql.startsWith('SELECT a.*,')),false);
 }
 for(const query of [{studentId:randomUUID()},{sectionId:section},{limit:'101'},{cursor:'invalid'}]){
  const {api}=fixture();await assert.rejects(api.mine(actor,'uc',quiz,query),e=>e.getStatus()===400);
 }
 const {api}=fixture({roles:['student','assistant']});
 assert.equal((await api.mine(actor,'uc',quiz,{})).items[0].studentId,actor);
});
