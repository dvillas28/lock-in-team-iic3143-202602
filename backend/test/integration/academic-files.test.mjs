import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {mkdtemp,rm,utimes} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {runner} from "node-pg-migrate";
import {test} from "node:test";
import {database,http} from "./helpers.mjs";
import {contentFixture,tokens,request,users} from "./content-fixtures.mjs";
import {failAudit,restoreAudit} from "./course-fixtures.mjs";
import {LocalObjectStorage} from "../../dist/academic-files/object-storage.js";
import {cleanupAcademicFiles} from "../../dist/commands/academic-cleanup.js";

const pdf=Buffer.from("%PDF-1.7\n%%EOF");
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR42mMAAQAABQABoIJXOAAAAABJRU5ErkJggg==","base64");
function raw(app,token,path,init={}) {
 return fetch(`${app.base}/api/v1/institution/${path}`,{...init,headers:{Authorization:`Bearer ${token}`,...init.headers}});
}
function upload(app,token,path,method="POST",data=pdf,name="Guía.pdf",type="application/pdf",operation) {
 const body=new FormData();
 body.append("file",new Blob([data],{type}),name);
 return raw(app,token,path,{method,body,headers:operation?{"Idempotency-Key":operation}:{}});
}

async function runAcademicMigration(pool,direction="down") {
 const client=await pool.connect();
 try {
  return await runner({dbClient:client,dir:fileURLToPath(new URL("../../migrations",import.meta.url)),
   schema:"public",migrationsSchema:"public",migrationsTable:"pgmigrations",direction,file:"20261109000100_academic_files",count:1,checkOrder:false,singleTransaction:true,
   logger:{debug(){},info(){},warn(){},error(){}}});
 } finally {client.release();}
}

test("academic migration backfills the old Markdown order without altering content or publication",async()=>{
 const pool=await database();
 try {
  const f=await contentFixture(pool,true);
  const module=f.modules[3];
  await pool.query(`INSERT INTO materials(id,institution_id,module_id,title,markdown_body,created_by)
   VALUES($1,$2,$3,'Otra lectura','# Fuente',$4)`,[randomUUID(),f.tenants.uc,module,users.other]);
  const markdown=()=>pool.query(`SELECT id,title,markdown_body,published_at FROM materials
   WHERE module_id=$1 ORDER BY id`,[module]).then(result=>result.rows);
  const before=await markdown();
  assert.equal((await runAcademicMigration(pool)).length,1);
  assert.deepEqual(await markdown(),before);
  assert.equal((await runAcademicMigration(pool,"up")).length,1);
  assert.deepEqual(await markdown(),before);
  const after=(await pool.query("SELECT id,position FROM materials WHERE module_id=$1 ORDER BY position",[module])).rows;
  assert.deepEqual(after,before.map((item,i)=>({id:item.id,position:i+1})));
 } finally {await pool.end();}
});

