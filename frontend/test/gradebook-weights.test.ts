import {test} from 'node:test';import assert from 'node:assert/strict';
import {weightsInput,cents} from '../src/lib/gradebook/validation.ts';import {readFreeze} from '../src/lib/api/gradebook.ts';import {createApiClient} from '../src/lib/api/client.ts';import {item,book,frozen,course,id} from './fixtures/gradebook.ts';
test('weights use exact hundredths, full collection, unique ids, no rounding',()=>{
 const second={...item,id:id(71)};
 assert.deepEqual(weightsInput([{gradeItemId:item.id,weightPercent:'33.33'},{gradeItemId:second.id,weightPercent:'66.67'}],[item,second]).items.map(i=>i.weightPercent),[33.33,66.67]);
 for(const text of ['1.001','-1','101','NaN','1e2','',' 100','100.01'])assert.throws(()=>cents(text));
 for(const values of [[],[{gradeItemId:item.id,weightPercent:'99.99'}],[{gradeItemId:item.id,weightPercent:'50'},{gradeItemId:item.id,weightPercent:'50'}]])assert.throws(()=>weightsInput(values,[item]));
});
test('freeze scans unfiltered global pages; later publication and failed scan block',async()=>{
 let count=0;const c=createApiClient({baseUrl:'https://api.test',fetch:async r=>{assert.equal(new URL((r as Request).url).searchParams.has('sectionId'),false);return Response.json(++count===1?{...book,hasMore:true,nextCursor:'next'}:frozen);}});
 assert.equal(await readFreeze(c,'uc',course.id,[item]),'locked');assert.equal(count,2);
 const empty=createApiClient({baseUrl:'https://api.test',fetch:async()=>Response.json({...book,items:[]})});assert.equal(await readFreeze(empty,'uc',course.id,[item]),'unlocked');
 const fail=createApiClient({baseUrl:'https://api.test',fetch:async()=>Response.json({}, {status:503})});await assert.rejects(()=>readFreeze(fail,'uc',course.id,[item]));
});
