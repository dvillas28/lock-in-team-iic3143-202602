import { OperationError } from "../database/config";

/** Exact browser origins only. CORS never supplies identity or institutional context. */
export function corsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  try {
    const origins: unknown = JSON.parse(env.CORS_ALLOWED_ORIGINS ??
      (env.NODE_ENV === "production" ? "[]" : '["http://localhost:3000"]'));
    if (!Array.isArray(origins) || !origins.every(origin => {
      if (typeof origin !== "string") return false;
      const parsed = new URL(origin);
      return ["http:", "https:"].includes(parsed.protocol) && parsed.origin === origin &&
        !parsed.username && !parsed.password;
    })) throw new OperationError("config");
    if (env.NODE_ENV === "production" && (
      ["https://uc.academix.dvillasc.me", "https://utfsm.academix.dvillasc.me"].some(origin => !origins.includes(origin)) ||
      origins.some(origin => new URL(origin).protocol !== "https:")
    )) throw new OperationError("config");
    return origins;
  } catch { throw new OperationError("config"); }
}

export function corsOptions(env: NodeJS.ProcessEnv = process.env) {
  return {
    origin: corsOrigins(env), credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "Idempotency-Key", "Accept"],
    exposedHeaders: ["Location", "Retry-After"], optionsSuccessStatus: 204,
  };
}
