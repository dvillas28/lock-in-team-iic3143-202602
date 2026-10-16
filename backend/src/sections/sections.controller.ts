import { Controller,Get,Post,Patch,Header,Param,Req,Body,Res } from "@nestjs/common";
import type { IdentityRequest } from "../auth/auth.guard";
import { SectionsService } from "./sections.service";
import { slug,uuid,object,text,capacity } from "../courses/validation";
@Controller("api/v1/institutions/:institutionSlug")
export class SectionsController {
 constructor(private readonly sections:SectionsService) {}
 @Get("courses/:courseId/sections") @Header("Cache-Control","no-store")
 list(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string) {return this.sections.list(r.userId,slug(s),uuid(id));}
 @Get("sections/:sectionId") @Header("Cache-Control","no-store")
 get(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("sectionId") id:string) {return this.sections.get(r.userId,slug(s),uuid(id));}
 @Post("courses/:courseId/sections") @Header("Cache-Control","no-store")
 async create(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string,@Body() body:unknown,@Res({passthrough:true}) response:{setHeader(name:string,value:string):void}) {
  const dto=object(body,["code","capacity"],["code"]);
  const result=await this.sections.create(r.userId,slug(s),uuid(id),{code:text(dto.code,32),capacity:capacity(dto.capacity)});
  response.setHeader("Location",`/api/v1/institutions/${s}/sections/${result.id}`);return result;
 }
 @Patch("sections/:sectionId") @Header("Cache-Control","no-store")
 update(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("sectionId") id:string,@Body() body:unknown) {
  const dto=object(body,["code","capacity"]),input:{code?:string;capacity?:number|null}={};
  if("code" in dto)input.code=text(dto.code,32);if("capacity" in dto)input.capacity=capacity(dto.capacity);
  return this.sections.update(r.userId,slug(s),uuid(id),input);
 }
}
