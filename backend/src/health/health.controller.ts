import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { Public } from "../auth/auth.guard";
import { DatabaseService } from "../database/database.service";

interface HealthResponse {
  status: "ok";
  version: string;
  commit: string | null;
  deployedAt: string;
  timestamp: string;
}

// The process starts on each deploy or restart, so this is when the running version went live.
const startedAt = new Date().toISOString();

@Controller()
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get("health")
  @Public()
  getHealth(): HealthResponse {
    return {
      status: "ok",
      // Release of the last backend deploy: releases without backend changes do not redeploy it.
      version: process.env.APP_VERSION ?? "dev",
      commit: process.env.RENDER_GIT_COMMIT ?? null,
      deployedAt: startedAt,
      timestamp: new Date().toISOString(),
    };
  }
  @Get("ready")
  @Public()
  async getReadiness() {
    try { await this.database.check(); return {status: "ok"}; }
    catch { throw new ServiceUnavailableException({status: "unavailable"}); }
  }
}
