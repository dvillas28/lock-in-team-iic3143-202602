import { Controller, Get } from "@nestjs/common";

interface HealthResponse {
  status: "ok";
  message: string;
}

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: "ok",
      message: "Hello World from AcademiX API!",
    };
  }
}
