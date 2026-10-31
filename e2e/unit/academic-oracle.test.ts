import {test} from 'node:test';
import assert from 'node:assert/strict';
import {oracle} from '../helpers/academic.ts';
test('independent decimal oracle covers rounding boundaries and full credit',()=>{
 for(const [points,correct,percent,grade] of [[[6,4],[true,false],60,4],[[1,2],[true,false],33.33,2.7],[[35,65],[true,false],35,2.8],[[119.99,80.01],[true,false],60,4],[[0.01,0.01],[false,true],50,3.5],[[6,4],[true,true],100,7],[[6,4],[],0,1]] as [number[],boolean[],number,number][])assert.deepEqual(oracle(points,correct),{scorePercent:percent,grade});
});
