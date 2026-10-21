/** Exact browser origins only. CORS never supplies identity or institutional context. */
export function corsOptions(env: NodeJS.ProcessEnv = process.env) {
  let origins: unknown;
  try { origins = JSON.parse(env.CORS_ALLOWED_ORIGINS ?? (env.NODE_ENV === "production" ? "[]" : '["http://localhost:3000"]')); }
  catch { throw new Error("Invalid CORS configuration"); }
  if (!Array.isArray(origins) || !origins.every(origin => {
    if (typeof origin !== "string") return false;
    try {
      const parsed = new URL(origin);
      return ["http:", "https:"].includes(parsed.protocol) && parsed.origin === origin && !parsed.username && !parsed.password;
    } catch { return false; }
  })) throw new Error("Invalid CORS configuration");
  return {
    origin: origins as string[], credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "Idempotency-Key", "Accept"],
    exposedHeaders: ["Location", "Retry-After"], optionsSuccessStatus: 204,
  };
}
