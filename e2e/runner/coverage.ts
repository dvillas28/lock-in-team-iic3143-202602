import {readdir, readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {root, work, reportDirectory} from './settings.ts';

const directory=resolve(root,'docs/testing/catalog');
const catalogue = new Map<string,{name:string;module:string;level:string;file:string}>();
for (const file of (await readdir(directory)).filter(f=>/^[a-z0-9]+-\d+\.md$/.test(f))) {
  const source=await readFile(resolve(directory,file),'utf8');
  for (const match of source.matchAll(/^## (E2E-([A-Z0-9]+)-\d{3}) — (.+)$/gm)) {
    if(catalogue.has(match[1]))throw new Error('Duplicate catalogue ID');
    const start=source.indexOf(match[0]), next=source.indexOf('\n## E2E-',start+1);
    const card=source.slice(start,next<0?undefined:next);
    catalogue.set(match[1],{name:match[3],module:match[2],level:card.includes('Nivel / suite: E2E navegador')?'browser':'companion',file});
  }
}
const definitions = new Map<string,string[]>();
for (const file of (await readdir(resolve(work,'specs'))).filter(f=>f.endsWith('.spec.ts'))) {
  const source=await readFile(resolve(work,'specs',file),'utf8');
  for (const match of source.matchAll(/E2E-[A-Z0-9]+-\d{3}/g)) {
    if(!catalogue.has(match[0]))throw new Error('Test references unknown catalogue ID');
    definitions.set(match[0],[...new Set([...(definitions.get(match[0])??[]),file])]);
  }
}
const observed = new Map<string,string[]>();
let reports=reportDirectory();
try {
  const latest=JSON.parse(await readFile(resolve(work,'reports/latest.json'),'utf8'));
  reports=reportDirectory(latest.runId);
  const report=JSON.parse(await readFile(resolve(reports,'results.json'),'utf8'));
  const walk=(suite:any)=>{
    for(const spec of suite.specs??[]) {
      const id=spec.title.match(/E2E-[A-Z0-9]+-\d{3}/)?.[0]; if(!id)continue;
      for(const test of spec.tests??[]) {
        // Collection (--list) and skipped tests are not executions or passes.
        const ran=(test.results??[]).some((r:any)=>['passed','failed','timedOut','interrupted'].includes(r.status));
        if(ran)observed.set(id,[...(observed.get(id)??[]),test.status]);
      }
    }
    for(const child of suite.suites??[])walk(child);
  };
  for(const suite of report.suites??[])walk(suite);
}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
const rows=[...catalogue].map(([id,item])=>({id,...item,files:definitions.get(id)??[],results:observed.get(id)??[],
  state:observed.has(id)?observed.get(id)!.every(v=>v==='expected')?'executed-passed':'executed-failed':definitions.has(id)?'implemented-environment-blocked':'pending-implementation'}));
await mkdir(reports,{recursive:true});
await writeFile(resolve(reports,'coverage.json'),JSON.stringify({catalogue:rows.length,defined:definitions.size,executed:observed.size,rows},null,2));
console.log(JSON.stringify({catalogue:rows.length,defined:definitions.size,executed:observed.size,passed:rows.filter(r=>r.state==='executed-passed').length,pending:rows.filter(r=>r.state==='pending-implementation').length}));
