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
