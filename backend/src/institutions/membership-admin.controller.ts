import { Controller,Get,Put,Header,Param,Req,Body,Query } from "@nestjs/common";
import type { IdentityRequest } from "../auth/auth.guard";
import { MembershipAdminService } from "./membership-admin.service";
import { slug,uuid,object,boolean } from "../courses/validation";
@Controller("api/v1/institution/:institutionSlug/memberships")
export class MembershipAdminController {
 constructor(private readonly members:MembershipAdminService) {}
 @Get() @Header("Cache-Control","no-store")
 list(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Query() q:Record<string,unknown>) {return this.members.list(r.userId,slug(s),q);}
 @Put(":membershipId/course-admin") @Header("Cache-Control","no-store")
 set(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("membershipId") id:string,@Body() body:unknown) {
  return this.members.set(r.userId,slug(s),uuid(id),boolean(object(body,["isAdmin"],["isAdmin"]).isAdmin));
 }
}
