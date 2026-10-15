import { Module } from "@nestjs/common";
import { HealthController } from "./health/health.controller";

import { DatabaseModule } from "./database/database.module";
import { ReadinessController } from "./health/readiness.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController, ReadinessController],
})
export class PlatformModule {}
