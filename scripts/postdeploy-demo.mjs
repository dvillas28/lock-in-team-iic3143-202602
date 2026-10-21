import {setTimeout as delay} from 'node:timers/promises';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const origins=['https://uc.academix.dvillasc.me','https://utfsm.academix.dvillasc.me'];
const roles=['superadmin','admin','teacher','assistant','student'];
const check=(ok,message)=>{if(!ok)throw Error(message);};
export async function smoke({baseUrl='https://api.dvillasc.me',env=process.env,workflow=false,fetcher=fetch}={}) {
 if(env.SMOKE_ALLOWED_ORIGIN)check(origins.includes(env.SMOKE_ALLOWED_ORIGIN),'Unknown smoke origin');
 const base=new URL(baseUrl);check(base.origin===baseUrl && (base.protocol==='https:' || ['localhost','127.0.0.1'].includes(base.hostname)),'Invalid API origin');
 const call=async(path,{token,method='GET',body,key,origin,status=200}={})=>{
  const response=await fetcher(baseUrl+path,{method,redirect:'error',signal:AbortSignal.timeout(10000),headers:{
   ...(token?{Authorization:'Bearer '+token}:{}),...(body===undefined?{}:{'Content-Type':'application/json'}),...(key?{'Idempotency-Key':key}:{}),...(origin?{Origin:origin}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  check(response.status===status,`Unexpected HTTP status (${method}, expected ${status}, received ${response.status})`);
  if(origin && origins.includes(origin))check(response.headers.get('access-control-allow-origin')===origin,'Missing CORS origin');
  return response.status===204?null:response.json();
 };
 const health=await call('/health');check(health.status==='ok' && health.version && health.commit,'Missing release metadata');await call('/ready');
 for(const origin of [...origins,'https://cors-denied.invalid']) {
  const response=await fetcher(baseUrl+'/api/v1/institution/uc/me',{method:'OPTIONS',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Origin:origin,'Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization,content-type,idempotency-key'}});
  check(response.headers.get('access-control-allow-origin')===(origins.includes(origin)?origin:null),'CORS origin mismatch');
  if(origins.includes(origin))check(response.status===204 && /Origin/i.test(response.headers.get('vary')??''),'Invalid preflight');
 }
 const accounts={};
 for(const slug of ['uc','utfsm']) {
  // Preserve the existing five-logins/minute quota for the ten-account workflow.
  if(workflow && slug==='utfsm'){await delay(31000);await delay(31000);}
  const prefix='/api/v1/institution/'+slug;
  accounts[slug]={};
  for(const role of workflow?roles:['superadmin']) {
   const password=env[`DEMO_${slug.toUpperCase()}_${role.toUpperCase()}_PASSWORD`];check(typeof password==='string' && password.length>0,'Missing smoke credentials');
   const login=await call('/api/v1/auth/login',{method:'POST',body:{email:`${role}.${slug}@academix.example`,password}});
   check(typeof login.accessToken==='string','Missing token');
   const me=await call(prefix+'/me',{token:login.accessToken,origin:origins[slug==='uc'?0:1]});
   check(me.institutionMembership.institution.slug===slug,'Context mismatch');
   accounts[slug][role]={token:login.accessToken,me};
  }
  await call('/api/v1/institution/'+(slug==='uc'?'utfsm':'uc')+'/me',{token:accounts[slug].superadmin.token,status:404});
  await call(prefix+'/me',{status:401});
  if(workflow)await academicWorkflow(slug,accounts[slug],call,env);
 }
 return {status:'ok',version:health.version,commit:health.commit,workflow,tenants:['uc','utfsm']};
}
async function academicWorkflow(slug,accounts,call,env) {
 const prefix='/api/v1/institution/'+slug,op=(role,path,options={})=>call(prefix+path,{token:accounts[role].token,...options});
 if(!accounts.admin.me.institutionMembership.isAdmin) {
  check(env.SMOKE_DELEGATE_ADMIN==='true','Admin delegation required; set SMOKE_DELEGATE_ADMIN=true explicitly to grant it');
  await op('superadmin',`/memberships/${accounts.admin.me.institutionMembership.id}/course-admin`,{method:'PUT',body:{isAdmin:true}});
 }
 const course=await op('admin','/courses',{method:'POST',status:201,body:{code:'SMOKE-'+randomUUID().slice(0,8),name:'Demo smoke',term:'2026-2',initialSection:{code:'1'}}});
 const section=(await op('admin',`/courses/${course.id}/sections`)).items[0].id;
 for(const role of ['teacher','assistant','student'])await op('admin',`/sections/${section}/enrollments`,{method:'POST',status:201,body:{userId:accounts[role].me.id,role}});
 await op('student',`/courses/${course.id}/modules`,{method:'POST',body:{title:'Denied',position:1},status:403});
 const module=await op('teacher',`/courses/${course.id}/modules`,{method:'POST',status:201,body:{title:'Module',position:1}});
 const material=await op('teacher',`/modules/${module.id}/materials`,{method:'POST',status:201,body:{title:'Notes',markdownBody:'# Demo'}});
 await op('teacher',`/modules/${module.id}/publish`,{method:'POST'});await op('teacher',`/materials/${material.id}/publish`,{method:'POST'});
 await op('student',`/materials/${material.id}`);
 const quiz=await op('teacher',`/courses/${course.id}/quizzes`,{method:'POST',status:201,body:{title:'Quiz',sectionId:section,questions:[{prompt:'2+2?',position:1,points:1,alternatives:[{id:'a',text:'4',isCorrect:true},{id:'b',text:'3',isCorrect:false}]}]}});
 await op('teacher',`/quizzes/${quiz.id}/publish`,{method:'POST'});
 const item=(await op('admin',`/courses/${course.id}/grade-items`)).items[0].id;
 await op('admin',`/courses/${course.id}/gradebook/weights`,{method:'PUT',body:{items:[{gradeItemId:item,weightPercent:100}]}});
 const safe=await op('student',`/quizzes/${quiz.id}`);
 check(!('isCorrect' in safe.questions[0].alternatives[0]),'Correction exposed');
 const attempt=await op('student',`/sections/${section}/quizzes/${quiz.id}/attempts`,{method:'POST',status:201,key:randomUUID(),body:{}});
 await op('student',`/quiz-attempts/${attempt.id}/answers`,{method:'PUT',body:{answers:[{questionId:safe.questions[0].id,alternativeId:'a'}]}});
 await op('student',`/quiz-attempts/${attempt.id}/submit`,{method:'POST',key:randomUUID(),body:{}});
 check((await op('student',`/courses/${course.id}/my-grades`)).items.length===0,'Unpublished grade exposed');
 await op('assistant',`/courses/${course.id}/gradebook/publications`,{method:'POST',status:403,key:randomUUID(),body:{gradeItemIds:[item],sectionIds:[section],studentIds:[accounts.student.me.id]}});
 await op('teacher',`/courses/${course.id}/gradebook/publications`,{method:'POST',key:randomUUID(),body:{gradeItemIds:[item],sectionIds:[section],studentIds:[accounts.student.me.id]}});
 check((await op('student',`/courses/${course.id}/my-grades`)).partialAverage===7,'Published grade mismatch');
 await op('superadmin',`/courses/${course.id}`,{status:404});
 await call('/api/v1/institution/'+(slug==='uc'?'utfsm':'uc')+`/courses/${course.id}`,{token:accounts.teacher.token,status:404});
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
 smoke({baseUrl:process.env.SMOKE_API_URL??'https://api.dvillasc.me',workflow:process.argv.includes('--workflow')})
  .then(result=>console.log(JSON.stringify(result))).catch(()=>{console.error('Demo smoke failed; response and credentials withheld');process.exitCode=1;});
}
