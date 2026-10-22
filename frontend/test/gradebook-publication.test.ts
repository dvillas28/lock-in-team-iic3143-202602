import {test} from 'node:test';import assert from 'node:assert/strict';
import {selection,rectangle} from '../src/lib/gradebook/validation.ts';import {PublicationOperation} from '../src/lib/gradebook/publication.ts';
import {item,row,section,id,receipt,deferred} from './fixtures/gradebook.ts';
import {getRouteFeedback} from '../src/lib/route-feedback.ts';import {ApiHttpError} from '../src/lib/api/errors.ts';
test('feedback distinguishes invalid request, conflict, validation and unavailable without detail',()=>{
 const messages=[400,409,422,503].map(status=>getRouteFeedback(new ApiHttpError(status,{detail:'PRIVATE_DETAIL'})).message);assert.equal(new Set(messages).size,4);assert.equal(messages.some(m=>m.includes('PRIVATE_DETAIL')),false);
 assert.match(getRouteFeedback(new ApiHttpError(409,{code:'IDEMPOTENCY_CONFLICT'})).message,/clave/);
 assert.doesNotMatch(getRouteFeedback(new ApiHttpError(409,{code:'toString'})).message,/function|native code/);
});
export const selected={gradeItemIds:[item.id],sectionIds:[section.id],studentIds:[row.student.id]};
test('publication requires complete explicit rectangular selection and canonical unique UUIDs',()=>{
 assert.deepEqual(rectangle(selected,[row]),selected);assert.throws(()=>rectangle({...selected,studentIds:[id(99)]},[row]));assert.throws(()=>rectangle(selected,[{...row,grades:[{...row.grades[0],publishedAt:receipt.publishedAt}]}]));assert.throws(()=>selection({...selected,studentIds:[]}));assert.throws(()=>selection({...selected,studentIds:[row.student.id,row.student.id.toUpperCase()]}));
 const upper={...selected,studentIds:['AAAAAAAA-0000-4000-8000-000000000001']};assert.equal(selection(upper).studentIds[0],upper.studentIds[0].toLowerCase());
 assert.throws(()=>selection({...selected,studentIds:Array.from({length:200},(_,n)=>id(n+1000))}));
});
test('double click shares one immutable operation and exact key/body replay',async()=>{
 const op=new PublicationOperation('scope',selected,'key'),slow=deferred<typeof receipt>();let count=0;
 const send=async(body:typeof selected,key:string)=>{count++;assert.deepEqual(body,selected);assert.equal(key,'key');return slow.promise;};
 const a=op.send('scope',send),b=op.send('scope',send);assert.equal(count,1);slow.resolve(receipt);await Promise.all([a,b]);assert.equal(op.state,'confirmed');assert.deepEqual(op.receipt,receipt);await op.send('scope',send);assert.equal(count,1);
});
