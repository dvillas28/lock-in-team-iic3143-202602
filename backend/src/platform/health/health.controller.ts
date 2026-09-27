import { Controller, Get } from "@nestjs/common";

interface HealthResponse {
  status: "ok";
  version: string;
  timestamp: string;
}

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: "ok",
      version: process.env.APP_VERSION ?? "0.1.0",
      timestamp: new Date().toISOString(),
    };
  }
}
