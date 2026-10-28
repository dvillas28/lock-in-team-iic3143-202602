import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {weightsInput,publicationInput,publicationKey} from '../dist/gradebook/gradebook-validation.js';
test('strict decimal weights, complete shape, unique normalized identifiers',()=>{
 const id=randomUUID();
 assert.deepEqual(weightsInput({items:[{gradeItemId:id,weightPercent:33.33}]}),[{gradeItemId:id,weightPercent:33.33}]);
 for(const value of [-1,100.01,0.001,'100',null,NaN,Infinity])assert.throws(()=>weightsInput({items:[{gradeItemId:id,weightPercent:value}]}));
 for(const items of [[],[{gradeItemId:id,weightPercent:50},{gradeItemId:id.toUpperCase(),weightPercent:50}]])assert.throws(()=>weightsInput({items}));
 assert.throws(()=>weightsInput({items:[{gradeItemId:id,weightPercent:100,extra:true}]}));
});
test('explicit selection canonicalizes every list and validates header',()=>{
 const a=randomUUID(),b=randomUUID();const input={gradeItemIds:[b,a],sectionIds:[a],studentIds:[b]};
 assert.deepEqual(publicationInput(input).gradeItemIds,[a,b].sort());
 for(const body of [{...input,studentIds:undefined},{...input,studentIds:[]},{...input,studentIds:[a,a.toUpperCase()]},{...input,extra:true}])assert.throws(()=>publicationInput(body));
 for(const headers of [[],['Idempotency-Key',''],['Idempotency-Key',' padded '],['Idempotency-Key','x'.repeat(201)],['Idempotency-Key','a','idempotency-key','a']])assert.throws(()=>publicationKey(headers));
 assert.equal(publicationKey(['Idempotency-Key','abc']),'abc');
});
