import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {work,reportDirectory} from './settings.ts';
import {verifyBundle} from './artifacts.ts';
import {stabilityWindow,type Summary} from './assessment.ts';

// Nearest-rank percentiles; run wall time and individual test durations are separate.
export function statistics(values:number[]){
 if(!values.length)return {samples:0,p50Ms:null,p95Ms:null,maxMs:null};
 const sorted=[...values].sort((a,b)=>a-b);
 return {samples:sorted.length,p50Ms:sorted[Math.ceil(sorted.length*.5)-1],p95Ms:sorted[Math.ceil(sorted.length*.95)-1],maxMs:sorted.at(-1)!};
}
type Test=Summary['tests'][number];
function group(tests:Test[]){
 return {instances:tests.length,test:statistics(tests.map(t=>t.durationMs)),
  setup:statistics(tests.flatMap(t=>t.setupMs)),login:statistics(tests.flatMap(t=>t.loginMs)),cleanup:statistics(tests.flatMap(t=>t.cleanupMs)),
  firstAttemptPassPercent:tests.length?100*tests.filter(t=>t.attempts[0]==='passed').length/tests.length:null,
  unstable:tests.filter(t=>t.status==='unstable').length,skipped:tests.filter(t=>t.status==='skipped').length};
}
export function metrics(reports:Summary[]){
 const tests=reports.flatMap(r=>r.tests);
 return {runs:reports.length,run:statistics(reports.map(r=>r.durationMs)),tests:group(tests),
  byProject:Object.fromEntries(['chromium','firefox','webkit'].map(project=>[project,group(tests.filter(t=>t.project===project))])),
  byLevel:Object.fromEntries(['browser','companion'].map(level=>[level,group(tests.filter(t=>t.level===level))])),
  byPriority:Object.fromEntries(['P0','P1','P2','P3'].map(priority=>[priority,group(tests.filter(t=>t.priority===priority))])),
  slowest:tests.toSorted((a,b)=>b.durationMs-a.durationMs).slice(0,10).map(t=>({key:t.key,durationMs:t.durationMs}))};
}
if(process.argv[1]?.endsWith('metrics.ts')){
 const input=process.argv[2];if(!input)throw new Error('Pass a window.json path or 16-hex runId');
 const reports:Summary[]=[];let window;
 if(/^[a-f0-9]{16}$/.test(input))reports.push(await verifyBundle(resolve(reportDirectory(input),'public')));
 else{
  const source=JSON.parse(await readFile(resolve(work,input),'utf8'));
  if(!Array.isArray(source.runs))throw new Error('Not a stability window');
  for(const id of source.runs){if(typeof id!=='string'||!/^[a-f0-9]{16}$/.test(id))throw new Error('Invalid runId');reports.push(await verifyBundle(resolve(reportDirectory(id),'public')));}
  window=stabilityWindow(reports);
 }
 const result={window,metrics:metrics(reports)};
 if(window&&!window.passed)process.exitCode=1;
 if(process.argv[3])await writeFile(resolve(work,process.argv[3]),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
}
