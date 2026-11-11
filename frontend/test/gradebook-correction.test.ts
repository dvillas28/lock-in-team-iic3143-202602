import {test} from 'node:test';
import assert from 'node:assert/strict';
import {correctionPreview} from '../src/lib/gradebook/validation.ts';

test('correction preview mirrors the Chilean scale and both half-up rounding steps',()=>{
 assert.deepEqual(correctionPreview('0,9',1),{points:0.9,percent:90,grade:6.3});
 assert.deepEqual(correctionPreview('0',1),{points:0,percent:0,grade:1});
 assert.deepEqual(correctionPreview('0.6',1),{points:0.6,percent:60,grade:4});
 assert.deepEqual(correctionPreview('1',1),{points:1,percent:100,grade:7});
 assert.deepEqual(correctionPreview('1',3),{points:1,percent:33.33,grade:2.7});
 assert.deepEqual(correctionPreview('119,99',200),{points:119.99,percent:60,grade:4});
 assert.deepEqual(correctionPreview('0.35',1),{points:0.35,percent:35,grade:2.8});
 for(const value of ['', '0,999','90%','6,3','-0.1','1e0','Infinity'])assert.equal(correctionPreview(value,1),null);
});
