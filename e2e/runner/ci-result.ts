import {readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {verifyBundle} from './artifacts.ts';
import {expectedKeys,type Suite} from './suites.ts';
import type {Summary} from './assessment.ts';
import {eventSelection} from './ci-policy.ts';
export function aggregate(summaries:Summary[],suite:Suite,projects:string[],commit:string){const problems:string[]=[];
 if(!['smoke','regression','extended'].includes(suite)||!projects.length||new Set(projects).size!==projects.length)throw new Error('Invalid aggregate selection');
 const keys:string[]=[];for(const summary of summaries){if(!summary.passed||(summary.endCommit!==undefined&&summary.endCommit!==summary.commit)||summary.tests.some(t=>t.status!=='passed')||summary.dirty||summary.dirtyAtStart||summary.commit!==commit||summary.suite!==suite||summary.projects.length!==1||!projects.includes(summary.projects[0]))problems.push('failed-or-inconsistent-job');keys.push(...summary.tests.map(t=>t.key));}
 for(const field of ['seedVersion','environmentHash'] as const)if(new Set(summaries.map(s=>s[field])).size>1)problems.push('mixed-'+field);
 if(summaries.length!==projects.length||new Set(summaries.map(s=>s.projects[0])).size!==projects.length)problems.push('missing-or-duplicate-job');
 if(new Set(keys).size!==keys.length||JSON.stringify(keys.sort())!==JSON.stringify(expectedKeys(suite,projects)))problems.push('incomplete-variants');
 return {passed:problems.length===0,problems,commit,suite,projects,instances:keys.length};
}
if(process.argv[1]?.endsWith('ci-result.ts')){
 const args=process.argv.slice(2),byEvent=args[0]==='--event';
 const selected=byEvent?eventSelection(process.env.GITHUB_EVENT_NAME??'',process.env.DISPATCH_SUITE||'smoke'):{suite:args[0],projects:args[1]?.split(',')};
 const commit=args[byEvent?1:2],folder=args[byEvent?2:3];
 if(!folder||!commit||!selected.projects)throw new Error('Expected --event commit folder, or suite projects commit folder');
 const reports:Summary[]=[];
 for(const dir of await readdir(folder,{withFileTypes:true}))if(dir.isDirectory())reports.push(await verifyBundle(resolve(folder,dir.name)));
 const result=aggregate(reports,selected.suite as Suite,selected.projects,commit);console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;
}
