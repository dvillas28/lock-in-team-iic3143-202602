import {readFile,rm,mkdir,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
import {work,reportDirectory} from './settings.ts';
import {verifyBundle} from './artifacts.ts';
const {runId}=JSON.parse(await readFile(resolve(work,'reports/latest.json'),'utf8')),source=resolve(reportDirectory(runId),'public');const target=resolve(work,'.cache/ci-public');await rm(target,{recursive:true,force:true});await verifyBundle(source);await mkdir(target,{recursive:true});await cp(source,target,{recursive:true});await verifyBundle(target);
