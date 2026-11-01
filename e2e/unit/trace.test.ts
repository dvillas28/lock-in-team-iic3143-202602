import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {work} from '../runner/settings.ts';

test('private trace sanitizer removes credential headers, token bodies and known synthetic secrets before upload', async () => {
  const folder = await mkdtemp(join(tmpdir(),'academix-trace-test-'));
  const file = join(folder,'trace.zip');
  try {
    const fixture = `import json,zipfile,sys
with zipfile.ZipFile(sys.argv[1],'w') as z:
 z.writestr('run.network',json.dumps({'headers':[{'name':'Authorization','value':'Bearer synthetic'}],'password':'fixture-secret','accessToken':'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzeW50aGV0aWMifQ.synthetic'}))
 z.writestr('resources/body',json.dumps({'note':'fixture-secret'}))
 z.writestr('run.trace',json.dumps({'type':'after','method':'click'}))`;
    execFileSync('python3',['-c',fixture,file]);
    execFileSync('python3',[resolve(work,'runner/sanitize-trace.py'),file],{env:{...process.env,E2E_PASSWORD:'fixture-secret'}});
    execFileSync('python3',['-c',`import sys,zipfile
with zipfile.ZipFile(sys.argv[1]) as z:
 data=b'\\n'.join(z.read(n) for n in z.namelist())
 assert b'fixture-secret' not in data and b'Bearer synthetic' not in data and b'eyJ' not in data
 assert b'click' in data`,file]);
    assert.ok((await readFile(file)).length>0);
  } finally {await rm(folder,{recursive:true});}
});
