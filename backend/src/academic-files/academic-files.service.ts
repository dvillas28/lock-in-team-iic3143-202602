import {BadRequestException, ConflictException, Injectable, NotFoundException, UnsupportedMediaTypeException} from "@nestjs/common";
import {createHash,randomUUID} from "node:crypto";
import type {Readable} from "node:stream";
import type {PoolClient} from "pg";
import {DatabaseService} from "../database/database.service";
import {AuditService} from "../audit/audit.service";
import {requirePermission} from "../courses/course-access";
import {contentScope,visibleModule,materialDto,type ContentScope,type MaterialRow} from "../content/content-access";
import {noBody,object,title} from "../content/content-validation";
import {uuid} from "../courses/validation";
import {canAuthorQuiz,visibleQuiz,visibilityArgs,visibleSql} from "../quizzes/quiz-access";
import {AcademicStorage,objectKey} from "./object-storage";
import {previewType,uploadLimits,validateUpload,type Upload} from "./file-format";

interface FileRow extends Omit<MaterialRow,"kind"|"markdown_body"> {
 kind:"file"; position:number; file_key:string; file_name:string; media_type:string; byte_size:number; upload_digest:string|null;
}
type ResourceRow = FileRow | (MaterialRow & {position:number}) |
 {kind:"quiz";id:string;module_id:string;quiz_id:string;quiz_title:string;quiz_published_at:Date|null;quiz_section_id:string|null;position:number};
const fileDto=(row:FileRow)=>({
 id:row.id,moduleId:row.module_id,kind:row.kind,title:row.title,position:row.position,
 publishedAt:row.published_at,createdBy:row.created_by,fileName:row.file_name,
 mediaType:row.media_type,byteSize:row.byte_size,preview:previewType(row.media_type),
});
const resourceDto=(row:ResourceRow,s:ContentScope)=>row.kind==="file" ? fileDto(row) : row.kind==="markdown" ?
 {...materialDto(row),position:row.position} :
 {id:row.id,moduleId:row.module_id,kind:row.kind,title:row.quiz_title,position:row.position,
  quizId:row.quiz_id,publishedAt:row.quiz_published_at,canUnlink:canAuthorQuiz(s,row.quiz_section_id)};

function multipartFields(body:unknown,allowed:string[]) {
 if (body===undefined || (body && typeof body==="object" && !Array.isArray(body) && Object.keys(body).length===0)) return {};
 return object(body,allowed);
}

async function fileRow(c:PoolClient,s:ContentScope,id:string) {
 const result=await c.query<FileRow>(`SELECT a.* FROM public.materials a
  JOIN public.course_modules m ON m.institution_id=a.institution_id AND m.id=a.module_id
  WHERE a.institution_id=$1 AND m.course_id=$2 AND a.id=$3 AND a.kind='file'
   AND ($4::boolean OR (a.published_at IS NOT NULL AND m.published_at IS NOT NULL))`,
 [s.member.institution_id,s.courseId,id,s.teacher]);
 if (!result.rows[0]) throw new NotFoundException();
 return result.rows[0];
}

@Injectable()
export class AcademicFilesService {
 private readonly limits=uploadLimits();
 constructor(private readonly db:DatabaseService,private readonly audit:AuditService,private readonly storage:AcademicStorage) {}

