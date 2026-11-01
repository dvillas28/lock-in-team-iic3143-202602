import {execFileSync} from 'node:child_process';
import {appendFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export function eventSelection(event:string,dispatchSuite='smoke'){
 const projects=event==='pull_request'||event==='push'?['chromium']:['chromium','firefox','webkit'];
 const suite=event==='pull_request'?'smoke':event==='push'?'regression':event==='schedule'?'extended':event==='workflow_dispatch'?dispatchSuite:undefined;
 if(!suite||!['smoke','regression','extended'].includes(suite))throw new Error('Unsupported CI selection');
 return {suite,projects};
}
export function classifyChanges(files:string[]){
 if(!files.length)return {required:true,reason:'empty-diff',files:0};
 const documentation=(file:string)=>{
  // These Markdown files are executable selection input, not narrative documentation.
  if(file.startsWith('docs/testing/catalog/'))return false;
  if(/(^|\/)(?:package(?:-lock)?\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|yarn\.lock|bun\.lockb?)$/.test(file))return false;
  if(/(^|\/)README(?:\.(?:md|mdx|rst|txt))?$/i.test(file))return true;
  if(/^(docs|specs)\//.test(file))return /\.(?:md|mdx|rst|txt|pdf|png|jpe?g|gif|svg|webp|drawio|csv|json|ya?ml)$/i.test(file);
  if(file.startsWith('mockups/'))return /\.(?:md|html?|css|js|mjs|json|svg|png|jpe?g|gif|webp|woff2?)$/i.test(file);
  return !file.includes('/')&&/\.md$/i.test(file);
 };
 return {required:!files.every(documentation),reason:files.every(documentation)?'documentation-only':'code-runtime-or-unknown',files:files.length};
}
export function changedFiles(event:string,payload:any,cwd=process.cwd()){
 const base=event==='pull_request'?payload.pull_request?.base?.sha:payload.before;
 const head=event==='pull_request'?payload.pull_request?.head?.sha:payload.after;
 if(![base,head].every(sha=>typeof sha==='string'&&/^[a-f0-9]{40}$/.test(sha)&&!/^0+$/.test(sha)))throw new Error('Missing comparison commits');
 const range=event==='pull_request'?[`${base}...${head}`]:[base,head];
 const output=execFileSync('git',['diff','--name-only','--no-renames','-z',...range,'--'],{cwd,encoding:'utf8',maxBuffer:16*1024*1024,stdio:['ignore','pipe','pipe']});
 return output.split('\0').filter(Boolean);
}
export function detectChanges(event:string,load:()=>any,cwd=process.cwd()){
 if(!['pull_request','push'].includes(event))return {required:true,reason:'scheduled-or-manual',files:0};
 try{return classifyChanges(changedFiles(event,load(),cwd));}
 catch{return {required:true,reason:'detection-failed',files:0};}
}
type Job={result?:string;outputs?:Record<string,string>};
export function resultDecision(event:string,changes:Job,playwright:Job){
 const skipped=changes.result==='success'&&changes.outputs?.required==='false'&&changes.outputs?.reason==='documentation-only'&&['pull_request','push'].includes(event);
 if(skipped){
  if(playwright.result!=='skipped')throw new Error('Documentation decision does not match test job');
  return {skip:true,reason:'documentation-only: confirmed diff; Playwright not required'};
 }
 if(playwright.result!=='success')throw new Error('Required Playwright job failed, cancelled, skipped or absent');
 return {skip:false,reason:changes.outputs?.reason==='detection-failed'||changes.result!=='success'?'Detection failed; E2E executed conservatively':'E2E required and executed'};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const [mode,...args]=process.argv.slice(2);let outputs:Record<string,string>;
 if(mode==='detect'){
  const result=detectChanges(process.env.GITHUB_EVENT_NAME??'',()=>JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH!,'utf8')));
  outputs={required:String(result.required),reason:result.reason,files:String(result.files)};
 }else if(mode==='gate'){
  const needs=JSON.parse(process.env.NEEDS_JSON??'{}');
  const result=resultDecision(process.env.GITHUB_EVENT_NAME??'',needs.changes??{},needs.playwright??{});
  outputs={skip:String(result.skip),reason:result.reason};
 }else if(mode==='selection'){
  const selection=eventSelection(process.env.GITHUB_EVENT_NAME??'',process.env.DISPATCH_SUITE||'smoke');
  outputs={suite:selection.suite,projects:selection.projects.join(',')};
 }else throw new Error('Expected detect, gate or selection');
 if(args.length)throw new Error('Unexpected arguments');
 for(const [key,value] of Object.entries(outputs))if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,`${key}=${value}\n`);
 console.log(JSON.stringify(outputs));
 if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,`E2E policy: ${outputs.reason??outputs.suite}\n`);
}
