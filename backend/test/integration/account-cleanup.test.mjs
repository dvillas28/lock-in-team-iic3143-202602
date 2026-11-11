import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID} from "node:crypto";
import {mkdtemp,rm,utimes,stat} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import sharp from "sharp";
import {database,testUrl,runtimeUrl} from "./helpers.mjs";
import {accountFixture} from "./account-fixtures.mjs";

test("operator avatar cleanup protects DB references and 24-hour grace, with dry-run and repeat safety",async()=>{
 const pool=await database(),directory=await mkdtemp(join(tmpdir(),"academix-orphan-integration-"));
 try {
  const f=await accountFixture(pool),now=new Date(),old=new Date(now.getTime()-48*60*60*1000);
  const {LocalAvatarStorage}=await import("../../dist/accounts/providers/avatar-storage.js");
  const {cleanupAccounts}=await import("../../dist/commands/account-cleanup.js");
  const storage=new LocalAvatarStorage(directory),key=()=>`avatars/${f.standalone.id}/${randomUUID()}.webp`;
  const orphan=key(),referenced=key(),recent=key(),bytes=await sharp({create:{width:8,height:8,channels:3,background:"#123456"}}).webp().toBuffer();
  for(const name of [orphan,referenced,recent])await storage.put(name,bytes);
  for(const name of [orphan,referenced])await utimes(join(directory,name),old,old);
  await pool.query("UPDATE public.users SET avatar_key=$1 WHERE id=$2",[referenced,f.standalone.id]);
  const env={...process.env,MIGRATION_DATABASE_URL:testUrl(),DATABASE_URL:runtimeUrl(),NODE_ENV:"development",AVATAR_STORAGE_DRIVER:"local",AVATAR_LOCAL_DIR:directory,MAIL_DELIVERY_MODE:"disabled"};
  const options={batch:100,now,operatorRef:"integration-avatar-maintenance"};
  const dry=await cleanupAccounts(env,{...options,apply:false});assert.equal(dry.avatars,1);assert.equal(dry.applied,false);
  assert.equal(dry.avatarsInspected,3);assert.equal(dry.avatarCursor,null);
  assert.ok(await stat(join(directory,orphan)));assert.deepEqual(await storage.get(referenced),bytes);assert.deepEqual(await storage.get(recent),bytes);
  const applied=await cleanupAccounts(env,{...options,apply:true});assert.equal(applied.avatars,1);assert.equal(applied.applied,true);
  await assert.rejects(()=>stat(join(directory,orphan)),error=>error.code==="ENOENT");
  assert.deepEqual(await storage.get(referenced),bytes);assert.deepEqual(await storage.get(recent),bytes);
  assert.equal((await pool.query("SELECT avatar_key FROM users WHERE id=$1",[f.standalone.id])).rows[0].avatar_key,referenced);
  assert.equal((await cleanupAccounts(env,{...options,apply:true})).avatars,0);
 }finally{await pool.end();await rm(directory,{recursive:true,force:true});}
});

test("bounded avatar scans resume past referenced and fresh objects without starving later orphans",async()=>{
 const pool=await database(),directory=await mkdtemp(join(tmpdir(),"academix-orphan-cursor-integration-"));
 try {
  const f=await accountFixture(pool),now=new Date(),old=new Date(now.getTime()-48*60*60*1000);
  const {LocalAvatarStorage}=await import("../../dist/accounts/providers/avatar-storage.js");
  const {cleanupAccounts}=await import("../../dist/commands/account-cleanup.js");
  const storage=new LocalAvatarStorage(directory);
  const key=n=>`avatars/${f.standalone.id}/20000000-0000-4000-8000-00000000000${n}.webp`;
  const referenced=key(1),orphan=key(2),fresh=key(3),laterOrphan=key(4),bytes=Buffer.from("test-image");
  for(const name of [laterOrphan,fresh,orphan,referenced])await storage.put(name,bytes);
  for(const name of [referenced,orphan,laterOrphan])await utimes(join(directory,name),old,old);
  await pool.query("UPDATE public.users SET avatar_key=$1 WHERE id=$2",[referenced,f.standalone.id]);
  const env={...process.env,MIGRATION_DATABASE_URL:testUrl(),DATABASE_URL:runtimeUrl(),NODE_ENV:"development",AVATAR_STORAGE_DRIVER:"local",AVATAR_LOCAL_DIR:directory,MAIL_DELIVERY_MODE:"disabled"};
  const options={batch:1,now,operatorRef:"integration-avatar-cursor",apply:true};
  const page1=await cleanupAccounts(env,options);
  assert.equal(page1.avatars,0);assert.equal(page1.avatarsInspected,1);assert.equal(page1.avatarCursor,referenced);
  assert.deepEqual(await storage.get(referenced),bytes);assert.deepEqual(await storage.get(orphan),bytes);
  const page2=await cleanupAccounts(env,{...options,avatarAfter:page1.avatarCursor});
  assert.equal(page2.avatars,1);assert.equal(page2.avatarsInspected,1);assert.equal(page2.avatarCursor,orphan);
  await assert.rejects(()=>stat(join(directory,orphan)),error=>error.code==="ENOENT");
  const page3=await cleanupAccounts(env,{...options,avatarAfter:page2.avatarCursor});
  assert.equal(page3.avatars,0);assert.equal(page3.avatarsInspected,1);assert.equal(page3.avatarCursor,fresh);
  assert.deepEqual(await storage.get(fresh),bytes);
  const page4=await cleanupAccounts(env,{...options,avatarAfter:page3.avatarCursor});
  assert.equal(page4.avatars,1);assert.equal(page4.avatarsInspected,1);assert.equal(page4.avatarCursor,laterOrphan);
  await assert.rejects(()=>stat(join(directory,laterOrphan)),error=>error.code==="ENOENT");
  const done=await cleanupAccounts(env,{...options,avatarAfter:page4.avatarCursor});
  assert.equal(done.avatars,0);assert.equal(done.avatarsInspected,0);assert.equal(done.avatarCursor,null);
  await assert.rejects(()=>cleanupAccounts(env,{...options,avatarAfter:"../outside"}),/config/);
  assert.deepEqual(await storage.get(referenced),bytes);assert.deepEqual(await storage.get(fresh),bytes);
 }finally{await pool.end();await rm(directory,{recursive:true,force:true});}
});
