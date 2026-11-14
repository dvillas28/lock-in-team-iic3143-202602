import { Controller, Get, Header, Param, Query, Req } from "@nestjs/common";
import type { IdentityRequest } from "../auth/auth.guard";
import { slug } from "../courses/validation";
import { CalendarService } from "./calendar.service";

@Controller("api/v1/institution/:institutionSlug/calendar")
export class CalendarController {
 constructor(private readonly calendar: CalendarService) {}

 @Get() @Header("Cache-Control","no-store") @Header("X-Content-Type-Options","nosniff")
 list(@Req() r: IdentityRequest, @Param("institutionSlug") s: string, @Query() q: Record<string, unknown>) {
  return this.calendar.list(r.userId, slug(s), q);
 }
}
