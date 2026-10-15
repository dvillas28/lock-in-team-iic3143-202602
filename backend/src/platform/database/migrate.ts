import { resolve } from "node:path";
import { Client } from "pg";
import { runner } from "node-pg-migrate";
import { connectionConfig, reportError } from "./config";

export async function migrate(dir = resolve(__dirname, "../../../migrations")) {
  const client = new Client({ ...connectionConfig(), connectionTimeoutMillis: 5000,
    options: "-c lock_timeout=10000 -c statement_timeout=30000 -c search_path=public" });
  client.on("error", () => { /* The active operation reports a sanitized failure. */ });
  try {
    await client.connect();
    const applied = await runner({ dbClient: client, dir, schema: "public", migrationsSchema: "public",
      migrationsTable: "pgmigrations", direction: "up", singleTransaction: true,
      checkOrder: true, noLock: false, advisoryLockMode: "fail", verbose: false,
      logger: { debug() {}, info() {}, warn() {}, error() {} },
    });
    const history = await client.query<{count: number}>("SELECT count(*)::int AS count FROM public.pgmigrations");
    return {created: applied.length, existing: history.rows[0].count-applied.length};
  } finally { await client.end(); }
}

if (require.main === module) {
  const started = Date.now();
  migrate().then(counts => console.log(JSON.stringify({operation: "migrate", outcome: "ok", ...counts, durationMs: Date.now()-started})))
    .catch(error => { reportError("migrate",error); process.exitCode=1; });
}
