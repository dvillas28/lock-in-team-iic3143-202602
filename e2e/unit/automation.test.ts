import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {caseDefinitions} from '../data/case-variants.ts';
import {assess,stabilityWindow,type RunMeta} from '../runner/assessment.ts';
import {expectedKeys,selection,suiteIds} from '../runner/suites.ts';
import {assertSafeArtifact,publishArtifacts,verifyBundle} from '../runner/artifacts.ts';
import {aggregate} from '../runner/ci-result.ts';
import {lease} from '../runner/lease.ts';
const meta:RunMeta={runId:'a'.repeat(16),commit:'a'.repeat(40),seedVersion:'v1',dirtyAtStart:false,dirty:false,exitCode:0,phase:'playwright',durationMs:100,startedAt:'2026-10-31T00:00:00Z',finishedAt:'2026-10-31T00:00:01Z',suite:'custom',projects:['chromium'],environment:{test:true},cleanup:true,cancelled:false};
const spec=(key:string,status='expected',attempts=['passed'])=>{const [id,name,projectName]=key.split('/'),v=caseDefinitions[id].find(v=>v.name===name)!;return {title:`${id} / ${name} @smoke`,tests:[{projectName,status,annotations:Object.entries({case:id,actor:v.actor,tenant:v.tenant,level:v.level}).map(([type,description])=>({type,description})),results:attempts.map((status,retry)=>({status,retry,duration:10}))}]};};
const report=(keys:string[],status='expected',attempts=['passed'])=>({suites:[{specs:keys.map(k=>spec(k,status,attempts))}],errors:[]});
const key='E2E-AUTH-001/ST1/chromium';
test('named selections derive all variants from authoritative catalogue without accepting narrow filters',()=>{
 const projects=['chromium','firefox','webkit'];
 assert.equal(suiteIds('smoke').length,22);
 assert.equal(expectedKeys('smoke',projects).length,158);
 assert.equal(expectedKeys('extended',projects).length,526);
 assert.equal(selection(['--suite=smoke']).suite,'smoke');
 assert.throws(()=>selection(['--suite=smoke','--grep','AUTH']));
 assert.throws(()=>selection(['--suite=invalid']));
 assert.throws(()=>selection(['--suite=smoke','--project=mobile']));
});
test('empty missing skipped interrupted expected-failure and flaky reports are never green',()=>{
 assert.equal(assess(meta,report([key])).passed,true);assert.equal(assess(meta,undefined).passed,false);assert.equal(assess(meta,report([])).passed,false);
 for(const [state,attempts] of [['skipped',['skipped']],['unexpected',['interrupted']],['expected',['failed']],['flaky',['failed','passed']]] as [string,string[]][])assert.equal(assess(meta,report([key],state,attempts)).passed,false);
 assert.equal(assess({...meta,cleanup:false},report([key])).classification,'cleanup');assert.equal(assess({...meta,cancelled:true},report([key])).classification,'cancelled');assert.equal(assess({...meta,suite:'smoke'},report([key])).passed,false);
});
test('metadata duplicates and undeclared engines cannot certify execution',()=>{
 assert.equal(assess(meta,report([key,key])).passed,false);const r=report([key]);r.suites[0].specs[0].tests[0].annotations=[];assert.equal(assess(meta,r).passed,false);assert.equal(assess(meta,report([key.replace('chromium','mobile')])).passed,false);
});
test('aggregate rejects missing duplicate changed-SHA failed or incomplete jobs',()=>{
 const summaries=['chromium','firefox','webkit'].map(project=>assess({...meta,suite:'smoke',projects:[project]},report(expectedKeys('smoke',[project]))));assert.equal(aggregate(summaries,'smoke',['chromium','firefox','webkit'],meta.commit).passed,true);
 assert.equal(aggregate([summaries[0]],'smoke',['chromium'],meta.commit).passed,true);assert.equal(aggregate(summaries,'smoke',['chromium'],meta.commit).passed,false);
 assert.equal(aggregate(summaries.slice(1),'smoke',['chromium','firefox','webkit'],meta.commit).passed,false);assert.equal(aggregate([summaries[0],summaries[0],summaries[2]],'smoke',['chromium','firefox','webkit'],meta.commit).passed,false);assert.equal(aggregate(summaries,'smoke',['chromium','firefox','webkit'],'b'.repeat(40)).passed,false);assert.equal(aggregate([{...summaries[0],passed:false},...summaries.slice(1)],'smoke',['chromium','firefox','webkit'],meta.commit).passed,false);
});
test('twenty unique comparable clean smoke executions are required and one bad run invalidates the window',()=>{
 const base=assess({...meta,suite:'smoke',projects:['chromium','firefox','webkit']},report(expectedKeys('smoke',['chromium','firefox','webkit']))),runs=Array.from({length:20},(_,i)=>({...base,runId:i.toString(16).padStart(16,'0')}));assert.equal(stabilityWindow(runs).passed,true);assert.equal(stabilityWindow(runs.slice(1)).passed,false);assert.equal(stabilityWindow([...runs.slice(0,19),runs[0]]).passed,false);
 for(const patch of [{passed:false},{dirty:true},{commit:'other'},{environmentHash:'other'},{suite:'extended' as const}])assert.equal(stabilityWindow([...runs.slice(0,19),{...runs[19],...patch}]).passed,false);assert.throws(()=>stabilityWindow(runs,19));
});
test('changed source cannot certify a run or window and cross-job seed/environment drift is rejected',()=>{
 assert.equal(assess({...meta,endCommit:'other'},report([key])).passed,false);
 const jobs=['chromium','firefox','webkit'].map(project=>assess({...meta,suite:'smoke',projects:[project]},report(expectedKeys('smoke',[project]))));
 for(const patch of [{seedVersion:'other'},{environmentHash:'other'},{endCommit:'other'}])assert.equal(aggregate([{...jobs[0],...patch},...jobs.slice(1)],'smoke',['chromium','firefox','webkit'],meta.commit).passed,false);
 const base=assess({...meta,suite:'smoke',projects:['chromium','firefox','webkit']},report(expectedKeys('smoke',['chromium','firefox','webkit'])));
 assert(stabilityWindow([base,{...base,runId:'b'.repeat(16),commit:'other'}]).reasons.includes('mixed-commit'));
});
test('public bundle is allowlisted escaped checksum verified and excludes credential/trace bodies',async()=>{
 const dir=await mkdtemp(resolve(tmpdir(),'academix-public-test-'));try{const summary=assess(meta,report([key]));summary.tests[0].variant='<script>alert(1)</script>';const folder=await publishArtifacts(dir,summary,['known-secret']);assert.equal((await verifyBundle(folder)).runId,meta.runId);const html=await readFile(resolve(folder,'index.html'),'utf8');assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));await writeFile(resolve(folder,'extra.zip'),'private');await assert.rejects(verifyBundle(folder));await rm(resolve(folder,'extra.zip'));await writeFile(resolve(folder,'index.html'),'tampered');await assert.rejects(verifyBundle(folder));}finally{await rm(dir,{recursive:true,force:true});}
 for(const value of ['known-secret','eyJhbGciOiJIUzI1NiJ9.e30.signature','postgresql://user:password@host/db','-----BEGIN PRIVATE KEY-----'])assert.throws(()=>assertSafeArtifact(Buffer.from(value),['known-secret']));
});
test('public scanner fails before writing a secret and bundles cannot hide symlinks',async()=>{
 const dir=await mkdtemp(resolve(tmpdir(),'academix-secret-test-'));try{const summary=assess(meta,report([key]));await assert.rejects(publishArtifacts(dir,summary,[meta.commit]));const folder=await publishArtifacts(dir,summary);const content=await readFile(resolve(folder,'index.html'));await writeFile(resolve(dir,'same-content.html'),content);await rm(resolve(folder,'index.html'));await symlink(resolve(dir,'same-content.html'),resolve(folder,'index.html'));await assert.rejects(verifyBundle(folder),/Non-file/);}finally{await rm(dir,{recursive:true,force:true});}
});
test('stack lease rejects overlapping runners and refuses cleanup by a different owner',async()=>{
 const dir=await mkdtemp(resolve(tmpdir(),'academix-lease-test-'));try{const release=await lease(dir,'first');await assert.rejects(lease(dir,'second'));await writeFile(resolve(dir,'runner.lock'),JSON.stringify({owner:'other'}));await assert.rejects(release());}finally{await rm(dir,{recursive:true,force:true});}
});
