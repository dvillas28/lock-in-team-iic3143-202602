import assert from 'node:assert/strict';
import {test} from 'node:test';
import {database,http,login} from './helpers.mjs';
import {coursesFixture,users,request} from './course-fixtures.mjs';
import {createApiClient} from '../../../frontend/src/lib/api/client.ts';

test('institutional participant search: runtime HTTP, literal text, pagination, roles and revocation', async () => {
 const pool = await database(); let app;
 try {
  const f = await coursesFixture(pool); app = await http();
  const owner = await login(app,f.env), assistant = await login(app,f.env,'UC');
  const search = (query, token=owner, tenant='uc') => request(app,token,`${tenant}/users?${query}`);
  const client = createApiClient({baseUrl:app.base,getToken:()=>owner});
  const response = await client.GET('/api/v1/institution/{institutionSlug}/users', {params:{path:{institutionSlug:'uc'},query:{search:'DEMO',limit:1}}});
  assert.equal(response.response.status,200); assert.equal(response.response.headers.get('cache-control'),'no-store');
  assert.equal(response.data.items.length,1); assert.equal(response.data.hasMore,true);
  assert.deepEqual(Object.keys(response.data.items[0]).sort(),['active','email','id','name']);
  assert.ok(!response.data.items.some(u=>u.id===users.foreign||u.id===users.revoked||u.id===users.inactive));
  const cursor = encodeURIComponent(response.data.nextCursor);
  const second = await search(`search=demo&limit=1&cursor=${cursor}`);
  assert.equal(second.status,200); assert.notEqual(second.body.items[0].id,response.data.items[0].id);
  assert.equal(second.body.hasMore,false); assert.equal(second.body.nextCursor,null);
  assert.equal((await search(`search=another&cursor=${cursor}`)).status,400);
  assert.equal((await search('search=demo',assistant)).status,403);
  await f.add(f.s1,users.other,'teacher');
  assert.equal((await search(`search=demo&cursor=${cursor}`,assistant)).status,400);
  assert.equal((await search('search=no-match')).body.items.length,0);
  for (const q of ['', 'search=%20%20','search=a&limit=0','search=a&limit=101','search=a&cursor=invalid','search=a&unknown=1']) assert.equal((await search(q)).status,400);
  await pool.query('UPDATE users SET name=$1 WHERE id=$2',['Álvaro 100%_literal',users.other]);
  assert.equal((await search('search=%25_')).body.items.length,1);
  assert.equal((await search('search=%C3%81LVARO')).body.items[0].id,users.other);
  assert.equal((await search('search=%27%20OR%201%3D1--')).body.items.length,0);
  assert.equal((await search('search=demo',owner,'utfsm')).status,403);
  await f.add(f.s4,users.owner,'teacher',f.tenants.utfsm);
  const foreign = await search('search=demo',owner,'utfsm'); assert.equal(foreign.status,200);
  assert.ok(foreign.body.items.some(u=>u.id===users.foreign)); assert.ok(!foreign.body.items.some(u=>u.id===users.other));
  assert.equal((await search(`search=demo&cursor=${cursor}`,owner,'utfsm')).status,400);
  await pool.query('UPDATE users SET active=false WHERE id=$1',[users.other]);
  assert.equal((await search('search=%25_')).body.items.length,0);
  await pool.query('UPDATE users SET active=true WHERE id=$1',[users.other]);
  await pool.query('UPDATE institution_memberships SET active=false WHERE institution_id=$1 AND user_id=$2',[f.tenants.uc,users.other]);
  assert.equal((await search('search=%25_')).body.items.length,0);
  // Owner is both admin and superadmin; neither flag substitutes for an active teacher role.
  await pool.query("UPDATE enrollments SET active=false WHERE institution_id=$1 AND user_id=$2 AND role='teacher'",[f.tenants.uc,users.owner]);
  assert.equal((await search('search=demo')).status,403);
  await f.add(f.s1,users.owner,'teacher');
  await pool.query('UPDATE institution_memberships SET active=false WHERE institution_id=$1 AND user_id=$2',[f.tenants.uc,users.owner]);
  assert.equal((await search('search=demo')).status,404);
  assert.equal((await fetch(`${app.base}/api/v1/institution/uc/users?search=demo`)).status,401);
 } finally { if(app) await app.close(); await pool.end(); }
});
