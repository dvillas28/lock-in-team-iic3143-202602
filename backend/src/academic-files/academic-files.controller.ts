import {Body,Controller,Delete,Get,Header,Headers,HttpCode,Param,Patch,Post,Put,Req,StreamableFile,UploadedFile,UseInterceptors} from "@nestjs/common";
import {FileInterceptor} from "@nestjs/platform-express";
import type {IdentityRequest} from "../auth/auth.guard";
import {slug,uuid} from "../courses/validation";
import {AcademicFilesService} from "./academic-files.service";
import {disposition,maxUploadBytes,type Upload} from "./file-format";

const uploadInterceptor=FileInterceptor("file",{limits:{fileSize:maxUploadBytes+1,files:1,fields:1,parts:3,fieldSize:1024}});
@Controller("api/v1/institution/:institutionSlug")
export class AcademicFilesController {
 constructor(private readonly files:AcademicFilesService) {}

 @Get("modules/:moduleId/resources")
 list(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("moduleId") m:string) {
  return this.files.list(r.userId,slug(s),uuid(m));
 }
 @Put("modules/:moduleId/resources/order") @HttpCode(204)
 reorder(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("moduleId") m:string,@Body() body:unknown) {
  return this.files.reorder(r.userId,slug(s),uuid(m),body);
 }
 @Post("modules/:moduleId/resources/quizzes") @HttpCode(204)
 linkQuiz(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("moduleId") m:string,@Body() body:unknown) {
  return this.files.linkQuiz(r.userId,slug(s),uuid(m),body);
 }
 @Delete("modules/:moduleId/resources/quizzes/:resourceId") @HttpCode(204)
 unlinkQuiz(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("moduleId") m:string,@Param("resourceId") id:string) {
  return this.files.unlinkQuiz(r.userId,slug(s),uuid(m),uuid(id));
 }
 @Post("modules/:moduleId/files") @UseInterceptors(uploadInterceptor)
 create(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("moduleId") m:string,@Body() body:unknown,@Headers("idempotency-key") operation?:string,@UploadedFile() file?:Upload) {
  return this.files.create(r.userId,slug(s),uuid(m),file,body,operation);
 }
 @Get("materials/:materialId/file")
 get(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("materialId") id:string) {
  return this.files.get(r.userId,slug(s),uuid(id));
 }
 @Patch("materials/:materialId/file")
 rename(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("materialId") id:string,@Body() body:unknown) {
  return this.files.update(r.userId,slug(s),uuid(id),body);
 }
 @Put("materials/:materialId/file") @UseInterceptors(uploadInterceptor)
 replace(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("materialId") id:string,@Body() body:unknown,@UploadedFile() file?:Upload) {
  return this.files.replace(r.userId,slug(s),uuid(id),file,body);
 }
 @Delete("materials/:materialId/file") @HttpCode(204)
 remove(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("materialId") id:string) {
  return this.files.remove(r.userId,slug(s),uuid(id));
 }
 @Post("materials/:materialId/file/publish") @HttpCode(200)
 publish(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("materialId") id:string,@Body() body:unknown) {
  return this.files.update(r.userId,slug(s),uuid(id),body,true);
 }
 @Post("materials/:materialId/file/unpublish") @HttpCode(200)
 unpublish(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("materialId") id:string,@Body() body:unknown) {
  return this.files.update(r.userId,slug(s),uuid(id),body,false);
 }
 @Get("materials/:materialId/file/preview")
 @Header("Content-Security-Policy","sandbox; default-src 'none'")
 preview(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("materialId") id:string) {
  return this.bytes(r.userId,slug(s),uuid(id),false);
 }
 @Get("materials/:materialId/file/download")
 @Header("Content-Security-Policy","sandbox; default-src 'none'")
 download(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("materialId") id:string) {
  return this.bytes(r.userId,slug(s),uuid(id),true);
 }
 private async bytes(actor:string,s:string,id:string,download:boolean) {
  const {stream,name,mime,size}=await this.files.content(actor,s,id,download);
  return new StreamableFile(stream,{type:mime,disposition:disposition(name,download),length:size});
 }
}
