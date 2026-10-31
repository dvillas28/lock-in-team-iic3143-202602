import {createHash} from 'node:crypto';
import {caseDefinitions,assertCaseMetadata} from '../data/case-variants.ts';
import {catalogue,expectedKeys,type Suite} from './suites.ts';
export type RunMeta={runId:string;commit:string;seedVersion:string;dirtyAtStart:boolean;dirty:boolean;exitCode:number;phase:string;failure?:string;durationMs:number;startedAt:string;finishedAt:string;suite:Suite|'custom';projects:string[];environment:Record<string,unknown>;cleanup:boolean;cancelled:boolean};
export function assess(meta:RunMeta,report:any){const tests:any[]=[];const problems:string[]=[];
 function walk(s:any){for(const spec of s.specs??[])for(const t of spec.tests??[]){const id=spec.title.match(/E2E-[A-Z0-9]+-\d{3}/)?.[0],variant=spec.title.match(/ \/ (.+?) @/)?.[1];let metadataValid=true;try{assertCaseMetadata(id,variant,t.annotations??[]);}catch{metadataValid=false;problems.push('invalid-metadata');}
 const definition=caseDefinitions[id]?.find(v=>v.name===variant);if(!definition?.projects.includes(t.projectName))problems.push('undeclared-project');
 const attempts=(t.results??[]).map((r:any)=>r.status),status=t.status==='flaky'?'unstable':t.status==='expected'&&attempts.length===1&&attempts[0]==='passed'?'passed':attempts.some((s:string)=>s==='skipped')?'skipped':attempts.some((s:string)=>s==='interrupted')?'cancelled':'failed';
 const timing=(type:string)=>(t.annotations??[]).filter((a:any)=>a.type===type).map((a:any)=>type==='timing:login-ms'?JSON.parse(a.description).ms:Number(a.description));
 tests.push({key:`${id}/${variant}/${t.projectName}`,id,variant,project:t.projectName,priority:catalogue[id]?.priority,actor:definition?.actor,tenant:definition?.tenant,level:definition?.level,status,attempts,durationMs:(t.results??[]).reduce((n:number,r:any)=>n+(r.duration??0),0),setupMs:timing('timing:setup-ms'),loginMs:timing('timing:login-ms'),cleanupMs:timing('timing:cleanup-ms'),metadataValid});}
 for(const c of s.suites??[])walk(c);}
 if(report)walk(report);else problems.push('missing-report');
 const actual=tests.map(t=>t.key).sort();if(new Set(actual).size!==actual.length)problems.push('duplicate-tests');if(!tests.length)problems.push('empty-selection');
 let expected=actual;if(meta.suite!=='custom'){expected=expectedKeys(meta.suite,meta.projects);if(JSON.stringify(actual)!==JSON.stringify(expected))problems.push('incomplete-selection');}
 if(report?.errors?.length)problems.push('report-errors');if(tests.some(t=>t.status!=='passed'))problems.push('non-passing-tests');if(meta.exitCode!==0||meta.failure||!meta.cleanup||meta.cancelled)problems.push('run-failed');
 const selectionHash=createHash('sha256').update(JSON.stringify(expected)).digest('hex');const environmentHash=createHash('sha256').update(JSON.stringify(meta.environment)).digest('hex');
 const classification=meta.cancelled?'cancelled':!meta.cleanup?'cleanup':meta.failure||meta.phase!=='playwright'?'infrastructure':problems.length?'tests-or-harness':'passed';
 return {schemaVersion:1,...meta,failure:meta.failure?'See private run.json':undefined,selectionHash,environmentHash,passed:problems.length===0,classification,problems:[...new Set(problems)],tests,counts:{cases:new Set(tests.map(t=>t.id)).size,instances:tests.length,passed:tests.filter(t=>t.status==='passed').length,failed:tests.filter(t=>t.status==='failed').length,unstable:tests.filter(t=>t.status==='unstable').length,skipped:tests.filter(t=>t.status==='skipped').length,browser:tests.filter(t=>t.level==='browser').length,companion:tests.filter(t=>t.level==='companion').length}};
}
export type Summary=ReturnType<typeof assess>;
export function stabilityWindow(runs:Summary[],size=20){if(!Number.isInteger(size)||size<20)throw new Error('Stability requires at least20 runs');const window=runs.slice(-size),reasons:string[]=[];
 if(window.length<size)reasons.push('insufficient-runs');if(new Set(window.map(r=>r.runId)).size!==window.length)reasons.push('duplicate-run');
 if(window.some(r=>r.suite!=='smoke'||JSON.stringify(r.projects)!==JSON.stringify(['chromium','firefox','webkit'])))reasons.push('wrong-scope');
 if(window.some(r=>r.dirtyAtStart||r.dirty||!r.passed))reasons.push('ineligible-run');
 for(const field of ['commit','seedVersion','selectionHash','environmentHash'] as const)if(new Set(window.map(r=>r[field])).size>1)reasons.push('mixed-'+field);
 return {schemaVersion:1,required:size,observed:window.length,passed:reasons.length===0,reasons,runs:window.map(r=>r.runId),scope:'smoke/all-three-engines',fullCatalogueStability:false};
}
