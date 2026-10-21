import {TenantGuard} from "./tenancy/tenant.guard";
import {GradebookService} from "./gradebook/gradebook.service";
import {GradebookController} from "./gradebook/gradebook.controller";
import {AttemptsController} from "./attempts/attempts.controller";
import {AttemptsService} from "./attempts/attempts.service";
import {QuizzesService} from "./quizzes/quizzes.service";
import {QuizzesController} from "./quizzes/quizzes.controller";
import {ModulesService} from "./modules/modules.service";
import {ModulesController} from "./modules/modules.controller";
import {MaterialsService} from "./materials/materials.service";
import {MaterialsController} from "./materials/materials.controller";
import { EnrollmentsService } from "./enrollments/enrollments.service";
import { EnrollmentsController } from "./enrollments/enrollments.controller";
import { AuditController } from "./audit/audit.controller";
import { AuditService } from "./audit/audit.service";
import { MembershipAdminService } from "./institutions/membership-admin.service";
import { MembershipAdminController } from "./institutions/membership-admin.controller";
import { CoursesService } from "./courses/courses.service";
import { CoursesController } from "./courses/courses.controller";
import { SectionsService } from "./sections/sections.service";
import { SectionsController } from "./sections/sections.controller";
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
  providers: [GradebookService, AttemptsService, QuizzesService, ModulesService, MaterialsService, EnrollmentsService, AuditService, MembershipAdminService, CoursesService, SectionsService, DatabaseService, AuthService, InstitutionsService, {provide: APP_GUARD, useClass: AuthGuard}, {provide: APP_GUARD, useClass: TenantGuard}],
  controllers: [GradebookController, AttemptsController, QuizzesController, ModulesController, MaterialsController, EnrollmentsController, AuditController, MembershipAdminController, CoursesController, SectionsController, HealthController, AuthController, InstitutionsController],
})
export class AppModule {}