test("academic file lifecycle is scoped, auditable, and consistent across object and SQL failures",async()=>{
 const pool=await database(),dir=await mkdtemp(join(tmpdir(),"academic-file-http-"));
 const env={ACADEMIC_STORAGE_DRIVER:"local",ACADEMIC_LOCAL_DIR:dir,ACADEMIC_DOCUMENT_LIMIT_MIB:"1"};
 let app;
 try {
  const f=await contentFixture(pool,true);
  app=await http(env);
  const t=await tokens(app,f), module=`uc/modules/${f.modules[3]}`, create=module+"/files";
  assert.equal((await upload(app,t.student,create)).status,403);
  assert.equal((await upload(app,t.assistant,create)).status,403);
  assert.equal((await upload(app,t.admin,create)).status,404);
  assert.equal((await upload(app,t.teacher,create,"POST",Buffer.from("bad"))).status,415);
  assert.equal((await upload(app,t.teacher,create,"POST",Buffer.alloc(1024*1024+1))).status,413);

  const operation=randomUUID();
  const [first,second]=await Promise.all([upload(app,t.teacher,create,"POST",pdf,"Guía.pdf","application/pdf",operation),
   upload(app,t.teacher,create,"POST",pdf,"Guía.pdf","application/pdf",operation)]);
  assert.equal(first.status,201);assert.equal(second.status,201);
  const file=await first.json();
  assert.equal((await second.json()).id,file.id);
  assert.equal(file.publishedAt,null);assert.equal(file.kind,"file");assert.equal(file.fileName,"Guía.pdf");
  await assert.rejects(()=>runAcademicMigration(pool),/Retain academic file and quiz references/);
  assert.equal((await upload(app,t.teacher,create,"POST",pdf,"Otra.pdf","application/pdf",operation)).status,409);
  const detail=`uc/materials/${file.id}/file`;
  assert.equal((await request(app,t.teacher,module+"/materials")).body.items.length,1);
  const list=token=>request(app,token,module+"/resources");
  assert.deepEqual((await list(t.teacher)).body.items.map(r=>r.kind),["markdown","file"]);
  assert.deepEqual((await list(t.student)).body.items.map(r=>r.kind),["markdown"]);
  for (const action of ["","/preview","/download"]) {
   assert.equal((await raw(app,t.student,detail+action)).status,404);
   assert.equal((await raw(app,t.assistant,detail+action)).status,404);
  }
  const move={resourceId:file.id,neighborId:f.materials[3],direction:-1};
  assert.equal((await raw(app,t.teacher,module+"/resources/order",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(move)})).status,204);
  assert.equal((await list(t.teacher)).body.items[0].id,file.id);
  assert.equal((await request(app,t.teacher,detail+"/publish","POST")).status,200);
  for (const token of [t.teacher,t.assistant,t.student]) {
   const preview=await raw(app,token,detail+"/preview"), download=await raw(app,token,detail+"/download");
   assert.equal(preview.status,200);assert.equal(preview.headers.get("content-type"),"application/pdf");
   assert.match(preview.headers.get("content-disposition"),/^inline/);
   assert.match(download.headers.get("content-disposition"),/^attachment/);
   assert.equal(download.headers.get("cache-control"),"no-store");
   for (const response of [preview,download]) assert.deepEqual(Buffer.from(await response.arrayBuffer()),pdf);
  }
  assert.equal((await request(app,t.assistant,detail,"PATCH",{title:"Forbidden"})).status,403);
  assert.equal((await raw(app,t.teacher,detail.replace("uc/","utfsm/")+"/preview")).status,404);
  assert.equal((await request(app,t.teacher,module+"/unpublish","POST")).status,200);
  assert.equal((await raw(app,t.student,detail+"/download")).status,404);
  assert.equal((await request(app,t.teacher,module+"/publish","POST")).status,200);
  await pool.query("UPDATE enrollments SET active=false WHERE institution_id=$1 AND user_id=$2",[f.tenants.uc,users.revoked]);
  assert.equal((await raw(app,t.student,detail+"/preview")).status,404);
  assert.equal((await request(app,t.teacher,detail,"PATCH",{title:"Lectura del curso"})).body.title,"Lectura del curso");

  await failAudit(pool,"academicFile.replaced",file.id);
  assert.equal((await upload(app,t.teacher,detail,"PUT",png,"Diagrama.png","image/png")).status,500);
  assert.deepEqual(Buffer.from(await (await raw(app,t.teacher,detail+"/preview")).arrayBuffer()),pdf);
  await restoreAudit(pool);
  const storage=new LocalObjectStorage(dir);
  assert.equal((await Array.fromAsync(storage.listMaterials())).length,2);
  for (const entry of await Array.fromAsync(storage.listMaterials())) await utimes(join(dir,entry.key),new Date(0),new Date(0));
  const cleaned=await cleanupAcademicFiles({...process.env,...env,MIGRATION_DATABASE_URL:process.env.TEST_DATABASE_URL},{apply:true});
  assert.equal(cleaned.orphans,1);

  const replaced=await upload(app,t.teacher,detail,"PUT",png,"Diagrama.png","image/png");
  assert.equal(replaced.status,200);assert.equal((await replaced.json()).preview,"image");
  await app.close();app=await http(env);
  const fresh=await tokens(app,f);
  assert.deepEqual(Buffer.from(await (await raw(app,fresh.assistant,detail+"/preview")).arrayBuffer()),png);
  assert.equal((await raw(app,fresh.teacher,detail,{method:"DELETE"})).status,204);
  assert.equal((await raw(app,fresh.teacher,detail+"/download")).status,404);
  assert.equal((await Array.fromAsync(storage.listMaterials())).length,0);
  const rows=(await pool.query("SELECT action,changes FROM audit_events WHERE resource_id=$1 ORDER BY occurred_at",[file.id])).rows;
  assert.deepEqual(rows.map(r=>r.action),["academicFile.created","academicFile.published","academicFile.renamed","academicFile.replaced","academicFile.deleted"]);
  assert.ok(rows.every(r=>!JSON.stringify(r.changes).includes("academic/materials")));
 } finally {if(app) await app.close();await pool.end();await rm(dir,{recursive:true,force:true});}
});
