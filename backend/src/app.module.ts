import { Module } from "@nestjs/common";
import { DatabaseModule } from "./platform/database/database.module";
import { HealthController } from "./platform/health/health.controller";
import { ReadinessController } from "./platform/health/readiness.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController, ReadinessController],
})
export class AppModule {}
