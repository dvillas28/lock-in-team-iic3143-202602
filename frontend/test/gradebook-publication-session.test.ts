import {test} from 'node:test';import assert from 'node:assert/strict';
import {PublicationOperation} from '../src/lib/gradebook/publication.ts';import {ApiHttpError,ApiResponseError,ApiNetworkError} from '../src/lib/api/errors.ts';import {item,row,section,receipt,deferred} from './fixtures/gradebook.ts';
const selected={gradeItemIds:[item.id],sectionIds:[section.id],studentIds:[row.student.id]};
test('uncertain network/invalid/5xx outcomes replay exact request, 409 never rotates key',async()=>{
 for(const e of [new ApiNetworkError(null),new ApiResponseError(),new ApiHttpError(503),new ApiHttpError(409,{code:'IDEMPOTENCY_CONFLICT'})]){
  const op=new PublicationOperation('uc:actor',selected,'stable');await op.send('uc:actor',async()=>{throw e;});assert.equal(op.state,e instanceof ApiHttpError&&e.status===409?'rejected':'uncertain');
  await assert.rejects(()=>op.send('utfsm:actor',async()=>receipt));assert.equal(op.key,'stable');await op.send('uc:actor',async(body,key)=>{assert.deepEqual(body,selected);assert.equal(key,'stable');return receipt;});assert.equal(op.state,'confirmed');
 }
});
test('dispose drops private request/key and late receipt; fresh reload never posts',async()=>{
 const op=new PublicationOperation('scope',selected,'key'),slow=deferred<typeof receipt>();const p=op.send('scope',async()=>slow.promise);op.dispose();slow.resolve(receipt);await p;assert.equal(op.receipt,undefined);assert.equal(op.key,undefined);assert.equal(op.input,undefined);assert.equal(op.state,'disposed');
});
