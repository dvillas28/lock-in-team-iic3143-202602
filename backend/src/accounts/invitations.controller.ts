import {Body,Controller,Get,Headers,HttpCode,Param,Post,Query,Req,UseGuards} from "@nestjs/common";
import {ThrottlerGuard} from "@nestjs/throttler";
import {Public,type IdentityRequest} from "../auth/auth.guard";
import {InvitationsService} from "./invitations.service";

@Controller("api/v1/institution/:institutionSlug/invitations")
export class InvitationsController {
 constructor(private readonly invitations:InvitationsService) {}
 @Get() list(@Req() r:IdentityRequest,@Param("institutionSlug") slug:string,@Query() q:Record<string,unknown>) {return this.invitations.list(r.userId,slug,q);}
 @Post() create(@Req() r:IdentityRequest,@Param("institutionSlug") slug:string,@Body() body:unknown,@Headers("idempotency-key") key:string) {return this.invitations.create(r.userId,slug,body,key);}
 @Post(":invitationId/send") @HttpCode(200) send(@Req() r:IdentityRequest,@Param("institutionSlug") slug:string,@Param("invitationId") id:string,@Headers("idempotency-key") key:string,@Body() body:unknown) {return this.invitations.send(r.userId,slug,id,key,false,body);}
 @Post(":invitationId/resend") @HttpCode(200) resend(@Req() r:IdentityRequest,@Param("institutionSlug") slug:string,@Param("invitationId") id:string,@Headers("idempotency-key") key:string,@Body() body:unknown) {return this.invitations.send(r.userId,slug,id,key,true,body);}
 @Post(":invitationId/revoke") @HttpCode(200) revoke(@Req() r:IdentityRequest,@Param("institutionSlug") slug:string,@Param("invitationId") id:string,@Body() body:unknown) {return this.invitations.revoke(r.userId,slug,id,body);}
}
@Controller("api/v1")
export class InvitationActivationController {
 constructor(private readonly invitations:InvitationsService) {}
 @Post("auth/invitations/activate") @Public() @HttpCode(204) @UseGuards(ThrottlerGuard)
 activate(@Body() body:unknown) {return this.invitations.activate(body);}
 @Post("me/invitations/accept") @HttpCode(204)
 accept(@Req() r:IdentityRequest,@Body() body:unknown) {return this.invitations.accept(r.userId,r.credentialVersion,body);}
}
