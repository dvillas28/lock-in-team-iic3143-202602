import type { ApiClient } from "./client.ts";
import type { components } from "./schema";
import { ApiResponseError } from "./errors.ts";
import { isId, list, path } from "../courses/validation.ts";
import { isRecord } from "../auth/validation.ts";

export type Assignment = components["schemas"]["Assignment"];
export type AssignmentCreate = components["schemas"]["AssignmentCreate"];
export type AssignmentUpdate = components["schemas"]["AssignmentUpdate"];
export type EvaluationGroup = components["schemas"]["GradeGroup"];

const collection = "/api/v1/institution/{institutionSlug}/courses/{courseId}/assignments";
const detail = "/api/v1/institution/{institutionSlug}/courses/{courseId}/assignments/{assignmentId}";
const visibility = "/api/v1/institution/{institutionSlug}/courses/{courseId}/assignments/{assignmentId}/visibility";

function assignment(value: unknown, courseId: string, expected?: string): Assignment {
  if (!isRecord(value) || !isId(value.id) || (expected && value.id !== expected) || value.courseId !== courseId ||
      !isId(value.groupId) || (value.sectionId !== null && !isId(value.sectionId)) ||
      typeof value.title !== "string" || typeof value.groupTitle !== "string" || typeof value.canManage !== "boolean" ||
      !["draft","published","hidden"].includes(String(value.status)) ||
      (!value.canManage && value.status !== "published") ||
      !Number.isInteger(value.version) || Number(value.version) < 0 ||
      typeof value.maxPoints !== "number" || value.maxPoints < 0 || !Number.isFinite(value.maxPoints) ||
      typeof value.weightPercent !== "number" || value.weightPercent < 0 || value.weightPercent > 100 ||
      !Array.isArray(value.allowedExtensions) || value.allowedExtensions.some(v => typeof v !== "string") ||
      (value.maxAttempts !== null && (!Number.isInteger(value.maxAttempts) || Number(value.maxAttempts) < 1)) ||
      [value.description,value.instructions].some(v=>v !== null && typeof v !== "string") ||
      [value.availableFrom,value.dueAt,value.availableUntil,value.publishedAt].some(v=>
        v !== null && (typeof v !== "string" || !v.endsWith("Z") || !Number.isFinite(Date.parse(v))))) {
    throw new ApiResponseError();
  }
  return value as Assignment;
}

const parameters = (slug: string, courseId: string) => ({...path(slug,{courseId}),courseId});
const forItem = (slug: string, courseId: string, assignmentId: string) => ({
  ...path(slug,{courseId,assignmentId}),courseId,assignmentId,
});
export async function listAssignments(c: ApiClient, slug: string, courseId: string) {
  const result = await c.GET(collection,{params:{path:parameters(slug,courseId)}});
  return list(result.data,v=>assignment(v,courseId));
}
export async function getAssignment(c: ApiClient, slug: string, courseId: string, id: string) {
  const result = await c.GET(detail,{params:{path:forItem(slug,courseId,id)}});
  return assignment(result.data,courseId,id);
}
export async function createAssignment(c: ApiClient, slug: string, courseId: string, body: AssignmentCreate) {
  const result = await c.POST(collection,{params:{path:parameters(slug,courseId)},body});
  return assignment(result.data,courseId);
}
export async function updateAssignment(c: ApiClient, slug: string, courseId: string, id: string, body: AssignmentUpdate) {
  const result = await c.PATCH(detail,{params:{path:forItem(slug,courseId,id)},body});
  return assignment(result.data,courseId,id);
}
export async function publishAssignment(c: ApiClient, slug: string, courseId: string, id: string, expectedVersion: number, published: boolean) {
  const result = await c.PATCH(visibility,{params:{path:forItem(slug,courseId,id)},body:{expectedVersion,published}});
  return assignment(result.data,courseId,id);
}
export async function listEvaluationGroups(c: ApiClient, slug: string, courseId: string): Promise<EvaluationGroup[]> {
  const result = await c.GET("/api/v1/institution/{institutionSlug}/courses/{courseId}/evaluation-groups",{
    params:{path:parameters(slug,courseId)},
  });
  return list(result.data,value=>{
    if (!isRecord(value) || !isId(value.id) || typeof value.title !== "string" ||
        typeof value.weightPercent !== "number" || value.weightPercent < 0 || value.weightPercent > 100 ||
        !Number.isInteger(value.position)) throw new ApiResponseError();
    return value as EvaluationGroup;
  });
}
