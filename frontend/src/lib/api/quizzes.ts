import type { ApiClient } from "./client.ts";
import { ApiResponseError } from "./errors.ts";
import { isRecord } from "../auth/validation.ts";
import { path, list, FieldError, isId } from "../courses/validation.ts";
import { quizDto, quizList, quizInput, gradeItem, summary, type Summary, type SafeQuiz, type Create, type Update, type Authoring } from "../quizzes/validation.ts";
export async function listCourseQuizzes(client: ApiClient, slug: string, courseId: string, sectionId?: string) {
  const p = path(slug, {courseId, ...(sectionId === undefined ? {} : {sectionId})});
  const result = await client.GET("/api/v1/institution/{institutionSlug}/courses/{courseId}/quizzes", {params:{path:{...p,courseId},query:sectionId === undefined ? {} : {sectionId}}});
  return quizList(result.data,courseId);
}
export function getQuiz(client: ApiClient, slug: string, courseId: string | undefined, quizId: string): Promise<SafeQuiz>;
export function getQuiz(client: ApiClient, slug: string, courseId: string | undefined, quizId: string, metadata: true): Promise<Summary>;
export async function getQuiz(client: ApiClient, slug: string, courseId: string | undefined, quizId: string, metadata = false) {
  const result = await client.GET("/api/v1/institution/{institutionSlug}/quizzes/{quizId}", {params:{path:{...path(slug,{...(courseId === undefined ? {} : {courseId}),quizId}),quizId}}});
  const resolved = courseId ?? (isRecord(result.data) && isId(result.data.courseId) ? result.data.courseId : undefined);
  if (!resolved) throw new ApiResponseError();
  return metadata ? summary(result.data,resolved,quizId) : quizDto(result.data,resolved,quizId);
}
export async function getQuizAuthoringView(client: ApiClient, slug: string, courseId: string, quizId: string) {
  const result = await client.GET("/api/v1/institution/{institutionSlug}/quizzes/{quizId}/authoring", {params:{path:{...path(slug,{courseId,quizId}),quizId}}});
  return quizDto(result.data,courseId,quizId,true);
}
export async function createQuiz(client: ApiClient, slug: string, courseId: string, input: Create) {
  const body = quizInput(input) as Create;
  const result = await client.POST("/api/v1/institution/{institutionSlug}/courses/{courseId}/quizzes", {params:{path:{...path(slug,{courseId}),courseId}},body});
  const saved = quizDto(result.data,courseId,undefined,true);
  if (saved.status !== "draft" || saved.sectionId !== (body.sectionId ?? null)) throw new ApiResponseError();
  return saved;
}
export async function updateQuiz(client: ApiClient, slug: string, current: Authoring, input: Update) {
  if (current.status !== "draft") throw new FieldError("form","El quiz publicado es inmutable.");
  const body = quizInput(input,current);
  const result = await client.PATCH("/api/v1/institution/{institutionSlug}/quizzes/{quizId}", {params:{path:{...path(slug,{courseId:current.courseId,quizId:current.id}),quizId:current.id}},body});
  const saved = quizDto(result.data,current.courseId,current.id,true);
  if (saved.status !== "draft" || saved.sectionId !== (body.sectionId === undefined ? current.sectionId : body.sectionId)) throw new ApiResponseError();
  return saved;
}
export async function publishQuiz(client: ApiClient, slug: string, courseId: string, quizId: string) {
  const result = await client.POST("/api/v1/institution/{institutionSlug}/quizzes/{quizId}/publish", {params:{path:{...path(slug,{courseId,quizId}),quizId}}});
  const saved = quizDto(result.data,courseId,quizId,true);
  if (saved.status !== "published") throw new ApiResponseError();
  return saved;
}
export async function listCourseGradeItems(client: ApiClient, slug: string, courseId: string) {
  const result = await client.GET("/api/v1/institution/{institutionSlug}/courses/{courseId}/grade-items", {params:{path:{...path(slug,{courseId}),courseId}}});
  const items = list(result.data,v=>gradeItem(v,courseId));
  if (new Set(items.map(i=>i.quizId)).size !== items.length) throw new ApiResponseError();
  return items;
}
