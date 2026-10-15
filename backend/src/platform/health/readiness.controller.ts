import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { DatabaseService, assertReady } from "../database/database.service";

@Controller("ready")
export class ReadinessController {
  constructor(private readonly database: DatabaseService) {}
  @Get()
  async getReadiness() {
    try { await assertReady(this.database.pool); return {status: "ok"}; }
    catch { throw new ServiceUnavailableException({status: "unavailable"}); }
  }
}
