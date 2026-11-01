import assert from 'node:assert/strict';
import {test} from 'node:test';
import validation from '../dist/courses/validation.js';

test('course and section metadata reject NUL before persistence while preserving Unicode boundaries',()=>{
 for(const value of ['\0before','inside\0metadata','after\0'])assert.throws(()=>validation.text(value,200),e=>e.getStatus()===400);
 assert.equal(validation.text('  Álgebra 😀  ',200),'Álgebra 😀');
 assert.equal(validation.text('😀'.repeat(200),200),'😀'.repeat(200));
 assert.throws(()=>validation.text('😀'.repeat(201),200),e=>e.getStatus()===400);
});
