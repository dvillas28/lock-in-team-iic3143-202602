import {randomBytes} from 'node:crypto';
import {access,cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {command,launch,stop,stopChildren,ready,safe} from './process.ts';
import {root,work,preflight,apiPort,webPort,buildEnv,reportDirectory} from './settings.ts';
import {startPostgres} from './postgres.ts';
import {selection} from './suites.ts';
import {assess,type RunMeta} from './assessment.ts';
import {publishArtifacts} from './artifacts.ts';
import {lease,assertPortsFree} from './lease.ts';
preflight();const selected=selection(process.argv.slice(2));
const startedAt=Date.now(),runId=randomBytes(8).toString('hex'),release=await lease(resolve(work,'.cache'),runId);
let pg:Awaited<ReturnType<typeof startPostgres>>|undefined,frontend:ReturnType<typeof launch>|undefined,failure:string|undefined,phase='preflight',cleanup=false,cancelled=false;
const cancel=()=>{cancelled=true;void stopChildren().catch(()=>{});};process.on('SIGINT',cancel);process.on('SIGTERM',cancel);
const checkCancellation=()=>{if(cancelled)throw new Error('Execution cancelled');};
let commit='unknown',dirtyAtStart=true;const env={E2E_RUN_ID:runId,E2E_COMMIT:'',E2E_SEED_VERSION:'academix-e2e-v1',E2E_PASSWORD:randomBytes(12).toString('hex'),E2E_RUNTIME_PASSWORD:randomBytes(12).toString('hex'),E2E_JWT_SECRET:randomBytes(32).toString('base64')};
Object.assign(process.env,env);await mkdir(reportDirectory(runId),{recursive:true});await writeFile(resolve(work,'reports/latest.json'),JSON.stringify({runId}));
console.log(`E2E run ${runId}: ${selected.suite}, runner-owned local PostgreSQL and apps`);
let environment:Record<string,unknown>={};
try{
 const require=createRequire(import.meta.url),pwPath=require.resolve('@playwright/test/package.json'),pwRequire=createRequire(pwPath),playwrightPath=pwRequire.resolve('playwright/package.json'),corePath=createRequire(playwrightPath).resolve('playwright-core/package.json');
 environment={platform:process.platform,arch:process.arch,node:process.version,playwright:JSON.parse(await readFile(pwPath,'utf8')).version,browsers:JSON.parse(await readFile(resolve(dirname(corePath),'browsers.json'),'utf8')).browsers.filter((b:any)=>['chromium','firefox','webkit'].includes(b.name))};
 commit=(await command('git',['rev-parse','HEAD'])).trim();dirtyAtStart=Boolean((await command('git',['status','--porcelain'])).trim());env.E2E_COMMIT=commit;process.env.E2E_COMMIT=commit;
 await assertPortsFree([apiPort,webPort]);checkCancellation();
 if(!process.env.PLAYWRIGHT_BROWSERS_PATH&&await access(resolve(work,'.cache/browsers')).then(()=>true,()=>false))process.env.PLAYWRIGHT_BROWSERS_PATH=resolve(work,'.cache/browsers');
 phase='postgres';pg=await startPostgres(runId);environment.postgres=pg.version;environment.ci=!!process.env.CI;checkCancellation();phase='build';
 await command('pnpm',['--dir','backend','build']);checkCancellation();await command('pnpm',['--dir','frontend','build'],{...buildEnv,E2E_PASSWORD:undefined,E2E_JWT_SECRET:undefined,E2E_RUNTIME_PASSWORD:undefined});checkCancellation();
 const {relativeAppDir}=JSON.parse(await readFile(resolve(root,'frontend/.next/required-server-files.json'),'utf8')),standalone=resolve(root,'frontend/.next/standalone',relativeAppDir);
 await cp(resolve(root,'frontend/.next/static'),resolve(standalone,'.next/static'),{recursive:true});frontend=launch(process.execPath,['server.js'],{...buildEnv,PORT:String(webPort),HOSTNAME:'127.0.0.1'},standalone);await ready(`http://127.0.0.1:${webPort}`,frontend.child);checkCancellation();phase='playwright';
 const tests=launch(resolve(work,'node_modules/.bin/playwright'),['test',...selected.args],{...env,E2E_PG_PORT:String(pg.port),E2E_PG_FOLDER:pg.folder,E2E_WEB_PORT:String(webPort),E2E_API_PORT:String(apiPort)},work);
 tests.child.stdout?.on('data',chunk=>process.stdout.write(safe(String(chunk))));tests.child.stderr?.on('data',chunk=>process.stderr.write(safe(String(chunk))));process.exitCode=(await tests.finished)??1;
}catch(error){failure=safe(error instanceof Error?error.message:String(error));process.exitCode=1;console.error(failure);}
finally{
 try{if(frontend)await stop(frontend.child);if(pg)await pg.close();await assertPortsFree([apiPort,webPort]);cleanup=true;}catch(error){failure=safe(error instanceof Error?error.message:String(error));process.exitCode=1;console.error('E2E cleanup failed: '+failure);}
 try{
  const meta:RunMeta={runId,commit,seedVersion:env.E2E_SEED_VERSION,dirtyAtStart,dirty:Boolean((await command('git',['status','--porcelain'])).trim()),startedAt:new Date(startedAt).toISOString(),finishedAt:new Date().toISOString(),durationMs:Date.now()-startedAt,exitCode:Number(process.exitCode??0),phase,failure,suite:selected.suite,projects:selected.projects,environment,cleanup,cancelled};
  let report;try{report=JSON.parse(await readFile(resolve(reportDirectory(runId),'results.json'),'utf8'));}catch{/* Missing report is an explicit failed gate. */}
  let summary=assess(meta,report);if(!summary.passed){process.exitCode=1;meta.exitCode=1;summary=assess(meta,report);}await writeFile(resolve(reportDirectory(runId),'run.json'),JSON.stringify(meta,null,2));
  try{await publishArtifacts(reportDirectory(runId),summary,[env.E2E_PASSWORD,env.E2E_JWT_SECRET,env.E2E_RUNTIME_PASSWORD]);console.log(`E2E gate: ${summary.passed?'PASS':'FAIL'}; ${summary.counts.passed}/${summary.counts.instances}; ${summary.classification}`);}catch{process.exitCode=1;meta.exitCode=1;meta.failure='Public artifact scanner/publication failed';await writeFile(resolve(reportDirectory(runId),'run.json'),JSON.stringify(meta,null,2));console.error(meta.failure);}
 }finally{process.removeListener('SIGINT',cancel);process.removeListener('SIGTERM',cancel);await release();}
}
