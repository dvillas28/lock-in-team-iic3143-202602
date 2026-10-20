import { Controller,Get,Post,Patch,Header,Param,Req,Body,Res } from "@nestjs/common";
import type { IdentityRequest } from "../auth/auth.guard";
import { CoursesService } from "./courses.service";
import { slug,uuid,object,text,capacity } from "./validation";
interface Response {setHeader(name:string,value:string):void}
@Controller("api/v1/institutions/:institutionSlug/courses")
export class CoursesController {
 constructor(private readonly courses:CoursesService) {}
 @Get() @Header("Cache-Control","no-store")
 list(@Req() r:IdentityRequest,@Param("institutionSlug") s:string) {return this.courses.list(r.userId,slug(s));}
 @Get(":courseId") @Header("Cache-Control","no-store")
 get(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string) {return this.courses.get(r.userId,slug(s),uuid(id));}
 @Post() @Header("Cache-Control","no-store")
 async create(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Body() body:unknown,@Res({passthrough:true}) response:Response) {
  const dto=object(body,["code","name","term","initialSection"],["code","name","term","initialSection"]),section=object(dto.initialSection,["code","capacity"],["code"]);
  const result=await this.courses.create(r.userId,slug(s),{code:text(dto.code,32),name:text(dto.name,200),term:text(dto.term,16),initialSection:{code:text(section.code,32),capacity:capacity(section.capacity)}});
  response.setHeader("Location",`/api/v1/institutions/${s}/courses/${result.id}`);return result;
 }
 @Patch(":courseId") @Header("Cache-Control","no-store")
 update(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string,@Body() body:unknown) {
  const dto=object(body,["code","name","term"]);
  const input=Object.fromEntries(Object.entries(dto).map(([key,value])=>[key,text(value,key==="name"?200:key==="code"?32:16)]));
  return this.courses.update(r.userId,slug(s),uuid(id),input);
 }
}
