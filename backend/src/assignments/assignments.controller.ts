import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import type { IdentityRequest } from "../auth/auth.guard";
import { slug, uuid } from "../courses/validation";
import { AssignmentsService } from "./assignments.service";

@Controller("api/v1/institution/:institutionSlug/courses/:courseId")
export class AssignmentsController {
 constructor(private readonly assignments: AssignmentsService) {}

 @Get("assignments")
 list(@Req() r: IdentityRequest, @Param("institutionSlug") s: string, @Param("courseId") course: string) {
  return this.assignments.list(r.userId,slug(s),uuid(course));
 }

 @Get("evaluation-groups")
 groups(@Req() r: IdentityRequest, @Param("institutionSlug") s: string, @Param("courseId") course: string) {
  return this.assignments.groups(r.userId,slug(s),uuid(course));
 }

 @Post("assignments")
 create(@Req() r: IdentityRequest, @Param("institutionSlug") s: string, @Param("courseId") course: string, @Body() body: unknown) {
  return this.assignments.create(r.userId,slug(s),uuid(course),body);
 }

 @Get("assignments/:assignmentId")
 get(@Req() r: IdentityRequest, @Param("institutionSlug") s: string, @Param("courseId") course: string, @Param("assignmentId") id: string) {
  return this.assignments.get(r.userId,slug(s),uuid(course),uuid(id));
 }

 @Patch("assignments/:assignmentId")
 update(@Req() r: IdentityRequest, @Param("institutionSlug") s: string, @Param("courseId") course: string, @Param("assignmentId") id: string, @Body() body: unknown) {
  return this.assignments.update(r.userId,slug(s),uuid(course),uuid(id),body);
 }

 @Patch("assignments/:assignmentId/visibility")
 visibility(@Req() r: IdentityRequest, @Param("institutionSlug") s: string, @Param("courseId") course: string, @Param("assignmentId") id: string, @Body() body: unknown) {
  return this.assignments.visibility(r.userId,slug(s),uuid(course),uuid(id),body);
 }
}
