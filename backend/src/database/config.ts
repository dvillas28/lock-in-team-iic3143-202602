import { isIP } from "node:net";
import type { PoolConfig } from "pg";

export class OperationError extends Error {
  constructor(public readonly category: "config" | "connection" | "schema" | "lock" | "conflict") {
    super(category);
  }
}

function ensure(valid: boolean): asserts valid {
  if (!valid) throw new Error("invalid database url");
}

function isPrivateHost(hostname: string) {
  if (["localhost", "127.0.0.1", "[::1]", "postgres"].includes(hostname)) return true;
  return isIP(hostname) === 4 && (hostname.startsWith("10.") || hostname.startsWith("192.168.")
    || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname));
}

// libpq URL options can override TLS verification and connection timeouts.
function ensureAllowedParams(url: URL) {
  for (const key of url.searchParams.keys()) {
    ensure(["sslmode", "sslrootcert", "channel_binding"].includes(key));
    ensure(url.searchParams.getAll(key).length === 1);
  }
  // Neon adds channel_binding=require to its URLs; it only strengthens SCRAM, so that value alone is accepted.
  ensure(!url.searchParams.has("channel_binding") || url.searchParams.get("channel_binding") === "require");
}

function ensureNoTlsOverrides(env: NodeJS.ProcessEnv) {
  ensure(env.NODE_TLS_REJECT_UNAUTHORIZED !== "0" && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0");
  ensure(env.PGSSLMODE !== "no-verify" && process.env.PGSSLMODE !== "no-verify");
}

export function connectionConfig(env: NodeJS.ProcessEnv = process.env): PoolConfig {
  try {
    const url = new URL(env.DATABASE_URL ?? "");
    ensure(["postgres:", "postgresql:"].includes(url.protocol) && !!url.hostname && url.pathname.length >= 2 && !url.hash);
    ensureAllowedParams(url);
    ensureNoTlsOverrides(env);
    // Neon's pooled (PgBouncer) endpoints reject the startup `options` that migrations and pools send.
    ensure(!/-pooler(\.|$)/.test(url.hostname));
    const mode = url.searchParams.get("sslmode");
    ensure(!mode || ["disable", "verify-full"].includes(mode));
    ensure(isPrivateHost(url.hostname) || mode === "verify-full");
    ensure(!url.searchParams.has("sslrootcert") || mode === "verify-full");
    // Pin the URL policy so pg cannot inherit a different SSL mode from the process.
    url.searchParams.set("sslmode", mode ?? "disable");
    return { connectionString: url.href };
  } catch { throw new OperationError("config"); }
}

function category(error: unknown): OperationError["category"] {
  if (error instanceof OperationError) return error.category;
  const code = (error as {code?: string})?.code;
  if (code === "55P03") return "lock";
  if (code?.startsWith("23")) return "conflict";
  if (code?.startsWith("42")) return "schema";
  if (error instanceof Error && error.message.includes("Another migration is already running")) return "lock";
  return "connection";
}

export function reportError(operation: string, error: unknown) {
  console.error(JSON.stringify({ operation, outcome: "error", category: category(error) }));
}

export function operationalConfig(env: NodeJS.ProcessEnv = process.env): PoolConfig {
  if (!env.MIGRATION_DATABASE_URL) throw new OperationError("config");
  return connectionConfig({...env, DATABASE_URL: env.MIGRATION_DATABASE_URL});
}
