import { Controller, Get, Header, Req } from "@nestjs/common";
import { InstitutionsService } from "./institutions.service";
import type { IdentityRequest } from "../auth/auth.guard";

@Controller("api/v1/institutions")
export class InstitutionsController {
  constructor(private readonly institutions: InstitutionsService) {}
  @Get()
  @Header("Cache-Control", "no-store")
  list(@Req() request: IdentityRequest) { return this.institutions.list(request.userId); }
}
