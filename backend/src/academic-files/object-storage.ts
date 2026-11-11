import {Injectable, NotFoundException, ServiceUnavailableException} from "@nestjs/common";
import {S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command} from "@aws-sdk/client-s3";
import {constants} from "node:fs";
import {lstat,mkdir,open,readdir,unlink} from "node:fs/promises";
import {resolve,join} from "node:path";
import {Readable} from "node:stream";
import {randomUUID} from "node:crypto";

const id="[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}";
const materialPattern=new RegExp(`^academic/materials/${id}/${id}/${id}$`);
const submissionPattern=new RegExp(`^academic/submissions/(?:${id}/){5}${id}$`);
type Area = "materials" | "submissions";
const patternFor=(area:Area)=>area==="materials"?materialPattern:submissionPattern;
const unavailable=()=>new ServiceUnavailableException();
function segments(key:string) {
 if (!(materialPattern.test(key) || submissionPattern.test(key)) || /[\r\n]/.test(key)) throw unavailable();
 return key.split("/");
}
export function assertMaterialKey(key:string) {
 if (segments(key)[1]!=="materials") throw unavailable();
}
export function assertSubmissionKey(key:string) {
 if (segments(key)[1]!=="submissions") throw unavailable();
}
export function objectKey(area:"materials", institution:string, resource:string) {
 const key=`academic/${area}/${institution}/${resource}/${randomUUID()}`;
 segments(key);
 return key;
}
export interface ObjectStorage {
 put(key:string, bytes:Buffer, mime:string,sha256?:string):Promise<void>;
 get(key:string, size:number):Promise<Readable>;
 delete(key:string):Promise<void>;
 listMaterials(after?:string):AsyncIterable<{key:string;modified:Date}>;
 listSubmissions(after?:string):AsyncIterable<{key:string;modified:Date}>;
}

export class LocalObjectStorage implements ObjectStorage {
 private readonly root:string;
 constructor(directory:string) {this.root=resolve(directory);}
 private async path(key:string,create=false) {
  const parts=segments(key);
  if (create) await mkdir(this.root,{recursive:true,mode:0o700});
  if (!(await lstat(this.root)).isDirectory()) throw unavailable();
  let parent=this.root;
  for (const part of parts.slice(0,-1)) {
   parent=join(parent,part);
   if (create) await mkdir(parent,{mode:0o700}).catch(error=>{if(error.code!=="EEXIST") throw error;});
   if (!(await lstat(parent)).isDirectory()) throw unavailable();
  }
  return join(this.root,...parts);
 }
 async put(key:string,bytes:Buffer) {
  try {
   const file=await this.path(key,true);
   const handle=await open(file,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|(constants.O_NOFOLLOW??0),0o600);
   try {await handle.writeFile(bytes);await handle.sync();} finally {await handle.close();}
  } catch {throw unavailable();}
 }
 async get(key:string,size:number) {
  try {
   const handle=await open(await this.path(key),constants.O_RDONLY|(constants.O_NOFOLLOW??0));
   try {
    const stat=await handle.stat();
    if (!stat.isFile() || stat.size!==size) throw unavailable();
    return handle.createReadStream();
   } catch(error) {await handle.close();throw error;}
  } catch(error) {
   if ((error as NodeJS.ErrnoException).code==="ENOENT") throw new NotFoundException();
   throw unavailable();
  }
 }
 async delete(key:string) {
  try {await unlink(await this.path(key));}
  catch(error) {if ((error as NodeJS.ErrnoException).code!=="ENOENT") throw unavailable();}
 }
 listMaterials(after?:string) { return this.list("materials",after); }
 listSubmissions(after?:string) { return this.list("submissions",after); }
 private async *list(area:Area,after?:string) {
  const pattern=patternFor(area);
  if (after && !pattern.test(after)) throw unavailable();
  const root=join(this.root,"academic",area);
  async function* walk(dir:string, relative:string, depth:number):AsyncGenerator<{key:string;modified:Date}> {
   const entries=await readdir(dir,{withFileTypes:true}).catch(error=>{if(error.code==="ENOENT") return [];throw error;});
   for (const entry of entries.sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)) {
    const path=join(dir,entry.name), key=`${relative}/${entry.name}`;
    if (depth>0 && entry.isDirectory()) yield* walk(path,key,depth-1);
    if (depth===0 && entry.isFile() && pattern.test(key) && (!after || key>after)) {
     const stat=await lstat(path).catch(error=>{if(error.code!=="ENOENT") throw error;});
     if (stat?.isFile()) yield {key,modified:stat.mtime};
    }
   }
  }
  for (const directory of [this.root,join(this.root,"academic"),root]) {
   const stat=await lstat(directory).catch(error=>{if(error.code!=="ENOENT") throw error;});
   if (!stat) return;
   if (!stat.isDirectory()) throw unavailable();
  }
  yield* walk(root,`academic/${area}`,area==="materials"?2:5);
 }
}

