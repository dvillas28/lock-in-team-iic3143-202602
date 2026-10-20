import { Injectable, type OnModuleInit, type OnApplicationShutdown } from "@nestjs/common";
import { Pool } from "pg";
import { connectionConfig, reportError } from "./config";

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  readonly pool = new Pool({
    ...connectionConfig(), application_name: "academix-http", max: 5,
    connectionTimeoutMillis: 2000, query_timeout: 2000, statement_timeout: 2000,
    options: "-c search_path=public", idleTimeoutMillis: 10000,
  });

  constructor() { this.pool.on("error", error => reportError("database", error)); }

  async check() {
    await this.pool.query(`SELECT a.id,a.institution_id,a.course_id,a.quiz_id,a.section_id,a.student_id,a.attempt_number,a.status,
      a.started_at,a.submitted_at,a.cancelled_at,a.answers,a.score_points,a.score_percent,a.grade_value,a.start_key,a.submit_key,
      g.id,g.institution_id,g.grade_item_id,g.quiz_id,g.student_id,g.section_id,g.attempt_id,g.score_percent,g.grade_value,g.published_at,g.created_at,g.updated_at
      FROM public.quiz_attempts a,public.grades g LIMIT 0`);
    await this.pool.query(`SELECT c.grade_items_locked_at,q.id,q.institution_id,q.course_id,q.section_id,q.title,
      q.instructions,q.opens_at,q.closes_at,q.max_attempts,q.published_at,q.created_by,q.questions,
      g.id,g.institution_id,g.course_id,g.quiz_id,g.title,g.weight_percent,g.created_at
      FROM public.courses c,public.quizzes q,public.grade_items g LIMIT 0`);
    // Resolve required columns without reading rows; SQL and integration tests own the constraints.
    await this.pool.query(`SELECT i.id,i.slug,i.name,i.active,i.created_at,i.updated_at,
      u.id,u.email,u.password_hash,u.name,u.active,u.created_at,u.updated_at,
      m.id,m.institution_id,m.user_id,m.active,m.is_admin,m.is_super_admin,m.created_at,m.updated_at
      FROM public.institutions i, public.users u, public.institution_memberships m LIMIT 0`);
    await this.pool.query(`SELECT c.id,c.institution_id,c.code,c.name,c.term,c.created_by,c.created_at,
      s.id,s.institution_id,s.course_id,s.code,s.capacity,s.created_at,
      e.id,e.institution_id,e.section_id,e.user_id,e.role,e.active,e.created_at,
      a.id,a.institution_id,a.actor_user_id,a.action,a.resource_type,a.resource_id,a.course_id,a.section_id,a.occurred_at,a.changes
      FROM public.courses c,public.sections s,public.enrollments e,public.audit_events a LIMIT 0`);

    await this.pool.query(`SELECT m.id,m.institution_id,m.course_id,m.title,m.position,m.published_at,
      a.id,a.institution_id,a.module_id,a.title,a.kind,a.markdown_body,a.published_at,a.created_by
      FROM public.course_modules m,public.materials a LIMIT 0`);
  }

  async onModuleInit() { await this.check(); }
  async onApplicationShutdown() { await this.pool.end(); }
}
