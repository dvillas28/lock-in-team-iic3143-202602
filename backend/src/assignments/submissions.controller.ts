import { Body, Controller, Get, Header, Param, Post, Put, Query, Req, StreamableFile, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import type { IdentityRequest } from "../auth/auth.guard";
import { slug, uuid } from "../courses/validation";
import { disposition, type Upload } from "../academic-files/file-format";
import { AssignmentReviewService, reviewParams } from "./assignment-review.service";
import { SubmissionsService } from "./submissions.service";
import { submissionFileLimit, submissionFileBytes } from "./submission-validation";

const upload=FilesInterceptor("files",submissionFileLimit,{limits:{
 fileSize:submissionFileBytes+1,files:submissionFileLimit,fields:4,parts:submissionFileLimit+5,fieldSize:40_000,
}});

@Controller("api/v1/institution/:institutionSlug/courses/:courseId/assignments/:assignmentId")
export class SubmissionsController {
 constructor(private readonly submissions: SubmissionsService, private readonly reviews: AssignmentReviewService) {}

 @Get("my-submissions")
 mine(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") course:string,@Param("assignmentId") id:string) {
  return this.submissions.mine(r.userId,slug(s),uuid(course),uuid(id));
 }

 @Post("my-submissions") @UseInterceptors(upload)
 submit(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") course:string,@Param("assignmentId") id:string,
  @Body() body:unknown,@UploadedFiles() files:Upload[]=[]) {
  return this.submissions.submit(r.userId,slug(s),uuid(course),uuid(id),body,files);
 }

 @Get("submissions")
 roster(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") course:string,@Param("assignmentId") id:string) {
  return this.reviews.roster(r.userId,slug(s),uuid(course),uuid(id));
 }

 @Get("submission-review")
 review(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") course:string,@Param("assignmentId") id:string,@Query() query:unknown) {
  const {section,student}=reviewParams(query);
  return this.reviews.review(r.userId,slug(s),uuid(course),uuid(id),section,student);
 }

 @Put("submissions/:attemptId/grade")
 draft(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") course:string,@Param("assignmentId") id:string,
  @Param("attemptId") attemptId:string,@Body() body:unknown) {
  return this.reviews.draft(r.userId,slug(s),uuid(course),uuid(id),uuid(attemptId),body);
 }

 @Get("submission-files/:fileId")
 @Header("Content-Security-Policy","sandbox; default-src 'none'")
 async download(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") course:string,@Param("assignmentId") id:string,@Param("fileId") file:string) {
  const {bytes,name,mime}=await this.submissions.download(r.userId,slug(s),uuid(course),uuid(id),uuid(file));
  return new StreamableFile(bytes,{type:mime,disposition:disposition(name,true),length:bytes.length});
 }
}
