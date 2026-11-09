import assert from "node:assert/strict";
import {test} from "node:test";
import {mkdtemp, readFile, symlink, mkdir, utimes, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import sharp from "sharp";
import {PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command} from "@aws-sdk/client-s3";
import storage from "../dist/accounts/providers/avatar-storage.js";
import mail from "../dist/accounts/providers/mailer.js";
import images from "../dist/accounts/providers/image.js";
import config from "../dist/accounts/providers/config.js";

const owner="10000000-0000-4000-8000-000000000001";
const object="20000000-0000-4000-8000-000000000001";
const key=`avatars/${owner}/${object}.webp`;
const origins=JSON.stringify({uc:"https://uc.academix.dvillasc.me",utfsm:"https://utfsm.academix.dvillasc.me"});
const message={to:"person@example.test",subject:"Activa tu acceso",html:"<a href='https://uc.example/activate#token=secret'>Activar</a>",text:"Activate: token=secret"};
const mailEnv={NODE_ENV:"production",MAIL_DELIVERY_MODE:"resend",RESEND_API_KEY:"re_test",MAIL_FROM:"AcademiX <no-reply@mail.academix.dvillasc.me>",ACTIVATION_ORIGINS_BY_INSTITUTION:origins};

const status=n=>error=>error.getStatus?.()===n;

test("storage is disabled in unconfigured production, never uses local fallback, and needs no network at startup",async()=>{
 for(const env of [{NODE_ENV:"production"},{NODE_ENV:"production",AVATAR_STORAGE_DRIVER:"local"},{NODE_ENV:"production",AVATAR_STORAGE_DRIVER:"s3",AWS_REGION:"us-east-1"},{NODE_ENV:"development",AVATAR_STORAGE_DRIVER:"unknown"}]) {
  const driver=storage.createAvatarStorage(env);
  assert.equal(driver.available,false);
  await assert.rejects(driver.put(key,Buffer.from("image")),e=>e.getStatus()===503&&e.getResponse().code==="INTEGRATION_NOT_CONFIGURED");
  await assert.rejects(driver.get(key),status(503));
  await assert.rejects(driver.delete(key),status(503));
 }
 assert.equal(storage.createAvatarStorage({NODE_ENV:"development"}).available,true);
 const enabled=storage.createAvatarStorage({NODE_ENV:"production",AVATAR_STORAGE_DRIVER:"s3",AWS_REGION:"us-east-1",S3_AVATAR_BUCKET:"test-private",AWS_ACCESS_KEY_ID:"key",AWS_SECRET_ACCESS_KEY:"secret"},{execute:async()=>assert.fail("startup accessed S3")});
 assert.equal(enabled.available,true);
});

test("local avatar objects persist across instances, enumerate by age, and reject traversal/symlinks",async()=>{
 const directory=await mkdtemp(join(tmpdir(),"academix-avatars-"));
 try {
  const first=new storage.LocalAvatarStorage(directory);
  const bytes=Buffer.from("normalized-webp");
  await first.put(key,bytes);
  assert.deepEqual(await new storage.LocalAvatarStorage(directory).get(key),bytes);
  assert.deepEqual(await readFile(join(directory,key)),bytes);
  for(const invalid of ["../secret",`avatars/${owner}/../../secret`,key+"\n",key.replace("avatars/","avatars\\"),key.replace(".webp",".png")]) {
   await assert.rejects(first.get(invalid),status(400));
   await assert.rejects(first.put(invalid,bytes),status(400));
   await assert.rejects(first.delete(invalid),status(400));
  }
  const old=new Date(Date.now()-86_400_000);await utimes(join(directory,key),old,old);
  const listed=[];for await (const entry of first.list()) listed.push(entry.key);
  assert.deepEqual(listed,[key]);
  const after=[];for await(const entry of first.list(key))after.push(entry);
  assert.deepEqual(after,[]);
  const otherOwner="10000000-0000-4000-8000-000000000002";
  await mkdir(join(directory,"outside"));
  await symlink(join(directory,"outside"),join(directory,"avatars",otherOwner));
  await assert.rejects(first.put(key.replace(owner,otherOwner),bytes),status(503));
  await first.delete(key);await first.delete(key);
  await assert.rejects(first.get(key),status(404));
  assert.deepEqual(Array.fromAsync?await Array.fromAsync(first.list()):[],[]);
 } finally {await rm(directory,{recursive:true,force:true});}
});

test("S3 sends only private-prefix objects and supports put/get/delete, resumable lexical scans and bounded pagination",async()=>{
 const commands=[];
 const body=Buffer.from("normalized-webp");
 const driver=new storage.S3AvatarStorage("private-bucket",async(command,signal)=>{
  commands.push(command);assert.ok(signal instanceof AbortSignal);
  if(command instanceof GetObjectCommand)return {Body:{transformToByteArray:async()=>body}};
  if(command instanceof ListObjectsV2Command) {
   if(!command.input.ContinuationToken)return {Contents:[{Key:key,LastModified:new Date(0)},{Key:"secrets/file",LastModified:new Date(0)}],IsTruncated:true,NextContinuationToken:"next"};
   return {Contents:[{Key:key.replace(object,"20000000-0000-4000-8000-000000000002"),LastModified:new Date("2100-01-01")}],IsTruncated:false};
  }
  return {};
 });
 await driver.put(key,body);
 assert.ok(commands[0] instanceof PutObjectCommand);
 assert.equal(commands[0].input.Bucket,"private-bucket");assert.equal(commands[0].input.Key,key);
 assert.equal(commands[0].input.ContentType,"image/webp");assert.equal(commands[0].input.ACL,undefined);
 assert.equal(commands[0].input.IfNoneMatch,"*");assert.equal(commands[0].input.ServerSideEncryption,"AES256");assert.equal(commands[0].input.CacheControl,"private, no-store");
 assert.deepEqual(await driver.get(key),body);
 await driver.delete(key);assert.ok(commands[2] instanceof DeleteObjectCommand);
 const newerKey=key.replace(object,"20000000-0000-4000-8000-000000000002");
 const list=[];for await(const entry of driver.list())list.push(entry.key);
 assert.deepEqual(list,[key,newerKey]);
 assert.equal(commands.at(-1).input.ContinuationToken,"next");
 assert.equal(commands.at(-1).input.Prefix,"avatars/");assert.equal(commands.at(-1).input.MaxKeys,100);
 const resumed=[];for await(const entry of driver.list(key))resumed.push(entry.key);
 assert.deepEqual(resumed,[newerKey]);assert.equal(commands.at(-1).input.StartAfter,key);
 await assert.rejects(async()=>{for await(const entry of driver.list("../invalid"))assert.fail("Invalid cursor enumerated: "+entry.key);},status(400));
 const missing=new storage.S3AvatarStorage("private",async()=>{throw Object.assign(new Error("secret provider body"),{name:"NoSuchKey"});});
 await assert.rejects(missing.get(key),status(404));
 const failing=new storage.S3AvatarStorage("private",async()=>{throw new Error("secret provider body");});
 await assert.rejects(failing.put(key,body),e=>e.getStatus()===503&&!e.message.includes("secret"));
 await assert.rejects(failing.get(key),status(503));await assert.rejects(failing.delete(key),status(503));
});

test("local enumeration is lexical and resumes after the last inspected key, including fresh objects",async()=>{
 const directory=await mkdtemp(join(tmpdir(),"academix-avatar-cursor-"));
 try {
  const driver=new storage.LocalAvatarStorage(directory);
  const names=[3,1,2].map(n=>`avatars/${owner}/20000000-0000-4000-8000-00000000000${n}.webp`);
  for(const name of names)await driver.put(name,Buffer.from("image"));
  const all=[];for await(const row of driver.list())all.push(row.key);
  assert.deepEqual(all,[...names].sort());
  const after=[];for await(const row of driver.list(all[1]))after.push(row.key);
  assert.deepEqual(after,[all[2]]);
  await assert.rejects(async()=>{for await(const entry of driver.list("../invalid"))assert.fail("Invalid cursor enumerated: "+entry.key);},status(400));
 }finally{await rm(directory,{recursive:true,force:true});}
});

test("image processing strips metadata, applies orientation/resize and rejects disguised, oversized and excessive-pixel files",async()=>{
 const original=await sharp({create:{width:1400,height:700,channels:3,background:"red"}}).png().withMetadata({orientation:6}).toBuffer();
 const normalized=await images.normalizeAvatar(original);
 const metadata=await sharp(normalized).metadata();
 assert.equal(metadata.format,"webp");assert.ok(metadata.width<=1024&&metadata.height<=1024);
 assert.equal(metadata.orientation,undefined);assert.equal(metadata.exif,undefined);assert.equal(metadata.icc,undefined);
 const tiny=await sharp({create:{width:4,height:2,channels:3,background:"green"}}).jpeg().toBuffer();
 assert.equal((await sharp(await images.normalizeAvatar(tiny)).metadata()).width,4);
 const webp=await sharp(tiny).webp().toBuffer();assert.equal((await sharp(await images.normalizeAvatar(webp)).metadata()).format,"webp");
 for(const bytes of [Buffer.from("<svg></svg>"),Buffer.from("GIF89a"),Buffer.from("not an image")])await assert.rejects(images.normalizeAvatar(bytes),status(415));
 await assert.rejects(images.normalizeAvatar(original.subarray(0,20)),status(400));
 await assert.rejects(images.normalizeAvatar(Buffer.alloc(images.MAX_AVATAR_BYTES+1)),status(413));
 const large=await sharp({create:{width:5000,height:5000,channels:3,background:"blue"}}).png().toBuffer();
 await assert.rejects(images.normalizeAvatar(large),status(400));
 const animated=await sharp(Buffer.from([255,0,0,255,0,255,0,255]),{raw:{width:1,height:2,channels:4,pageHeight:1}}).webp({loop:0,delay:[100,100]}).toBuffer();
 assert.equal((await sharp(animated,{animated:true}).metadata()).pages,2);
 await assert.rejects(images.normalizeAvatar(animated),status(400));
 // An actual APNG control chunk must be rejected even when the decoder would expose only frame one.
 const animationChunk=Buffer.concat([Buffer.from([0,0,0,8]),Buffer.from("acTL"),Buffer.from([0,0,0,2,0,0,0,0]),Buffer.alloc(4)]);
 const apng=Buffer.concat([original.subarray(0,33),animationChunk,original.subarray(33)]);
 await assert.rejects(images.normalizeAvatar(apng),status(400));
});

test("activation origins are exact server-configured origins and incomplete mail configuration stays disabled",async()=>{
 for(const value of [undefined,"invalid","[]",JSON.stringify({uc:"https://uc.example/path",utfsm:"https://utfsm.example"}),JSON.stringify({uc:"http://uc.localhost:3000",utfsm:"http://utfsm.localhost:3000"})]) {
  const env={...mailEnv,ACTIVATION_ORIGINS_BY_INSTITUTION:value};assert.equal(mail.createInvitationMailer(env).available,false);
 }
 assert.equal(config.activationOrigins({NODE_ENV:"development",ACTIVATION_ORIGINS_BY_INSTITUTION:JSON.stringify({uc:"http://uc.localhost:3000",utfsm:"http://utfsm.localhost:3000"})}).size,2);
 for(const partial of [{RESEND_API_KEY:""},{MAIL_FROM:""},{MAIL_FROM:"AcademiX <sender@example.test>\nBcc: other@example.test"},{RESEND_DEBUG:"true"}])assert.equal(mail.createInvitationMailer({...mailEnv,...partial}).available,false);
 for(const nodeEnv of ["production","development"]){
  const fake=mail.createInvitationMailer({NODE_ENV:nodeEnv,MAIL_DELIVERY_MODE:"fake"});assert.equal(fake.available,false);
  await assert.rejects(fake.send(message,"key"),status(503));
 }
 assert.throws(()=>new mail.FakeInvitationMailer({NODE_ENV:"production"}),/restricted/);
 const fake=mail.createInvitationMailer({NODE_ENV:"test",MAIL_DELIVERY_MODE:"fake"});
 const first=await fake.send(message,"key");assert.deepEqual(await fake.send({...message},"key"),first);assert.equal(fake.messages.length,1);
 await assert.rejects(fake.send({...message,text:"different"},"key"),e=>e.code==="MAIL_IDEMPOTENCY_CONFLICT");
});

test("Resend adapter retries at most twice with same body/key, honors Retry-After and distinguishes quotas and uncertain outcomes",async()=>{
 let now=0,calls=0;const seen=[];
 const sender=mail.createInvitationMailer(mailEnv,{now:()=>now,sleep:async ms=>{now+=ms;},transport:async(payload,key,signal)=>{
  calls++;seen.push({payload,key});assert.ok(signal instanceof AbortSignal);
  return calls===1?{error:{name:"rate_limit_exceeded",statusCode:429},headers:{"retry-after":"1"}}:{data:{id:"provider-id"},error:null};
 }});
 assert.deepEqual(await sender.send(message,"operation-key"),{id:"provider-id"});assert.equal(calls,2);assert.equal(now,1000);
 assert.deepEqual(seen[0],seen[1]);
 for(const name of ["daily_quota_exceeded","monthly_quota_exceeded"]) {
  let attempts=0;
  const quota=new mail.ResendInvitationMailer(async()=>{attempts++;return {error:{name,statusCode:429}};});
  await assert.rejects(quota.send(message,"key"),e=>e.status==="quota_blocked"&&e.code==="MAIL_QUOTA_EXCEEDED");assert.equal(attempts,1);
 }
 const rejected=new mail.ResendInvitationMailer(async()=>({error:{name:"validation_error",statusCode:422}}));
 await assert.rejects(rejected.send(message,"key"),e=>e.status==="failed"&&e.code==="MAIL_PROVIDER_REJECTED"&&!e.message.includes("token"));
 const overBudget=new mail.ResendInvitationMailer(async()=>({error:{name:"rate_limit_exceeded",statusCode:429},headers:{"Retry-After":"10"}}));
 await assert.rejects(overBudget.send(message,"key"),e=>e.status==="failed"&&e.code==="MAIL_RATE_LIMITED"&&e.retryAfterSeconds===10);
 let failures=0;const unknown=new mail.ResendInvitationMailer(async()=>{failures++;throw new Error("token=private");});
 await assert.rejects(unknown.send(message,"key"),e=>e.status==="unknown"&&!e.message.includes("private"));assert.equal(failures,2);
 const timeout=new mail.ResendInvitationMailer(async()=>new Promise(()=>{}),{budgetMs:10});
 await assert.rejects(timeout.send(message,"key"),e=>e.status==="unknown");
 const serverFailure=new mail.ResendInvitationMailer(async()=>({error:{name:"application_error",statusCode:503}}));
 await assert.rejects(serverFailure.send(message,"key"),e=>e.status==="unknown");
 const noId=new mail.ResendInvitationMailer(async()=>({data:{},error:null}));
 await assert.rejects(noId.send(message,"key"),e=>e.status==="unknown");
});
