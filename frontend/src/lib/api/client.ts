import createClient from "openapi-fetch";

import { ApiNetworkError, toApiHttpError } from "./errors.ts";
import type { paths } from "./schema";

type ApiClientOptions = {
  baseUrl?: string;
  /** Supply the current session's token; create a separate client per server request. */
  getToken?: () => string | undefined | Promise<string | undefined>;
  fetch?: typeof globalThis.fetch;
};

export function createApiClient({
  baseUrl,
  getToken,
  fetch: fetcher = globalThis.fetch,
}: ApiClientOptions = {}) {
  const browser = typeof window !== "undefined";
  const configuredUrl = baseUrl ?? (browser
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.API_URL);
  const url = configuredUrl ?? (process.env.NODE_ENV === "production"
    ? undefined
    : "http://localhost:3001");

  if (!url) {
    throw new Error(`Configure ${browser ? "NEXT_PUBLIC_API_URL" : "API_URL"} for the API client`);
  }

  const parsedUrl = new URL(url);
  if (!["http:", "https:"].includes(parsedUrl.protocol) || parsedUrl.username ||
      parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
    throw new Error("The API base URL must be an HTTP(S) URL without credentials, query or fragment");
  }

  const client = createClient<paths>({
    baseUrl: url.replace(/\/+$/, ""),
    fetch: fetcher,
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
    headers: { Accept: "application/json, application/problem+json" },
  });

  client.use({
    async onRequest({ request, schemaPath }) {
      // /health is the contract's only public operation. Do not send a session token.
      if (schemaPath === "/health") {
        request.headers.delete("Authorization");
      } else if (getToken) {
        const token = await getToken();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        } else {
          request.headers.delete("Authorization");
        }
      }
    },
    async onResponse({ response }) {
      if (!response.ok) throw await toApiHttpError(response);
    },
    onError({ error }) {
      return new ApiNetworkError(error);
    },
  });

  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;
