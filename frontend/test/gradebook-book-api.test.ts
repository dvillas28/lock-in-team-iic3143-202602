import {test} from 'node:test';import assert from 'node:assert/strict';
import {createApiClient} from '../src/lib/api/client.ts';
import {getCourseGradebook,listCourseGradeItems} from '../src/lib/api/gradebook.ts';
import {book,row,historical,item,items,course,section,id} from './fixtures/gradebook.ts';
test('book preserves separate historical rows and validates pagination/relationships',async()=>{
 const data={...book,items:[row,historical],hasMore:true,nextCursor:'opaque'};
 const c=createApiClient({baseUrl:'https://api.test',fetch:async r=>{const u=new URL((r as Request).url);if(u.pathname.endsWith('/grade-items'))return Response.json(items);assert.equal(u.searchParams.get('cursor'),'cursor');return Response.json(data);}});
 assert.deepEqual(await listCourseGradeItems(c,'uc',course.id),items);
 assert.deepEqual(await getCourseGradebook(c,'uc',course.id,[item],{cursor:'cursor'}),data);
 for(const invalid of [{...data,courseId:id(11)},{...book,items:[row,row]},{...book,items:[{...row,grades:[{...row.grades[0],studentId:id(99)}]}]},{...book,hasMore:true}]){const c=createApiClient({baseUrl:'https://api.test',fetch:async()=>Response.json(invalid)});await assert.rejects(()=>getCourseGradebook(c,'uc',course.id,[item]));}
 await assert.rejects(()=>getCourseGradebook(c,'uc',course.id,[item],{limit:101}));
 const wrong=createApiClient({baseUrl:'https://api.test',fetch:async()=>Response.json({...book,items:[historical]})});await assert.rejects(()=>getCourseGradebook(wrong,'uc',course.id,[item],{sectionId:section.id}));
});
