import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createElement as h} from 'react';
import {CourseDirectory} from '../src/components/courses/course-directory.tsx';
import {CourseDetail} from '../src/components/courses/course-detail.tsx';
import {academicYears} from '../src/lib/courses/creation.ts';
import {mount} from './fixtures/course-ui.ts';
import {course,section} from './fixtures/courses.ts';
const values={code:'iic-3143',name:'Desarrollo',term:`${academicYears()[0]}-2`,sectionCode:'a-1',capacity:'30'};
const writes=(requests:Request[])=>requests.filter(r=>r.method==='POST'&&r.url.endsWith('/courses'));
const reply=(r:Request)=>Response.json(r.url.endsWith('/sections')?{items:[section]}:{items:[]});

test('course period uses listed years and two semesters; required errors are shown together',async()=>{
 const ui=await mount(h(CourseDirectory),reply);
 try{
  const year=ui.doc.querySelector<HTMLSelectElement>('select[name="termYear"]')!;
  assert.deepEqual(Array.from(year.options).map(o=>Number(o.value)),academicYears());
  assert.deepEqual(Array.from(ui.doc.querySelector<HTMLSelectElement>('select[name="termSemester"]')!.options).map(o=>o.value),['1','2']);
  await ui.submit('form');
  assert.equal(ui.doc.querySelectorAll('[aria-invalid="true"]').length,3);
  assert.equal(ui.doc.activeElement?.getAttribute('name'),'code');
  assert.equal(writes(ui.requests).length,0);
  assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="code"]')!.maxLength,32);
  assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="name"]')!.maxLength,200);
  assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="sectionCode"]')!.maxLength,32);
 }finally{await ui.close();}
});

test('codes normalize on save; spaces, emoji, invalid semester and capacity bounds stay local',async()=>{
 for(const invalid of [{code:'IIC 3143'},{code:'IIC🚀'},{sectionCode:'A_1'},{term:'2026-3'},{capacity:'0'},{capacity:'1001'},{capacity:'1.5'}]){
  const ui=await mount(h(CourseDirectory),reply);
  try{await ui.submit('form',{...values,...invalid});assert.equal(writes(ui.requests).length,0);assert.ok(ui.doc.querySelector('[aria-invalid="true"]'));}
  finally{await ui.close();}
 }
 let body:Record<string,unknown>|undefined;
 const ui=await mount(h(CourseDirectory),async r=>{if(r.method==='POST'){body=await r.json();return Response.json({...course,...body},{status:201});}return reply(r);});
 try{await ui.submit('form',values);assert.equal(body?.code,'IIC-3143');assert.deepEqual(body?.initialSection,{code:'A-1',capacity:30});}
 finally{await ui.close();}
});

test('incomplete native capacity input is rejected rather than saved as unlimited',async()=>{
 const ui=await mount(h(CourseDirectory),reply);
 try{
  const input=ui.doc.querySelector<HTMLInputElement>('[name="capacity"]')!;
  Object.defineProperty(input,'validity',{configurable:true,value:{badInput:true}});
  await ui.submit('form',{...values,capacity:''});
  assert.equal(writes(ui.requests).length,0);assert.equal(ui.doc.activeElement,input);
 }finally{await ui.close();}
});

test('duplicate course preserves values and explains both code and term',async()=>{
 const ui=await mount(h(CourseDirectory),r=>r.method==='POST'?Response.json({},{status:409}):reply(r));
 try{
  await ui.submit('form',values);
  assert.match(ui.doc.body.textContent!,/Ya existe un curso con ese código y período/);
  assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="code"]')!.value,values.code);
  assert.equal(ui.doc.querySelector('[name="termYear"]')?.getAttribute('aria-invalid'),'true');
  assert.equal(ui.doc.activeElement?.getAttribute('name'),'code');
 }finally{await ui.close();}
});

test('editing a demo course name preserves its historical period and untouched legacy code',async()=>{
 const original={...course,term:'DEMO-2026-2',code:'legacy_code'};let body:unknown;
 const ui=await mount(h(CourseDetail,{courseId:course.id}),async r=>{
  if(r.method==='PATCH'){body=await r.json();return Response.json({...original,...body as object});}
  return Response.json(r.url.endsWith('/sections')?{items:[section]}:original);
 });
 try{await ui.submit('form[aria-label="Configurar curso"]',{name:'Nombre actualizado'});assert.deepEqual(body,{name:'Nombre actualizado'});}
 finally{await ui.close();}
});
