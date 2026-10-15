import { Inject, Injectable, type OnModuleInit, type OnApplicationShutdown } from "@nestjs/common";
import { Pool } from "pg";
import { connectionConfig, reportError } from "./config";
import { assertSchema } from "./schema";

export function createPool(env: NodeJS.ProcessEnv = process.env) {
  const pool = new Pool({
    ...connectionConfig(env), application_name: "academix-http", max: 5,
    connectionTimeoutMillis: 2000, query_timeout: 2000, statement_timeout: 2000,
    options: "-c search_path=public", idleTimeoutMillis: 10000,
  });
  pool.on("error", error => reportError("database", error));
  return pool;
}

export async function assertReady(pool: Pool) {
  const client = await pool.connect();
  try { await assertSchema(client); }
  catch (error) { client.release(true); throw error; }
  client.release();
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  constructor(@Inject(Pool) public readonly pool: Pool) {}
  async onModuleInit() { await assertReady(this.pool); }
  async onApplicationShutdown() { await this.pool.end(); }
}
