import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {mkdtemp,rm,utimes} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {Readable} from "node:stream";
import {buffer} from "node:stream/consumers";
import {test} from "node:test";
import {LocalObjectStorage,S3ObjectStorage,configuredStorage,objectKey} from "../dist/academic-files/object-storage.js";
import {collectOrphans} from "../dist/commands/academic-cleanup.js";
import {validateUpload} from "../dist/academic-files/file-format.js";

const key=()=>objectKey("materials",randomUUID(),randomUUID());
const bytes=Buffer.from("%PDF-1.7\n%%EOF");
test("local driver persists bytes, confines keys and removes only old unreferenced objects",async()=>{
 const root=await mkdtemp(join(tmpdir(),"academic-storage-"));
 try {
  const old=key(), recent=key(), used=key();
  const writer=new LocalObjectStorage(root), reader=new LocalObjectStorage(root);
  for (const k of [old,recent,used]) await writer.put(k,bytes);
  const yesterday=new Date(Date.now()-48*3600_000);
  for (const k of [old,used]) await utimes(join(root,k),yesterday,yesterday);
  assert.deepEqual(await buffer(await reader.get(used,bytes.length)),bytes);
  await assert.rejects(()=>reader.get(used,bytes.length+1),e=>e.getStatus()===503);
  await assert.rejects(()=>reader.get("../secrets",1),e=>e.getStatus()===503);
  assert.equal((await collectOrphans(reader,async k=>k===used)).orphans,1);
  assert.equal((await collectOrphans(reader,async k=>k===used,{apply:true})).orphans,1);
  await assert.rejects(()=>reader.get(old,bytes.length),e=>e.getStatus()===404);
  assert.deepEqual(await buffer(await reader.get(recent,bytes.length)),bytes);
  assert.deepEqual(await buffer(await reader.get(used,bytes.length)),bytes);
  assert.equal((await collectOrphans(reader,async()=>true,{batch:1})).inspected,1);
 } finally {await rm(root,{recursive:true,force:true});}
});

test("S3 adapter issues encrypted immutable puts, streaming reads and scoped maintenance calls",async()=>{
 const object=key(), calls=[];
 const store=new S3ObjectStorage("test-bucket",async (command,signal)=>{
  assert.equal(signal.aborted,false);
  calls.push([command.constructor.name,command.input]);
  if (command.constructor.name==="GetObjectCommand") return {ContentLength:bytes.length,Body:Readable.from(bytes)};
  if (command.constructor.name==="ListObjectsV2Command") return {Contents:[{Key:object,LastModified:new Date()}]};
  return {};
 });
 await store.put(object,bytes,"application/pdf");
 assert.deepEqual(await buffer(await store.get(object,bytes.length)),bytes);
 assert.equal((await Array.fromAsync(store.listMaterials()))[0].key,object);
 await store.delete(object);
 assert.deepEqual(calls.map(([command])=>command),["PutObjectCommand","GetObjectCommand","ListObjectsV2Command","DeleteObjectCommand"]);
 assert.equal(calls[0][1].ServerSideEncryption,"AES256");
 assert.equal(calls[0][1].IfNoneMatch,"*");
 assert.equal(calls[2][1].Prefix,"academic/materials/");
 assert.ok(calls.every(([,input])=>input.Bucket==="test-bucket"));
 const denied=new S3ObjectStorage("test-bucket",async()=>{throw new Error("simulated denied");});
 await assert.rejects(()=>denied.put(object,bytes,"application/pdf"),e=>e.getStatus()===503);
 assert.equal(configuredStorage({NODE_ENV:"production",ACADEMIC_STORAGE_DRIVER:"local"}),undefined);
 assert.equal(configuredStorage({ACADEMIC_STORAGE_DRIVER:"s3"}),undefined);
});

test("format validation cross-checks name, MIME, content and configurable category limits",async()=>{
 const pdf={buffer:bytes,originalname:"Guía.PDF",mimetype:"application/pdf"};
 assert.equal((await validateUpload(pdf)).name,"Guía.PDF");
 for (const input of [{...pdf,originalname:"invalid.html"},{...pdf,mimetype:"text/plain"},
  {...pdf,buffer:Buffer.from("not a pdf")},{...pdf,originalname:"fake.docx",mimetype:"application/octet-stream"}]) {
  await assert.rejects(()=>validateUpload(input),e=>e.getStatus()===415);
 }
 await assert.rejects(()=>validateUpload(pdf,{document:1,image:1,zip:1}),e=>e.getStatus()===413);
 const notebook=await validateUpload({originalname:"Clase.ipynb",mimetype:"application/json",buffer:Buffer.from('{"nbformat":4,"cells":[]}')});
 assert.equal(notebook.mime,"application/x-ipynb+json");
});
