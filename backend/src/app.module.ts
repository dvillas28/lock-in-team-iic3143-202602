import { Module } from "@nestjs/common";
import { DatabaseService } from "./database/database.service";
import { HealthController } from "./health/health.controller";

@Module({
  providers: [DatabaseService],
  controllers: [HealthController],
})
export class AppModule {}
