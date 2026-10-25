export const DEFAULT_PORTAL_ORIGIN = "https://academix-frontend-2ixy.onrender.com";

/** Canonical origins only: no paths, credentials, query, hash or implicit ports. */
export function isFrontendOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const local = url.hostname === "localhost" || url.hostname.endsWith(".localhost") ||
      url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    return url.origin === origin && !url.username && !url.password &&
      (url.protocol === "https:" || (url.protocol === "http:" && local));
  } catch { return false; }
}

/** Separate public build configuration. Present but invalid never falls back. */
export function portalOrigin(): string | undefined {
  const origin = process.env.NEXT_PUBLIC_PORTAL_ORIGIN ?? DEFAULT_PORTAL_ORIGIN;
  return isFrontendOrigin(origin) ? origin : undefined;
}
