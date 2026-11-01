import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,renameSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {classifyChanges,changedFiles,detectChanges,eventSelection,resultDecision} from '../runner/ci-policy.ts';

test('documentation-only skips; code, mixed, runtime inputs and unknown files execute',()=>{
 assert.equal(classifyChanges(['docs/testing/E2E_README.md','specs/feature/plan.md','README.md','backend/README.md','mockups/assets/app.css']).required,false);
 for(const path of ['frontend/src/app/page.tsx','backend/src/main.ts','e2e/specs/auth.smoke.spec.ts','package.json','pnpm-lock.yaml','backend/migrations/001.sql','.github/workflows/e2e.yml','.npmrc','unknown-file','docs/testing/catalog/AUTH.md']){
  assert.equal(classifyChanges([path]).required,true,path);
  assert.equal(classifyChanges(['docs/guide.md',path]).required,true,path);
 }
 assert.equal(classifyChanges([]).required,true);
});
test('actual Git diff includes deleted code in a rename and uses the full PR range',()=>{
 const dir=mkdtempSync(resolve(tmpdir(),'academix-diff-test-'));
 const git=(...args:string[])=>execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const commit=()=>{git('add','.');git('-c','user.name=E2E','-c','user.email=e2e@example.invalid','commit','-m','fixture');return git('rev-parse','HEAD');};
 try{
  git('init');mkdirSync(resolve(dir,'backend'));writeFileSync(resolve(dir,'backend/main.ts'),'runtime');const base=commit();
  mkdirSync(resolve(dir,'docs'));writeFileSync(resolve(dir,'docs/guide.md'),'guide');const docHead=commit();
  const payload=(head:string)=>({pull_request:{base:{sha:base},head:{sha:head}}});
  assert.equal(detectChanges('pull_request',()=>payload(docHead),dir).required,false);
  renameSync(resolve(dir,'backend/main.ts'),resolve(dir,'docs/moved.ts'));const head=commit();
  const files=changedFiles('pull_request',payload(head),dir);assert(files.includes('backend/main.ts'));assert(files.includes('docs/guide.md'));
  assert.equal(classifyChanges(files).required,true);
  assert.equal(detectChanges('push',()=>({before:docHead,after:head}),dir).required,true);
  assert.equal(detectChanges('push',()=>({before:'f'.repeat(40),after:head}),dir).reason,'detection-failed');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('detection errors and unavailable comparison commits execute conservatively',()=>{
 assert.equal(detectChanges('pull_request',()=>{throw new Error('unreadable event');}).required,true);
 assert.equal(detectChanges('push',()=>({before:'0'.repeat(40),after:'a'.repeat(40)})).required,true);
 assert.equal(detectChanges('schedule',()=>{throw new Error('unused');}).required,true);
 assert.equal(detectChanges('workflow_dispatch',()=>({})).required,true);
});
test('event selections and always-result gate distinguish an explicit skip from missing execution',()=>{
 assert.deepEqual(eventSelection('pull_request'),{suite:'smoke',projects:['chromium']});
 assert.deepEqual(eventSelection('push'),{suite:'regression',projects:['chromium']});
 assert.deepEqual(eventSelection('schedule'),{suite:'extended',projects:['chromium','firefox','webkit']});
 for(const suite of ['smoke','regression','extended'])assert.equal(eventSelection('workflow_dispatch',suite).suite,suite);
 assert.throws(()=>eventSelection('workflow_dispatch','invalid'));
 const doc={result:'success',outputs:{required:'false',reason:'documentation-only'}};
 assert.equal(resultDecision('pull_request',doc,{result:'skipped'}).skip,true);
 for(const result of ['failure','cancelled','skipped',undefined]){
  assert.throws(()=>resultDecision('pull_request',{result:'failure'},{result}));
  assert.throws(()=>resultDecision('pull_request',{result:'success',outputs:{required:'true'}},{result}));
 }
 assert.throws(()=>resultDecision('schedule',doc,{result:'skipped'}));
 assert.throws(()=>resultDecision('pull_request',{result:'success',outputs:{required:'false',reason:'unknown'}},{result:'skipped'}));
 assert.equal(resultDecision('pull_request',{result:'failure'},{result:'success'}).skip,false);
 assert.equal(resultDecision('push',{result:'success',outputs:{required:'true',reason:'detection-failed'}},{result:'success'}).skip,false);
});
