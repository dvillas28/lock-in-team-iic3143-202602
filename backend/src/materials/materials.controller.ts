import {Controller,Get,Post,Patch,HttpCode,Param,Body,Req,Res} from "@nestjs/common";
import type {IdentityRequest} from "../auth/auth.guard";
import {slug,uuid} from "../courses/validation";
import {MaterialsService} from "./materials.service";
interface Response {setHeader(name:string,value:string):void}
@Controller("api/v1/institution/:institutionSlug")
export class MaterialsController {
 constructor(private readonly materials:MaterialsService) {}
 @Get("modules/:moduleId/materials")
 list(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("moduleId") id:string) {return this.materials.list(r.userId,slug(s),uuid(id));}
 @Get("materials/:materialId")
 get(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("materialId") id:string) {return this.materials.get(r.userId,slug(s),uuid(id));}
 @Post("modules/:moduleId/materials")
 async create(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("moduleId") id:string,@Body() body:unknown,@Res({passthrough:true}) response:Response) {
  const result=await this.materials.create(r.userId,slug(s),uuid(id),body);
  response.setHeader("Location",`/api/v1/institution/${s}/materials/${result.id}`);return result;
 }
 @Patch("materials/:materialId")
 update(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("materialId") id:string,@Body() body:unknown) {return this.materials.update(r.userId,slug(s),uuid(id),body);}
 @Post("materials/:materialId/publish") @HttpCode(200)
 publish(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("materialId") id:string,@Body() body:unknown) {return this.materials.update(r.userId,slug(s),uuid(id),body,true);}
 @Post("materials/:materialId/unpublish") @HttpCode(200)
 unpublish(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("materialId") id:string,@Body() body:unknown) {return this.materials.update(r.userId,slug(s),uuid(id),body,false);}
}
