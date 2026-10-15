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
      m.id,m.institution_id,m.user_id,m.active,m.created_at,m.updated_at
      FROM public.institutions i, public.users u, public.institution_memberships m LIMIT 0`);
  }

  async onModuleInit() { await this.check(); }
  async onApplicationShutdown() { await this.pool.end(); }
}
