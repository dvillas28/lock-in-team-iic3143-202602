import assert from 'node:assert/strict';
import {test} from 'node:test';
import {smoke} from './postdeploy-demo.mjs';
test('smoke rejects unsafe destinations and unexpected status without exposing credentials',async()=>{
 for(const baseUrl of ['https://user:secret@example.com','https://example.com/api/v1','http://remote.example'])await assert.rejects(smoke({baseUrl}),/Invalid API origin/);
 await assert.rejects(smoke({fetcher:async()=>new Response('secret',{status:503})}),e=>!e.message.includes('secret') && e.message.includes('503'));
});
