import type { ApiClient } from "./client.ts";
import { path, course, courseList } from "../courses/validation.ts";
export async function listCourses(client: ApiClient, slug: string) {
  const result = await client.GET("/api/v1/institution/{institutionSlug}/courses", { params: { path: path(slug) } });
  return courseList(result.data);
}
export async function getCourse(client: ApiClient, slug: string, courseId: string) {
  const result = await client.GET("/api/v1/institution/{institutionSlug}/courses/{courseId}", { params: { path: { ...path(slug, { courseId }), courseId } } });
  return course(result.data, courseId);
}
import type { components } from "./schema";
export async function createCourse(client: ApiClient, slug: string, body: components["schemas"]["CourseCreate"]) {
  const result = await client.POST("/api/v1/institution/{institutionSlug}/courses", { params: { path: path(slug) }, body });
  return course(result.data);
}
export async function updateCourse(client: ApiClient, slug: string, courseId: string, body: components["schemas"]["CourseUpdate"]) {
  if (!Object.keys(body).length)
    throw new TypeError("No hay cambios.");
  const result = await client.PATCH("/api/v1/institution/{institutionSlug}/courses/{courseId}", { params: { path: { ...path(slug, { courseId }), courseId } }, body });
  return course(result.data, courseId);
}