 private async record(c:PoolClient,s:ContentScope,actor:string,id:string,action:string,before:FileRow|null,after:FileRow|null) {
  await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,courseId:s.courseId,
   resourceType:"academicFile",resourceId:id,action,before:before&&fileDto(before),after:after&&fileDto(after)});
 }

 async list(actor:string,slug:string,moduleId:string) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await contentScope(c,actor,slug,moduleId,"module");
   await visibleModule(c,s,moduleId);
   const [tenant,course,owner,teacher,teachers,sections]=visibilityArgs(s);
   const result=await c.query<ResourceRow>(`SELECT a.*,q.title AS quiz_title,q.published_at AS quiz_published_at,q.section_id AS quiz_section_id
    FROM public.materials a LEFT JOIN public.quizzes q ON q.institution_id=a.institution_id AND q.id=a.quiz_id AND q.course_id=$2
    WHERE a.institution_id=$1 AND a.module_id=$3
     AND ((a.kind<>'quiz' AND ($5::boolean OR a.published_at IS NOT NULL))
       OR (a.kind='quiz' AND ${visibleSql()}))
    ORDER BY a.position`,[tenant,course,moduleId,owner,teacher,teachers,sections]);
   return {items:result.rows.map(row=>resourceDto(row,s)),limits:this.limits};
  });
 }

 async get(actor:string,slug:string,id:string) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await contentScope(c,actor,slug,id,"material");
   return fileDto(await fileRow(c,s,id));
  });
 }

 async create(actor:string,slug:string,moduleId:string,file:Upload|undefined,body:unknown,operation?:string) {
  const authorize=async (c:PoolClient)=>{
   const s=await contentScope(c,actor,slug,moduleId,"module");
   await visibleModule(c,s,moduleId);requirePermission(s.teacher);
   return s;
  };
  const scope=await this.db.withInstitution(actor,slug,authorize);
  const dto=multipartFields(body,["title"]);
  const upload=await validateUpload(file,this.limits), name=title(dto.title??[...upload.name].slice(0,200).join(""));
  const uploadId=operation===undefined ? null : uuid(operation);
  const digest=uploadId && createHash("sha256").update(JSON.stringify([name,upload.name,upload.mime])).update(upload.bytes).digest("hex");
  async function replay(c:PoolClient,tenant:string) {
   if (!uploadId) return undefined;
   const row=(await c.query<FileRow>(`SELECT * FROM public.materials WHERE institution_id=$1
    AND module_id=$2 AND created_by=$3 AND upload_id=$4`,[tenant,moduleId,actor,uploadId])).rows[0];
   if (row && row.upload_digest!==digest) throw new ConflictException();
   return row;
  }
  if (uploadId) {
   const previous=await this.db.withInstitution(actor,slug,async c=>replay(c,(await authorize(c)).member.institution_id));
   if (previous) return fileDto(previous);
  }
  const tenant=scope.member.institution_id;
  const id=randomUUID(), key=objectKey("materials",tenant,id), store=this.storage.objects;
  await store.put(key,upload.bytes,upload.mime);
  // A lost COMMIT acknowledgement is ambiguous. The maintenance command checks DB before reclaiming a key.
  const saved=await this.db.withInstitution(actor,slug,async c=>{
   const s=await authorize(c);
   if (s.member.institution_id!==tenant) throw new NotFoundException();
   const previous=await replay(c,tenant);
   if (previous) return previous;
   const result=await c.query<FileRow>(`INSERT INTO public.materials
    (id,institution_id,module_id,title,kind,created_by,file_key,file_name,media_type,byte_size,upload_id,upload_digest)
    VALUES($1,$2,$3,$4,'file',$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
   [id,tenant,moduleId,name,actor,key,upload.name,upload.mime,upload.size,uploadId,digest]);
   const row=result.rows[0];
   await this.record(c,s,actor,id,"academicFile.created",null,row);
   return row;
  });
  if (saved.id!==id) await store.delete(key).catch(()=>undefined);
  return fileDto(saved);
 }

 async replace(actor:string,slug:string,id:string,file:Upload|undefined,body:unknown) {
  const before=await this.db.withInstitution(actor,slug,async c=>{
   const s=await contentScope(c,actor,slug,id,"material"), row=await fileRow(c,s,id);
   requirePermission(s.teacher);
   return {row,institution:s.member.institution_id};
  });
  multipartFields(body,[]);
  const upload=await validateUpload(file,this.limits), key=objectKey("materials",before.institution,id), store=this.storage.objects;
  await store.put(key,upload.bytes,upload.mime);
  const saved=await this.db.withInstitution(actor,slug,async c=>{
   const s=await contentScope(c,actor,slug,id,"material"), row=await fileRow(c,s,id);
   requirePermission(s.teacher);
   if (row.file_key!==before.row.file_key) throw new ConflictException();
   const result=await c.query<FileRow>(`UPDATE public.materials SET file_key=$1,file_name=$2,media_type=$3,byte_size=$4
    WHERE institution_id=$5 AND id=$6 RETURNING *`,[key,upload.name,upload.mime,upload.size,s.member.institution_id,id]);
   await this.record(c,s,actor,id,"academicFile.replaced",row,result.rows[0]);
   return fileDto(result.rows[0]);
  });
  await store.delete(before.row.file_key).catch(()=>undefined);
  return saved;
 }

 async update(actor:string,slug:string,id:string,body:unknown,publication?:boolean) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await contentScope(c,actor,slug,id,"material"), before=await fileRow(c,s,id);
   requirePermission(s.teacher);
   if (publication!==undefined) noBody(body);
   const name=publication===undefined ? title(object(body,["title"],["title"]).title) : before.title;
   if (publication===undefined ? name===before.title : publication===(before.published_at!==null)) return fileDto(before);
   const result=await c.query<FileRow>(`UPDATE public.materials SET title=$1,
    published_at=CASE WHEN $2::boolean IS NULL THEN published_at WHEN $2 THEN clock_timestamp() ELSE NULL END
    WHERE institution_id=$3 AND id=$4 RETURNING *`,[name,publication??null,s.member.institution_id,id]);
   await this.record(c,s,actor,id,publication===undefined ? "academicFile.renamed" : publication ? "academicFile.published" : "academicFile.unpublished",before,result.rows[0]);
   return fileDto(result.rows[0]);
  });
 }

 async remove(actor:string,slug:string,id:string) {
  const key=await this.db.withInstitution(actor,slug,async c=>{
   const s=await contentScope(c,actor,slug,id,"material"), before=await fileRow(c,s,id);
   requirePermission(s.teacher);
   await c.query("DELETE FROM public.materials WHERE institution_id=$1 AND id=$2",[s.member.institution_id,id]);
   await this.record(c,s,actor,id,"academicFile.deleted",before,null);
   return before.file_key;
  });
  try {await this.storage.objects.delete(key);} catch { /* Operator cleanup retries when storage is restored. */ }
 }

 async content(actor:string,slug:string,id:string,download:boolean) {
  let stream:Readable|undefined;
  try {
   return await this.db.withInstitution(actor,slug,async c=>{
    const s=await contentScope(c,actor,slug,id,"material"), row=await fileRow(c,s,id);
    if (!download && !previewType(row.media_type)) throw new UnsupportedMediaTypeException();
    stream=await this.storage.objects.get(row.file_key,row.byte_size);
    return {stream,name:row.file_name,mime:row.media_type,size:row.byte_size};
   });
  } catch(error) {stream?.destroy();throw error;}
 }

 async reorder(actor:string,slug:string,moduleId:string,body:unknown) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await contentScope(c,actor,slug,moduleId,"module");
   await visibleModule(c,s,moduleId);requirePermission(s.teacher);
   const dto=object(body,["resourceId","neighborId","direction"],["resourceId","neighborId","direction"]);
   const id=uuid(dto.resourceId), neighborId=uuid(dto.neighborId);
   if (dto.direction!==1 && dto.direction!==-1) throw new BadRequestException();
   const [tenant,course,owner,teacher,teachers,sections]=visibilityArgs(s);
   const rows=(await c.query<{id:string;position:number}>(`SELECT a.id,a.position FROM public.materials a
    LEFT JOIN public.quizzes q ON q.institution_id=a.institution_id AND q.id=a.quiz_id AND q.course_id=$2
    WHERE a.institution_id=$1 AND a.module_id=$3 AND (a.kind<>'quiz' OR ${visibleSql()}) ORDER BY a.position`,
   [tenant,course,moduleId,owner,teacher,teachers,sections])).rows;
   const index=rows.findIndex(row=>row.id===id), item=rows[index], neighbor=rows[index+dto.direction];
   if (!item || neighbor?.id!==neighborId) throw new ConflictException();
   await c.query("SET CONSTRAINTS materials_position_key DEFERRED");
   await c.query(`UPDATE public.materials SET position=CASE WHEN id=$3 THEN $5::int ELSE $6::int END
    WHERE institution_id=$1 AND module_id=$2 AND id IN ($3,$4)`,[tenant,moduleId,id,neighborId,neighbor.position,item.position]);
   await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,courseId:s.courseId,resourceType:"moduleOrder",
    resourceId:moduleId,action:"module.resourcesReordered",before:{modules:[item,neighbor]},
    after:{modules:[{id,position:neighbor.position},{id:neighborId,position:item.position}]}});

  });
 }

 async linkQuiz(actor:string,slug:string,moduleId:string,body:unknown) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await contentScope(c,actor,slug,moduleId,"module");
   await visibleModule(c,s,moduleId);requirePermission(s.teacher);
   const quizId=uuid(object(body,["quizId"],["quizId"]).quizId);
   const quiz=await visibleQuiz(c,s,quizId);
   requirePermission(canAuthorQuiz(s,quiz.section_id));
   const id=randomUUID();
   await c.query(`INSERT INTO public.materials(id,institution_id,module_id,title,kind,created_by,quiz_id,quiz_course_id)
    VALUES($1,$2,$3,$4,'quiz',$5,$6,$7)`,[id,s.member.institution_id,moduleId,quiz.title,actor,quizId,s.courseId]);
   await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,courseId:s.courseId,sectionId:quiz.section_id,
    resourceType:"moduleQuiz",resourceId:id,action:"module.quizLinked",before:null,after:{moduleId,quizId}});
  });
 }

 async unlinkQuiz(actor:string,slug:string,moduleId:string,id:string) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await contentScope(c,actor,slug,moduleId,"module");
   await visibleModule(c,s,moduleId);requirePermission(s.teacher);
   const row=(await c.query<{quiz_id:string}>("SELECT quiz_id FROM public.materials WHERE institution_id=$1 AND module_id=$2 AND id=$3 AND kind='quiz'",
    [s.member.institution_id,moduleId,id])).rows[0];
   if (!row) throw new NotFoundException();
   const quiz=await visibleQuiz(c,s,row.quiz_id);
   requirePermission(canAuthorQuiz(s,quiz.section_id));
   await c.query("DELETE FROM public.materials WHERE institution_id=$1 AND module_id=$2 AND id=$3",[s.member.institution_id,moduleId,id]);
   await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,courseId:s.courseId,sectionId:quiz.section_id,
    resourceType:"moduleQuiz",resourceId:id,action:"module.quizUnlinked",before:{moduleId,quizId:row.quiz_id},after:null});
  });
 }
}
