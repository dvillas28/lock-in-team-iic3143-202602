import { Controller, Get } from "@nestjs/common";

interface HealthResponse {
  status: "ok";
  version: string;
  commit: string | null;
  deployedAt: string;
  timestamp: string;
}

// The process starts on each deploy or restart, so this is when the running version went live.
const startedAt = new Date().toISOString();

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: "ok",
      // Release of the last backend deploy: releases without backend changes do not redeploy it.
      version: process.env.APP_VERSION ?? "0.1.0",
      commit: process.env.RAILWAY_GIT_COMMIT_SHA ?? null,
      deployedAt: startedAt,
      timestamp: new Date().toISOString(),
    };
  }
}
