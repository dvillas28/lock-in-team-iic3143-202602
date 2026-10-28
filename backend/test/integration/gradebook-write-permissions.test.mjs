import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {database,http} from './helpers.mjs';
import {gradebookFixture,request,tokens,users,selection,coursePath,snapshot} from './gradebook-fixtures.mjs';

test('writes revalidate tenant, teacher plus owner, historical sections and revoked recipients',async()=>{
 const pool=await database();let app;try{
 const f=await gradebookFixture(pool);app=await http();const t=await tokens(app,f),path=coursePath(f),body=selection(f),before=await snapshot(pool);
 for(const token of [t.student,t.assistant,t.admin])assert.ok([403,404].includes((await request(app,token,path+'/gradebook/publications','POST',body,randomUUID())).status));
 const weights={items:[{gradeItemId:f.items.section,weightPercent:40},{gradeItemId:f.items.global,weightPercent:30},{gradeItemId:f.items.second,weightPercent:30}]};
 assert.equal((await request(app,t.teacher,path+'/gradebook/weights','PUT',weights)).status,403);
 assert.equal((await request(app,t.owner,`utfsm/courses/${f.own}/gradebook/publications`,'POST',body,'cross')).status,404);
 assert.equal((await request(app,t.teacher,path+'/gradebook/publications','POST',{...body,sectionIds:[f.s4]},'foreign')).status,404);
 assert.deepEqual(await snapshot(pool),before);
 await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND section_id=$2 AND role='teacher'",[users.other,f.s1]);
 assert.equal((await request(app,t.teacher,path+'/gradebook/publications','POST',body,'scope')).status,404);
 await pool.query('UPDATE institution_memberships SET active=false WHERE institution_id=$1 AND user_id=$2',[f.tenants.uc,users.revoked]);
 assert.equal((await request(app,t.owner,path+'/gradebook/publications','POST',body,'revoked-recipient')).status,200);
 const mixed=await request(app,t.teacher,path+'/gradebook');assert.equal(mixed.status,200);assert.equal(mixed.body.items.length,2);
 assert.equal((await request(app,t.teacher,path+'/gradebook/publications','POST',{gradeItemIds:[f.items.second],sectionIds:[f.s2],studentIds:[users.revoked]},'mixed-teacher')).status,200);
 }finally{if(app)await app.close();await pool.end();}
});
