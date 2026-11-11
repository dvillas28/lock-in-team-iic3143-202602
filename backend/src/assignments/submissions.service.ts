import { ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { AcademicStorage, assertSubmissionKey } from "../academic-files/object-storage";
import type { Upload } from "../academic-files/file-format";
import { AuditService } from "../audit/audit.service";
import { requirePermission } from "../courses/course-access";
import { DatabaseService } from "../database/database.service";
import { gradebookScope, type GradebookScope } from "../gradebook/gradebook-access";
import { gradeResults } from "../gradebook/gradebook-results";
import { assignmentForSubmission, reviewSections, studentSections } from "./submission-access";
import { attemptDto, attemptFields, receipt } from "./submission-results";
import { invalid, submissionInput } from "./submission-validation";
import { assignmentGradeDto } from "./submission-grades";

type Input = Awaited<ReturnType<typeof submissionInput>>;
const conflict = (code:string) => new ConflictException({code});
const unavailable = () => new ServiceUnavailableException({code:"SUBMISSION_STORAGE_UNAVAILABLE"});

async function checkSubmission(c: PoolClient, scope: GradebookScope, assignmentId: string, input: Input) {
 const a = await assignmentForSubmission(c,scope,assignmentId);
 const {institution_id:tenant,user_id:actor} = scope.member;
 requirePermission(studentSections(scope,a.section_id).includes(input.sectionId));
 const existing = (await c.query(`SELECT id,submit_digest FROM public.assignment_attempts
  WHERE institution_id=$1 AND assignment_id=$2 AND student_id=$3 AND submit_key=$4`,
  [tenant,assignmentId,actor,input.key])).rows[0];
 if (existing) {
  if (existing.submit_digest!==input.digest) throw conflict("IDEMPOTENCY_CONFLICT");
  return {existing:await receipt(c,tenant,existing.id)};
 }
 if (a.status!=="published") throw new NotFoundException();
 const extensions = new Set<string>(a.allowed_extensions.map((ext:string)=>ext.replace(/^\./,"").toLowerCase()));
 if ((extensions.size || a.allow_written_response) && input.uploads.some(file=>!extensions.has(file.extension))) throw invalid("SUBMISSION_FORMAT_NOT_ALLOWED");
 if (input.writtenResponse!==null && !a.allow_written_response) throw invalid("SUBMISSION_TEXT_NOT_ALLOWED");
 const timing = (await c.query(`SELECT to_char(stamp AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS stamp,
  stamp<a.available_from AS early,stamp>a.available_until AS closed,
  coalesce(stamp>a.due_at,false) AS late,(SELECT count(*)::int FROM public.assignment_attempts
   WHERE institution_id=$1 AND assignment_id=$2 AND student_id=$3) AS used
  FROM public.assignments a CROSS JOIN (SELECT clock_timestamp() AS stamp) t WHERE a.institution_id=$1 AND a.id=$2`,
  [tenant,assignmentId,actor])).rows[0];
 if (timing.early) throw conflict("SUBMISSION_NOT_OPEN");
 if (timing.closed) throw conflict("SUBMISSION_CLOSED");
 if (a.max_attempts!==null && timing.used>=a.max_attempts) throw conflict("SUBMISSION_ATTEMPTS_EXHAUSTED");
 if (timing.used!==input.expectedAttempts) throw conflict("SUBMISSION_ATTEMPTS_CHANGED");
 return {timing};
}

@Injectable()
export class SubmissionsService {
 constructor(private readonly db: DatabaseService, private readonly audit: AuditService, private readonly storage: AcademicStorage) {}

 async mine(actor: string, slug: string, course: string, id: string) {
  return this.db.withInstitution(actor,slug,async c=>{
   const scope=await gradebookScope(c,actor,slug,course), tenant=scope.member.institution_id;
   const a=await assignmentForSubmission(c,scope,id), sections=studentSections(scope,a.section_id);
   requirePermission(sections.length>0);
   if (a.status!=="published") throw new NotFoundException();
   const history=await c.query(`SELECT ${attemptFields} FROM public.assignment_attempts a
    WHERE a.institution_id=$1 AND a.assignment_id=$2 AND a.student_id=$3 ORDER BY a.attempt_number DESC`,[tenant,id,actor]);
   const grade=(await c.query(`${gradeResults} WHERE g.institution_id=$1 AND g.assignment_id=$2
    AND g.student_id=$3 AND g.published_at IS NOT NULL`,[tenant,id,actor])).rows[0];
   const {serverNow}=(await c.query('SELECT clock_timestamp() AS "serverNow"')).rows[0];
   return {attempts:history.rows.map(attemptDto),sections,usedAttempts:history.rows.length,serverNow,
    grade:grade ? assignmentGradeDto(grade) : null};
  });
 }

 async submit(actor: string, slug: string, course: string, assignment: string, body: unknown, files: Upload[]) {
  const input=await submissionInput(body,files);
  const preflight=await this.db.withInstitution(actor,slug,async c=>{
   const scope=await gradebookScope(c,actor,slug,course);
   return {...await checkSubmission(c,scope,assignment,input),tenant:scope.member.institution_id};
  });
  if (preflight.existing) return preflight.existing;

  const id=randomUUID(), tenant=preflight.tenant;
  const uploads=input.uploads.map(file=>{
   const fileId=randomUUID();
   const key=`academic/submissions/${tenant}/${course}/${assignment}/${actor}/${id}/${fileId}`;
   assertSubmissionKey(key);
   return {...file,id:fileId,key};
  });
  // Upload outside the course lock. Only this request can use these random keys.
  const store=uploads.length ? this.storage.objects : undefined;
  const uploaded: string[]=[];
  const discard=()=>Promise.allSettled(uploaded.map(key=>store!.delete(key)));
  try {
   // The parser and validator cap aggregate memory; parallel writes cap wait time.
   const results=await Promise.allSettled(uploads.map(async file=>{
    await store!.put(file.key,file.bytes,file.mime,file.sha256);
    uploaded.push(file.key);
   }));
   if (results.some(result=>result.status==="rejected")) throw unavailable();
  } catch {
   await discard();
   throw unavailable();
  }

  let mayReferenceObjects=false;
  try {
   const result=await this.db.withInstitution(actor,slug,async c=>{
    const scope=await gradebookScope(c,actor,slug,course);
    if (scope.member.institution_id!==tenant) throw new NotFoundException();
    const checked=await checkSubmission(c,scope,assignment,input);
    if (checked.existing) return checked.existing;
    const {timing}=checked;
    await c.query(`INSERT INTO public.assignment_attempts
     (id,institution_id,course_id,assignment_id,section_id,student_id,attempt_number,submitted_at,is_late,written_response,submit_key,submit_digest,file_count)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
     [id,tenant,course,assignment,input.sectionId,actor,timing.used+1,timing.stamp,timing.late,input.writtenResponse,input.key,input.digest,uploads.length]);
    for (const [position,file] of uploads.entries()) {
     await c.query(`INSERT INTO public.assignment_attempt_files
      (id,institution_id,attempt_id,file_key,file_name,media_type,byte_size,sha256,position)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[file.id,tenant,id,file.key,file.name,file.mime,file.size,file.sha256,position]);
    }
    const attempt=await receipt(c,tenant,id);
    await this.audit.record(c,{institutionId:tenant,actorUserId:actor,courseId:course,sectionId:input.sectionId,
     resourceType:"assignmentAttempt",resourceId:id,action:"assignment.submitted",before:null,
     after:{...attempt,assignmentId:assignment,studentId:actor,fileCount:uploads.length,hasWrittenResponse:input.writtenResponse!==null}});
    // From here a connection failure can leave COMMIT indeterminate. Maintenance checks DB references before deletion.
    mayReferenceObjects=true;
    return attempt;
   });
   return result;
  } finally {
   if (!mayReferenceObjects) await discard();
  }
 }

 async download(actor: string, slug: string, course: string, id: string, file: string) {
  const item=await this.db.withInstitution(actor,slug,async c=>{
   const scope=await gradebookScope(c,actor,slug,course), tenant=scope.member.institution_id;
   const assignment=await assignmentForSubmission(c,scope,id);
   const review=reviewSections(scope,assignment.section_id);
   const own=studentSections(scope,assignment.section_id).length>0;
   const result=await c.query(`SELECT f.* FROM public.assignment_attempt_files f JOIN public.assignment_attempts a
    ON (a.institution_id,a.id)=(f.institution_id,f.attempt_id)
    WHERE a.institution_id=$1 AND a.assignment_id=$2 AND f.id=$3
     AND ($4::boolean OR a.section_id=ANY($5::uuid[]) OR ($6::boolean AND a.student_id=$7))`,
    [tenant,id,file,review.global,review.sections,own,actor]);
   if (!result.rows[0]) throw new NotFoundException();
   return result.rows[0];
  });
  assertSubmissionKey(item.file_key);
  try {
   const stream=await this.storage.objects.get(item.file_key,item.byte_size);
   const chunks: Buffer[]=[];
   const hash=createHash("sha256");
   let size=0;
   for await (const chunk of stream) {
    const bytes=Buffer.from(chunk);
    size+=bytes.length;
    if (size>item.byte_size) throw unavailable();
    hash.update(bytes);
    chunks.push(bytes);
   }
   if (size!==item.byte_size || hash.digest("hex")!==item.sha256) throw unavailable();
   return {bytes:Buffer.concat(chunks,size),name:item.file_name as string,mime:item.media_type as string};
  } catch {
   throw unavailable();
  }
 }
}
