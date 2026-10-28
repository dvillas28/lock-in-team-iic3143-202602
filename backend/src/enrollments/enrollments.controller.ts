import { BadRequestException,Controller,Get,Post,Patch,Header,Param,Req,Body,Res,Query } from "@nestjs/common";
import type { IdentityRequest } from "../auth/auth.guard";
import { EnrollmentsService } from "./enrollments.service";
import { slug,uuid,object,role,boolean } from "../courses/validation";
@Controller("api/v1/institution/:institutionSlug/sections/:sectionId/enrollments")
export class EnrollmentsController {
 constructor(private readonly enrollments:EnrollmentsService) {}
 @Get() @Header("Cache-Control","no-store")
 list(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("sectionId") id:string,@Query() query:Record<string,unknown>) {return this.enrollments.list(r.userId,slug(s),uuid(id),query);}
 @Post() @Header("Cache-Control","no-store")
 async create(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("sectionId") id:string,@Body() body:unknown,@Res({passthrough:true}) response:{status(code:number):void;setHeader(name:string,value:string):void}) {
  const dto=object(body,["userId","role"],["userId","role"]),result=await this.enrollments.create(r.userId,slug(s),uuid(id),uuid(dto.userId),role(dto.role));
  response.status(result.created?201:200);
  if(result.created)response.setHeader("Location",`/api/v1/institution/${s}/sections/${id}/enrollments/${result.item.id}`);
  return result.item;
 }
 @Patch(":enrollmentId") @Header("Cache-Control","no-store")
 update(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("sectionId") id:string,@Param("enrollmentId") enrollment:string,@Body() body:unknown) {
  const dto=object(body,["role","active"]);if(Object.keys(dto).length!==1)throw new BadRequestException();
  return this.enrollments.update(r.userId,slug(s),uuid(id),uuid(enrollment),"role" in dto?{role:role(dto.role)}:{active:boolean(dto.active)});
 }
}
