import {Body,Controller,Get,Headers,HttpCode,Param,Post,Req,UploadedFile,UseInterceptors} from "@nestjs/common";
import {FileInterceptor} from "@nestjs/platform-express";
import type {IdentityRequest} from "../auth/auth.guard";
import {ImportsService} from "./imports.service";

@Controller("api/v1/institution/:institutionSlug/user-imports")
export class ImportsController {
 constructor(private readonly imports:ImportsService) {}
 @Post("preview") @UseInterceptors(FileInterceptor("file",{limits:{fileSize:256*1024,files:1,fields:0,parts:1}}))
 preview(@Req() r:IdentityRequest,@Param("institutionSlug") slug:string,@UploadedFile() file:{buffer:Buffer}|undefined,@Headers("idempotency-key") key:string,@Body() body:unknown) {return this.imports.preview(r.userId,slug,file,key,body);}
 @Get(":importId") get(@Req() r:IdentityRequest,@Param("institutionSlug") slug:string,@Param("importId") id:string) {return this.imports.get(r.userId,slug,id);}
 @Post(":importId/confirm") @HttpCode(200) confirm(@Req() r:IdentityRequest,@Param("institutionSlug") slug:string,@Param("importId") id:string,@Body() body:unknown) {return this.imports.confirm(r.userId,slug,id,body);}
}
