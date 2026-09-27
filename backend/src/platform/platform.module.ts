import { Module } from "@nestjs/common";
import { HealthController } from "./health/health.controller";
import { HelloController } from "./hello/hello.controller";

@Module({
  controllers: [HelloController, HealthController],
})
export class PlatformModule {}
