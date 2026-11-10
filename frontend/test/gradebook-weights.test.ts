import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cents} from '../src/lib/gradebook/validation.ts';

test('group weights use exact hundredths',()=>{
 assert.equal(cents('33.33')+cents('66.67'),10000);
 for(const value of ['1.001','-1','101','NaN','1e2','',' 100','100.01'])assert.throws(()=>cents(value));
});
