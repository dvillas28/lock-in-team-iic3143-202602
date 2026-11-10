import type { ApiClient } from "./client.ts";
import type { components } from "./schema";
import { ApiResponseError } from "./errors.ts";
import { date, number } from "../gradebook/validation.ts";
import { path, isId } from "../courses/validation.ts";
import { isRecord } from "../auth/validation.ts";

export type Submission = components["schemas"]["AssignmentSubmission"];
export type SubmissionFile = components["schemas"]["AssignmentSubmissionFile"];
export type SubmissionGrade = components["schemas"]["AssignmentSubmissionGrade"];
export type RosterEntry = components["schemas"]["AssignmentRosterEntry"];
export type AssignmentPublication = components["schemas"]["PublishAssignmentGrades"];
export type DraftInput = components["schemas"]["AssignmentDraftInput"];
export type SubmissionScope = {slug:string;courseId:string;assignmentId:string};
const base="/api/v1/institution/{institutionSlug}/courses/{courseId}/assignments/{assignmentId}";
const params=({slug,courseId,assignmentId}:SubmissionScope)=>({path:{...path(slug,{courseId,assignmentId}),courseId,assignmentId}});

function submission(value: unknown): Submission {
 if (!isRecord(value) || !isId(value.id) || !isId(value.sectionId) || !Number.isSafeInteger(value.attemptNumber) ||
  Number(value.attemptNumber)<1 || !date(value.submittedAt) || typeof value.isLate!=="boolean" ||
  (value.writtenResponse!==null && typeof value.writtenResponse!=="string") || !Array.isArray(value.files) ||
  value.files.some(file=>!isRecord(file) || !isId(file.id) || typeof file.name!=="string" || typeof file.mediaType!=="string" ||
   !number(file.byteSize,1,10*1024*1024) || typeof file.sha256!=="string" || !/^[a-f0-9]{64}$/.test(file.sha256))) {
  throw new ApiResponseError();
 }
 return value as Submission;
}

function grade(value: unknown, scope: SubmissionScope): SubmissionGrade {
 if (!isRecord(value) || value.assignmentId!==scope.assignmentId || !isId(value.id) || !isId(value.attemptId) ||
  !isId(value.sectionId) || !isId(value.studentId) || !isId(value.gradeItemId) ||
  !number(value.pointsEarned,0,999999.99) || !(value.grade===null && value.scorePercent===null ||
   number(value.grade,1,7) && number(value.scorePercent)) || !date(value.updatedAt) ||
  (value.feedback!==null && typeof value.feedback!=="string") || (value.publishedAt!==null && !date(value.publishedAt)) ||
  (value.revisionId!==null && !isId(value.revisionId)) || (value.revisedAt!==null && !date(value.revisedAt))) throw new ApiResponseError();
 return value as SubmissionGrade;
}

export async function mySubmissions(client: ApiClient, scope: SubmissionScope) {
 const {data}=await client.GET(`${base}/my-submissions`,{params:params(scope)});
 if (!data || !Array.isArray(data.attempts) || !Array.isArray(data.sections) || data.sections.some(id=>!isId(id)) ||
  data.usedAttempts!==data.attempts.length || !date(data.serverNow)) throw new ApiResponseError();
 const result=data.grade===null ? null : grade(data.grade,scope);
 if (result && !result.publishedAt) throw new ApiResponseError();
 return {...data,attempts:data.attempts.map(submission),grade:result,clockOffset:Date.parse(data.serverNow)-Date.now()};
}

export type SubmissionRequest = {key:string;sectionId:string;expectedAttempts:number;files:File[];writtenResponse:string};
export function submissionForm(request: SubmissionRequest) {
 const form=new FormData();
 form.append("idempotencyKey",request.key);
 form.append("sectionId",request.sectionId);
 form.append("expectedAttempts",String(request.expectedAttempts));
 if (request.writtenResponse.trim()) form.append("writtenResponse",request.writtenResponse);
 for (const file of request.files) form.append("files",file);
 return form;
}

export async function submitAttempt(client: ApiClient, scope: SubmissionScope, request: SubmissionRequest, form: FormData) {
 const {data}=await client.POST(`${base}/my-submissions`,{
  params:params(scope),body:{idempotencyKey:request.key,sectionId:request.sectionId,expectedAttempts:String(request.expectedAttempts)},
  bodySerializer:()=>form,
 });
 const saved=submission(data);
 if (saved.sectionId!==request.sectionId || saved.attemptNumber!==request.expectedAttempts+1) throw new ApiResponseError();
 return saved;
}

export async function submissionRoster(client: ApiClient, scope: SubmissionScope) {
 const {data}=await client.GET(`${base}/submissions`,{params:params(scope)});
 if (!data || !isId(data.gradeItemId) || !Array.isArray(data.students) || data.students.some(entry=>
  !isId(entry?.studentId) || !isId(entry.sectionId) || typeof entry.name!=="string" || typeof entry.sectionCode!=="string" ||
  !["none","draft","published"].includes(entry.gradeStatus) ||
  (entry.draft!==null && (!isId(entry.draft?.id) || !date(entry.draft.expectedUpdatedAt))))) throw new ApiResponseError();
 return data;
}

export async function reviewSubmission(client: ApiClient, scope: SubmissionScope, student: RosterEntry) {
 const {studentId,sectionId}=student;
 const {data}=await client.GET(`${base}/submission-review`,{params:{...params(scope),query:{studentId,sectionId}}});
 if (!data || !Array.isArray(data.attempts)) throw new ApiResponseError();
 const attempts=data.attempts.map(submission), result=data.grade===null ? null : grade(data.grade,scope);
 if (attempts.some(a=>a.sectionId!==sectionId) || result && (result.studentId!==studentId || result.sectionId!==sectionId ||
  !attempts.some(a=>a.id===result.attemptId))) throw new ApiResponseError();
 return {attempts,grade:result};
}

export async function saveDraft(client: ApiClient, scope: SubmissionScope, attemptId: string, body: DraftInput) {
 const {data}=await client.PUT(`${base}/submissions/{attemptId}/grade`,{
  params:{path:{...params(scope).path,attemptId}},body,
 });
 const result=grade(data,scope);
 if (result.attemptId!==attemptId || result.publishedAt!==null) throw new ApiResponseError();
 return result;
}

export async function publishAssignmentGrades(client: ApiClient, scope: SubmissionScope, body: AssignmentPublication, key: string) {
 const {data}=await client.POST("/api/v1/institution/{institutionSlug}/courses/{courseId}/gradebook/publications",{
  params:{path:params(scope).path,header:{"Idempotency-Key":key}},body,
 });
 if (!data || data.publishedCount!==body.grades.length || !date(data.publishedAt)) throw new ApiResponseError();
 return data;
}

export async function downloadSubmissionFile(client: ApiClient, scope: SubmissionScope, file: SubmissionFile) {
 const {data}=await client.GET(`${base}/submission-files/{fileId}`,{
  params:{path:{...params(scope).path,fileId:file.id}},parseAs:"blob",headers:{Accept:"*/*"},
 });
 if (!(data instanceof Blob) || data.size!==file.byteSize || data.type.split(";")[0]!==file.mediaType) throw new ApiResponseError();
 return data;
}
