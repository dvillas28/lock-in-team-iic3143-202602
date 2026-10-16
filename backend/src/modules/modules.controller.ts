import {Controller,Get,Post,Patch,Put,HttpCode,Param,Body,Req,Res} from "@nestjs/common";
import type {IdentityRequest} from "../auth/auth.guard";
import {slug,uuid} from "../courses/validation";
import {ModulesService} from "./modules.service";
interface Response {setHeader(name:string,value:string):void}
@Controller("api/v1/institutions/:institutionSlug")
export class ModulesController {
 constructor(private readonly modules:ModulesService) {}
 @Get("courses/:courseId/modules")
 list(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string) {return this.modules.list(r.userId,slug(s),uuid(id));}
 @Get("modules/:moduleId")
 get(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("moduleId") id:string) {return this.modules.get(r.userId,slug(s),uuid(id));}
 @Post("courses/:courseId/modules")
 async create(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string,@Body() body:unknown,@Res({passthrough:true}) response:Response) {
  const result=await this.modules.create(r.userId,slug(s),uuid(id),body);
  response.setHeader("Location",`/api/v1/institutions/${s}/modules/${result.id}`);return result;
 }
 @Put("courses/:courseId/modules/order")
 reorder(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string,@Body() body:unknown) {return this.modules.reorder(r.userId,slug(s),uuid(id),body);}
 @Patch("modules/:moduleId")
 update(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("moduleId") id:string,@Body() body:unknown) {return this.modules.update(r.userId,slug(s),uuid(id),body);}
 @Post("modules/:moduleId/publish") @HttpCode(200)
 publish(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("moduleId") id:string,@Body() body:unknown) {return this.modules.update(r.userId,slug(s),uuid(id),body,true);}
 @Post("modules/:moduleId/unpublish") @HttpCode(200)
 unpublish(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("moduleId") id:string,@Body() body:unknown) {return this.modules.update(r.userId,slug(s),uuid(id),body,false);}
}
