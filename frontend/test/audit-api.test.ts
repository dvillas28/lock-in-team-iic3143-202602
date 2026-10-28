import {test} from 'node:test';import assert from 'node:assert/strict';
import {auditFilters,auditPageDto} from '../src/lib/audit/validation.ts';import {listCourseAuditEvents} from '../src/lib/api/audit.ts';import {createApiClient} from '../src/lib/api/client.ts';import {event,auditPage} from './fixtures/audit.ts';import {course,id} from './fixtures/courses.ts';
test('audit validates contractual filters, inclusive UTC range and context',async()=>{
 assert.equal(auditFilters({from:'2026-10-22T10:00:00-03:00'}).from,'2026-10-22T13:00:00.000Z');assert.doesNotThrow(()=>auditFilters({from:event.occurredAt,to:event.occurredAt}));
 for(const q of [{from:'bad'},{from:'2026-10-23T00:00:00Z',to:event.occurredAt},{limit:101},{action:'a'.repeat(65)},{actorUserId:'bad'},{cursor:'a'.repeat(4097)}])assert.throws(()=>auditFilters(q));
 const c=createApiClient({baseUrl:'https://api.test',fetch:async r=>{assert.equal(new URL((r as Request).url).searchParams.get('action'),'grade.published');return Response.json(auditPage);}});assert.deepEqual(await listCourseAuditEvents(c,'uc',course.id,event.institutionId,{action:'grade.published'}),auditPage);
 for(const e of [{...event,courseId:id(99)},{...event,institutionId:id(5)}])assert.throws(()=>auditPageDto({...auditPage,items:[e]},course.id,event.institutionId));
});

test('audit rejects calendar rollover and impossible local dates',()=>{
 for(const value of ['2026-02-30T12:00','2026-02-30T12:00:00Z','0000-01-01T00:00:00Z','2026-04-31T00:00:00Z']) assert.throws(()=>auditFilters({from:value}));
});
