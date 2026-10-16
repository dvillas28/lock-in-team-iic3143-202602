import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { DatabaseService } from "./database/database.service";
import { HealthController } from "./health/health.controller";
import { AuthService } from "./auth/auth.service";
import { AuthController } from "./auth/auth.controller";
import { AuthGuard } from "./auth/auth.guard";
import { InstitutionsService } from "./institutions/institutions.service";
import { InstitutionsController } from "./institutions/institutions.controller";

@Module({
  imports: [JwtModule.register({}),
    // shortcut: memory per instance; coordinate quotas before running multiple instances.
    ThrottlerModule.forRoot([{limit: 5, ttl: 60000, blockDuration: 60000}])],
  providers: [DatabaseService, AuthService, InstitutionsService, {provide: APP_GUARD, useClass: AuthGuard}],
  controllers: [HealthController, AuthController, InstitutionsController],
})
export class AppModule {}
