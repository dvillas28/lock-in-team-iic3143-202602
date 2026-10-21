import { BadRequestException, Controller, Get, Header, Param, Req } from "@nestjs/common";
import { InstitutionsService } from "./institutions.service";
import type { IdentityRequest } from "../auth/auth.guard";

@Controller("api/v1")
export class InstitutionsController {
  constructor(private readonly institutions: InstitutionsService) {}
  @Get("institutions")
  @Header("Cache-Control", "no-store")
  list(@Req() request: IdentityRequest) { return this.institutions.list(request.userId); }
  @Get("institution/:institutionSlug/me")
  @Header("Cache-Control", "no-store")
  current(@Req() request: IdentityRequest, @Param("institutionSlug") slug: string) {
    if (slug.length > 63 || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) throw new BadRequestException({field: "institutionSlug"});
    return this.institutions.current(request.userId, slug);
  }
}
