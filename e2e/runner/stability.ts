import {randomBytes} from 'node:crypto';
import {appendFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {work,reportDirectory,preflight} from './settings.ts';
import {launch,command,safe,stop} from './process.ts';
import {verifyBundle} from './artifacts.ts';
import {stabilityWindow,type Summary} from './assessment.ts';
preflight();if(process.argv.length>2)throw new Error('This command measures exactly20 smoke rounds on all three engines');if((await command('git',['status','--porcelain'])).trim())throw new Error('Stability requires a clean committed checkout');
const folder=resolve(work,'reports/windows',randomBytes(8).toString('hex'));await mkdir(folder,{recursive:true});const reports:Summary[]=[];let cancelled=false;let child:ReturnType<typeof launch>|undefined;
const cancel=()=>{cancelled=true;if(child)void stop(child.child,'SIGINT',25000);};process.on('SIGINT',cancel);process.on('SIGTERM',cancel);
console.log(`Stability window: ${folder}`);
try{for(let i=1;i<=20;i++){
 console.log(`Smoke round ${i}/20 started`);child=launch(process.execPath,['--import','tsx',resolve(work,'runner/run.ts'),'--suite=smoke','--project=chromium','--project=firefox','--project=webkit'],{},work);let runId:string|undefined;
 const record=(chunk:Buffer)=>{const text=safe(String(chunk));runId??=text.match(/^E2E run ([a-f0-9]{16}):/m)?.[1];void appendFile(resolve(folder,`round-${i}.log`),text);};child.child.stdout?.on('data',record);child.child.stderr?.on('data',record);const code=await child.finished;
 if(!runId)throw new Error('Round did not produce an owned run');const summary=await verifyBundle(resolve(reportDirectory(runId),'public'));reports.push(summary);const result=stabilityWindow(reports);await writeFile(resolve(folder,'window.json'),JSON.stringify({...result,commit:summary.commit,rounds:reports.map(r=>({runId:r.runId,passed:r.passed,durationMs:r.durationMs,counts:r.counts}))},null,2));
 console.log(`Smoke round ${i}/20: ${summary.passed?'PASS':'FAIL'} ${summary.counts.passed}/${summary.counts.instances}, ${Math.round(summary.durationMs/1000)}s; run ${runId}`);
 if(cancelled||code!==0||!summary.passed||summary.dirty||summary.dirtyAtStart)throw new Error('Window stopped; retain this failed/ineligible round and diagnose before starting a new window');
 }const result=stabilityWindow(reports);if(!result.passed)throw new Error('Twenty-round window is not eligible: '+result.reasons.join(','));console.log('Stability PASS:20 comparable smoke rounds; full-catalogue stability and remote CI remain separate');
}catch(error){process.exitCode=1;await writeFile(resolve(folder,'failure.json'),JSON.stringify({cancelled,completed:reports.length,message:safe(error instanceof Error?error.message:String(error))},null,2));console.error(error instanceof Error?error.message:String(error));}finally{process.removeListener('SIGINT',cancel);process.removeListener('SIGTERM',cancel);}