type Command=PutObjectCommand|GetObjectCommand|DeleteObjectCommand|ListObjectsV2Command;
export type ExecuteStorage=(command:Command, signal:AbortSignal)=>Promise<unknown>;
export class S3ObjectStorage implements ObjectStorage {
 constructor(private readonly bucket:string,private readonly execute:ExecuteStorage) {}
 private async send(command:Command) {
  try {return await this.execute(command,AbortSignal.timeout(20_000));}
  catch(error) {
   if ((error as {name?:string}).name==="NoSuchKey") throw new NotFoundException();
   throw unavailable();
  }
 }
 async put(key:string,bytes:Buffer,mime:string,sha256?:string) {
  segments(key);
  await this.send(new PutObjectCommand({Bucket:this.bucket,Key:key,Body:bytes,ContentType:mime,
   ContentLength:bytes.length,ChecksumSHA256:sha256 ? Buffer.from(sha256,"hex").toString("base64") : undefined,CacheControl:"private, no-store",ServerSideEncryption:"AES256",IfNoneMatch:"*"}));
 }
 async get(key:string,size:number) {
  segments(key);
  const result=await this.send(new GetObjectCommand({Bucket:this.bucket,Key:key})) as {ContentLength?:number;Body?:Readable};
  if (!(result.Body instanceof Readable) || result.ContentLength!==size) {
   result.Body?.destroy?.();throw unavailable();
  }
  return result.Body;
 }
 async delete(key:string) {
  segments(key);
  await this.send(new DeleteObjectCommand({Bucket:this.bucket,Key:key}));
 }
 listMaterials(after?:string) { return this.list("materials",after); }
 listSubmissions(after?:string) { return this.list("submissions",after); }
 private async *list(area:Area,after?:string) {
  const pattern=patternFor(area);
  if (after && !pattern.test(after)) throw unavailable();
  let cursor:string|undefined;
  do {
   const result=await this.send(new ListObjectsV2Command({Bucket:this.bucket,Prefix:`academic/${area}/`,MaxKeys:100,StartAfter:cursor?undefined:after,ContinuationToken:cursor})) as {
    Contents?:{Key?:string;LastModified?:Date}[];IsTruncated?:boolean;NextContinuationToken?:string};
   for (const item of result.Contents??[]) if (item.Key && pattern.test(item.Key) && (!after || item.Key>after) && item.LastModified) yield {key:item.Key,modified:item.LastModified};
   const next=result.IsTruncated ? result.NextContinuationToken : undefined;
   if (result.IsTruncated && (!next || next===cursor)) throw unavailable();
   cursor=next;
  } while(cursor);
 }
}

export function configuredStorage(env:NodeJS.ProcessEnv=process.env):ObjectStorage|undefined {
 const driver=env.ACADEMIC_STORAGE_DRIVER??(env.NODE_ENV==="production"?"disabled":"local");
 if (driver==="local" && env.NODE_ENV!=="production") return new LocalObjectStorage(env.ACADEMIC_LOCAL_DIR||join(process.cwd(),".data"));
 if (driver!=="s3" || !env.S3_ACADEMIC_BUCKET || !env.AWS_REGION) return undefined;
 const client=new S3Client({region:env.AWS_REGION,maxAttempts:1});
 return new S3ObjectStorage(env.S3_ACADEMIC_BUCKET,(command,signal)=>{
  const options={abortSignal:signal};
  if(command instanceof PutObjectCommand) return client.send(command,options);
  if(command instanceof GetObjectCommand) return client.send(command,options);
  if(command instanceof DeleteObjectCommand) return client.send(command,options);
  return client.send(command,options);
 });
}

@Injectable()
export class AcademicStorage {
 private readonly driver=configuredStorage();
 get objects() {
  if (!this.driver) throw new ServiceUnavailableException({code:"INTEGRATION_NOT_CONFIGURED"});
  return this.driver;
 }
}
