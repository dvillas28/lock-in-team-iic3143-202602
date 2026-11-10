import {AssignmentsService} from "./assignments/assignments.service";
import {AssignmentsController} from "./assignments/assignments.controller";
import {AcademicFilesController} from "./academic-files/academic-files.controller";
import {AcademicFilesService} from "./academic-files/academic-files.service";
import {AcademicStorage} from "./academic-files/object-storage";
import {AccountsController} from "./accounts/accounts.controller";
import {AccountsService} from "./accounts/accounts.service";
import {AccountIntegrations} from "./accounts/integrations";
import {InvitationsController,InvitationActivationController} from "./accounts/invitations.controller";
import {InvitationsService} from "./accounts/invitations.service";
import {ImportsController} from "./accounts/imports.controller";
import {ImportsService} from "./accounts/imports.service";
import { ParticipantSearchService } from "./institutions/participant-search.service";
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
  providers: [AssignmentsService,AcademicFilesService,AcademicStorage,AccountsService,AccountIntegrations,InvitationsService,ImportsService,ParticipantSearchService, GradebookService, AttemptsService, QuizzesService, ModulesService, MaterialsService, EnrollmentsService, AuditService, MembershipAdminService, CoursesService, SectionsService, DatabaseService, AuthService, InstitutionsService, {provide: APP_GUARD, useClass: AuthGuard}, {provide: APP_GUARD, useClass: TenantGuard}],
  controllers: [AssignmentsController,AcademicFilesController,AccountsController,InvitationsController,InvitationActivationController,ImportsController,GradebookController, AttemptsController, QuizzesController, ModulesController, MaterialsController, EnrollmentsController, AuditController, MembershipAdminController, CoursesController, SectionsController, HealthController, AuthController, InstitutionsController],
})
export class AppModule {}
