import { Controller,Get,Header,Param,Req,Query } from "@nestjs/common";
import type { IdentityRequest } from "../auth/auth.guard";
import { DatabaseService } from "../database/database.service";
import { AuditService } from "./audit.service";
import { slug,uuid } from "../courses/validation";
@Controller("api/v1/institutions/:institutionSlug/courses/:courseId/audit-events")
export class AuditController {
 constructor(private readonly audit:AuditService,private readonly database:DatabaseService) {}
 @Get() @Header("Cache-Control","no-store")
 list(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string,@Query() q:Record<string,unknown>) {
  return this.audit.list(this.database.pool,r.userId,slug(s),uuid(id),q);
 }
}
