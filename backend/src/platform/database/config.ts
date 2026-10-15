import { isIP } from "node:net";
import type { PoolConfig } from "pg";

export class OperationError extends Error {
  constructor(public readonly category: "config" | "connection" | "schema" | "lock" | "conflict") {
    super(category);
  }
}

export function connectionConfig(env: NodeJS.ProcessEnv = process.env): PoolConfig {
  try {
    const url = new URL(env.DATABASE_URL ?? "");
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2 || url.hash) throw new Error();
    // libpq URL options can override TLS verification and connection timeouts.
    for (const key of url.searchParams.keys()) {
      if (!["sslmode", "sslrootcert"].includes(key)) throw new Error();
      if (url.searchParams.getAll(key).length !== 1) throw new Error();
    }
    const mode = url.searchParams.get("sslmode");
    if (env.NODE_TLS_REJECT_UNAUTHORIZED === "0" || process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0"
      || env.PGSSLMODE === "no-verify" || process.env.PGSSLMODE === "no-verify") throw new Error();
    const privateHost = ["localhost", "127.0.0.1", "[::1]", "postgres"].includes(url.hostname)
      || url.hostname.endsWith(".railway.internal")
      || (isIP(url.hostname) === 4 && (/^10\./.test(url.hostname) || /^192\.168\./.test(url.hostname)
        || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(url.hostname)));
    if (mode && !["disable", "verify-full"].includes(mode)) throw new Error();
    if (!privateHost && mode !== "verify-full") throw new Error();
    if (url.searchParams.has("sslrootcert") && mode !== "verify-full") throw new Error();
    // Pin the URL policy so pg cannot inherit a different SSL mode from the process.
    url.searchParams.set("sslmode", mode ?? "disable");
    return { connectionString: url.href };
  } catch { throw new OperationError("config"); }
}

export function category(error: unknown): OperationError["category"] {
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
