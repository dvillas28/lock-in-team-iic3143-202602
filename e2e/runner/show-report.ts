import {readFile, access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {work, reportDirectory} from './settings.ts';
import {launch} from './process.ts';
const latest=JSON.parse(await readFile(resolve(work,'reports/latest.json'),'utf8'));
const html=resolve(reportDirectory(latest.runId),'html');
try {await access(resolve(html,'index.html'));}
catch {throw new Error('No HTML report: this run did not reach Playwright. Inspect its run.json infrastructure failure.');}
const viewer=launch(resolve(work,'node_modules/.bin/playwright'),['show-report',html,...process.argv.slice(2)],{},work);
viewer.child.stdout?.pipe(process.stdout); viewer.child.stderr?.pipe(process.stderr);
process.exitCode=(await viewer.finished)??1;
