import {readdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root} from './settings.ts';
import {caseDefinitions} from '../data/case-variants.ts';
export type Suite='smoke'|'regression'|'extended';
export const engines=['chromium','firefox','webkit'] as const;
export const catalogue:Record<string,{priority:string;suite:Suite}>={};
for(const file of readdirSync(resolve(root,'docs/testing/catalog')).filter(f=>/^[A-Z0-9]+\.md$/.test(f)))for(const line of readFileSync(resolve(root,'docs/testing/catalog',file),'utf8').split('\n')){
 const cols=line.split('|').map(s=>s.trim()),id=cols[1]?.match(/^\[(E2E-[A-Z0-9]+-\d{3}) /)?.[1];if(!id)continue;
 if(catalogue[id]||!/^P[0-3]$/.test(cols[3])||!['smoke','regression','extended'].includes(cols[4]))throw new Error('Invalid or duplicate catalogue row');
 catalogue[id]={priority:cols[3],suite:cols[4] as Suite};
}
if(Object.keys(catalogue).length!==248||Object.keys(caseDefinitions).some(id=>!catalogue[id]))throw new Error('Catalogue/manifest mismatch');
export function suiteIds(suite:Suite){return Object.keys(catalogue).filter(id=>suite==='extended'||catalogue[id].suite==='smoke'||suite==='regression'&&catalogue[id].suite==='regression');}
export function expectedKeys(suite:Suite,projects:readonly string[]){return suiteIds(suite).flatMap(id=>caseDefinitions[id].flatMap(v=>v.projects.filter(p=>projects.includes(p)).map(p=>`${id}/${v.name}/${p}`))).sort();}
export function selection(input:string[]){const args=[...input],named=args.find(a=>a.startsWith('--suite='));let suite:Suite|'custom'='custom';
 if(named){suite=named.slice(8) as Suite;if(!['smoke','regression','extended'].includes(suite))throw new Error('Unknown suite');args.splice(args.indexOf(named),1);if(args.some(a=>/^--?(grep|g$|G$|shard|test-list|repeat-each)|\.spec\./.test(a)))throw new Error('Named suites cannot be filtered; use test for a custom selection');args.push('--grep',`(?:${suiteIds(suite).join('|')})`);}
 const projects=args.flatMap((a,i)=>a.startsWith('--project=')?[a.slice(10)]:a==='--project'?[args[i+1]]:[]);if(!projects.length&&!args.includes('--ui')){projects.push('chromium');args.push('--project=chromium');}
 if(suite!=='custom'&&projects.some(p=>!engines.includes(p as typeof engines[number])))throw new Error('Named suites require declared engines');
 if(suite!=='custom')args.push('--global-timeout='+({smoke:20,regression:35,extended:75}[suite]*60000));
 return {suite,projects:[...new Set(projects)].sort(),args};
}
