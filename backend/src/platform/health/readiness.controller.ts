import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { assertSchema } from "../database/schema";

@Controller("ready")
export class ReadinessController {
  constructor(private readonly database: DatabaseService) {}
  @Get()
  async getReadiness() {
    try { await assertSchema(this.database.pool); return {status: "ok"}; }
    catch { throw new ServiceUnavailableException({status: "unavailable"}); }
  }
}
