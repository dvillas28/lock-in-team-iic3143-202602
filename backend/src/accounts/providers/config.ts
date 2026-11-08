/** Configuration is backend-only. Incomplete integrations remain unavailable. */
export function activationOrigins(env: NodeJS.ProcessEnv = process.env): ReadonlyMap<string, string> {
  try {
    const raw = env.ACTIVATION_ORIGINS_BY_INSTITUTION;
    if (!raw) return new Map();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return new Map();
    const entries = Object.entries(parsed);
    if (!entries.length || !entries.every(([slug, origin]) => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || typeof origin !== "string") return false;
      const url = new URL(origin);
      return url.origin === origin && !url.username && !url.password &&
        (url.protocol === "https:" || (env.NODE_ENV !== "production" && url.protocol === "http:" &&
          /^(?:[a-z0-9-]+\.)?localhost$/.test(url.hostname)));
    })) return new Map();
    return new Map(entries as [string, string][]);
  } catch { return new Map(); }
}

export function configuredMailFrom(value: string | undefined): value is string {
  if (!value || /[\r\n]/.test(value)) return false;
  return /^[^<>\r\n]{1,80} <[^<>\s@]+@[^<>\s@.]+(?:\.[^<>\s@.]+)+>$/.test(value);
}
