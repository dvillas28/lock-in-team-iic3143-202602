import {Body,Controller,Delete,Get,Header,HttpCode,Patch,Post,Put,Req,StreamableFile,UploadedFile,UseGuards,UseInterceptors} from "@nestjs/common";
import {FileInterceptor} from "@nestjs/platform-express";
import {ThrottlerGuard} from "@nestjs/throttler";
import type {IdentityRequest} from "../auth/auth.guard";
import {AccountsService} from "./accounts.service";

@Controller("api/v1/me")
export class AccountsController {
 constructor(private readonly accounts:AccountsService) {}
 @Get() get(@Req() r:IdentityRequest) {return this.accounts.get(r.userId);}
 @Patch() update(@Req() r:IdentityRequest,@Body() body:unknown) {return this.accounts.update(r.userId,r.credentialVersion,body);}
 @Post("password") @HttpCode(204) @UseGuards(ThrottlerGuard)
 password(@Req() r:IdentityRequest,@Body() body:unknown) {return this.accounts.changePassword(r.userId,r.credentialVersion,body);}
 @Get("avatar") @Header("X-Content-Type-Options","nosniff")
 async avatar(@Req() r:IdentityRequest) {return new StreamableFile(await this.accounts.avatar(r.userId),{type:"image/webp"});}
 @Put("avatar") @UseInterceptors(FileInterceptor("file",{limits:{fileSize:2*1024*1024,files:1,fields:1,parts:2}}))
 put(@Req() r:IdentityRequest,@Body() body:unknown,@UploadedFile() file?:{buffer:Buffer}) {return this.accounts.putAvatar(r.userId,r.credentialVersion,body,file);}
 @Delete("avatar") delete(@Req() r:IdentityRequest,@Body() body:unknown) {return this.accounts.deleteAvatar(r.userId,r.credentialVersion,body);}
}
