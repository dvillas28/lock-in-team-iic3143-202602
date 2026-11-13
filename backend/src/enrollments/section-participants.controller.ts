import { Controller,Get,Header,Param,Req } from "@nestjs/common";
import type { IdentityRequest } from "../auth/auth.guard";
import { EnrollmentsService } from "./enrollments.service";
import { slug,uuid } from "../courses/validation";
// Read-only roster; enrollment writes stay in EnrollmentsController.
@Controller("api/v1/institution/:institutionSlug/sections/:sectionId/participants")
export class SectionParticipantsController {
 constructor(private readonly enrollments:EnrollmentsService) {}
 @Get() @Header("Cache-Control","no-store")
 list(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("sectionId") id:string) {return this.enrollments.participants(r.userId,slug(s),uuid(id));}
}
