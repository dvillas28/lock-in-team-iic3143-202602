import {test} from 'node:test';
import assert from 'node:assert/strict';
import {statistics,metrics} from '../runner/metrics.ts';
import type {Summary} from '../runner/assessment.ts';
test('nearest-rank percentiles retain wall time separately and exclude missing fixture observations',()=>{
 assert.deepEqual(statistics([]),{samples:0,p50Ms:null,p95Ms:null,maxMs:null});
 const values=Array.from({length:20},(_,i)=>20-i);
 assert.deepEqual(statistics(values),{samples:20,p50Ms:10,p95Ms:19,maxMs:20});
 assert.equal(values[0],20);
 const rows=[{key:'a',project:'chromium',priority:'P0',level:'browser',durationMs:10,setupMs:[2],loginMs:[],cleanupMs:[1],attempts:['failed','passed'],status:'unstable'},{key:'b',project:'firefox',priority:'P1',level:'companion',durationMs:30,setupMs:[],loginMs:[4],cleanupMs:[],attempts:['passed'],status:'passed'}];
 const report={durationMs:100,tests:rows} as Summary;const result=metrics([report]);
 assert.equal(result.run.p50Ms,100);assert.equal(result.tests.test.maxMs,30);assert.equal(result.tests.firstAttemptPassPercent,50);
 assert.equal(result.tests.setup.samples,1);assert.equal(result.tests.unstable,1);assert.equal(result.byProject.webkit.firstAttemptPassPercent,null);
 assert.equal(result.byLevel.companion.instances,1);assert.equal(result.byPriority.P0.firstAttemptPassPercent,0);assert.equal(result.slowest[0].key,'b');
 assert.equal(rows[0].key,'a');
});
