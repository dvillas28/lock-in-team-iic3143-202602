import assert from "node:assert/strict";
import { test } from "node:test";
import type { FetchOptions } from "openapi-fetch";

import { createApiClient, type ApiClient } from "../src/lib/api/client.ts";
import { ApiHttpError, ApiNetworkError, ApiResponseError } from "../src/lib/api/errors.ts";
import { getHealth, type HealthResponse } from "../src/lib/api/health.ts";
import { getCurrentUser, listAccessibleInstitutions } from "../src/lib/api/institutions.ts";
import type { components, operations } from "../src/lib/api/schema";

const baseUrl = "https://api.example.test";
const health: HealthResponse = {
  status: "ok", version: "0.1.0", commit: null,
  deployedAt: "2026-10-07T00:00:00.000Z", timestamp: "2026-10-07T00:01:00.000Z",
};

function mockClient(reply: (request: Request) => Response | Promise<Response>, getToken?: () => string | undefined | Promise<string | undefined>) {
  return createApiClient({
    baseUrl, getToken,
    fetch: async (input) => reply(input instanceof Request ? input : new Request(input)),
  });
}

test("public health is typed, validated, uncached and never sends a session token", async () => {
  let tokenCalls = 0;
  const client = mockClient((request) => {
    assert.equal(request.url, `${baseUrl}/health`);
    assert.equal(request.headers.has("Authorization"), false);
    assert.equal(request.headers.has("Content-Type"), false);
    assert.equal(request.cache, "no-store");
    assert.equal(request.credentials, "omit");
    assert.equal(request.redirect, "error");
    assert.equal(request.headers.get("Accept"), "application/json, application/problem+json");
    return Response.json(health);
  }, () => { tokenCalls++; return "test-token"; });
  assert.deepEqual(await getHealth(client), health);
  await client.GET("/health", { headers: { Authorization: "Bearer explicit-token" } });
  assert.equal(tokenCalls, 0);
});

test("protected institution operations use Bearer, the slug path and generated response types", async () => {
  const institution: components["schemas"]["InstitutionSummary"] = {
    id: "8dc9f252-bf1a-4b50-85c0-a2937484c429", slug: "uc", name: "UC", active: true,
  };
  const me: components["schemas"]["CurrentUser"] = {
    id: "user-id", email: "user@example.test", name: "User",
    institutionMembership: { id: "membership-id", institution, active: true },
    sectionMemberships: [],
  };
  const client = mockClient((request) => {
    assert.equal(request.headers.get("Authorization"), "Bearer test-token");
    assert.equal(request.headers.has("x-tenant"), false);
    assert.equal(request.headers.has("institutionId"), false);
    if (request.url === `${baseUrl}/api/v1/institutions`) return Response.json({ items: [institution] });
    assert.equal(request.url, `${baseUrl}/api/v1/institutions/uc/me`);
    return Response.json(me);
  }, async () => "test-token");
  const { data: list } = await listAccessibleInstitutions(client);
  assert.equal(list?.items[0].slug, "uc");
  const { data: user } = await getCurrentUser(client, "uc");
  assert.deepEqual(user, me);
});

test("tokens are read per request and never shared across client instances", async () => {
  let token: string | undefined = "first";
  const seen: (string | null)[] = [];
  const reply = (request: Request) => {
    seen.push(request.headers.get("Authorization"));
    return Response.json({ items: [] });
  };
  const client = mockClient(reply, () => token);
  await listAccessibleInstitutions(client);
  token = "second";
  await listAccessibleInstitutions(client);
  token = undefined;
  await listAccessibleInstitutions(client);
  await listAccessibleInstitutions(mockClient(reply));
  assert.deepEqual(seen, ["Bearer first", "Bearer second", null, null]);
});

for (const [status, kind] of [[401, "authentication"], [403, "authorization"], [404, "not-found"], [500, "http"]] as const) {
  test(`HTTP ${status} preserves Problem diagnostics and exposes a safe ${kind} message`, async () => {
    const problem: components["schemas"]["Problem"] = {
      type: "https://api.example.test/errors/example", title: "Sensitive title",
      status, detail: "Private resource information", code: "EXAMPLE",
      instance: "/private-resource", traceId: "trace-example",
      errors: [{ field: "name", message: "Sensitive validation", code: null }],
    };
    let calls = 0;
    const client = mockClient(() => {
      calls++;
      return Response.json(problem, { status, headers: { "Content-Type": "application/problem+json; charset=utf-8" } });
    });
    await assert.rejects(listAccessibleInstitutions(client), (error: unknown) => {
      assert.ok(error instanceof ApiHttpError);
      assert.equal(error.kind, kind);
      assert.equal(error.status, status);
      assert.deepEqual(error.problem, problem);
      assert.equal(error.message.includes("Sensitive"), false);
      assert.equal(error.message.includes("Private"), false);
      return true;
    });
    assert.equal(calls, 1);
  });
}

test("HTTP status takes precedence; incomplete and malformed Problem fields are filtered", async () => {
  const client = mockClient(() => Response.json({
    status: 403, type: "about:blank", title: 12, detail: null, code: "NOT_VISIBLE",
    traceId: "trace", instance: false, secret: "discard",
    errors: [null, { field: "name", message: "Invalid", secret: "discard" }, { field: 5, message: "Invalid" }],
  }, { status: 404, headers: { "Content-Type": "application/problem+json" } }));
  await assert.rejects(listAccessibleInstitutions(client), (error: unknown) => {
    assert.ok(error instanceof ApiHttpError);
    assert.equal(error.kind, "not-found");
    assert.deepEqual(error.problem, {
      status: 404, type: "about:blank", detail: null, code: "NOT_VISIBLE", traceId: "trace",
      errors: [{ field: "name", message: "Invalid" }],
    });
    return true;
  });
});

for (const [body, contentType] of [
  ["{invalid", "application/problem+json"], ["", "application/json"],
  ["<html>Private</html>", "text/html"], ['{"detail":"Private"}', "text/plain"],
  ["null", "application/problem+json"], ["[]", "application/json"],
]) {
  test(`malformed/unsupported error body (${contentType}: ${body}) preserves HTTP 401`, async () => {
    const client = mockClient(() => new Response(body, { status: 401, headers: { "Content-Type": contentType } }));
    await assert.rejects(listAccessibleInstitutions(client), (error: unknown) => {
      assert.ok(error instanceof ApiHttpError);
      assert.equal(error.kind, "authentication");
      assert.deepEqual(error.problem, { status: 401 });
      return true;
    });
  });
}

test("connection failures preserve the cause and are distinguishable from HTTP failures", async () => {
  const cause = new TypeError("fetch failed");
  const client = mockClient(() => { throw cause; });
  await assert.rejects(getHealth(client), (error: unknown) => {
    assert.ok(error instanceof ApiNetworkError);
    assert.equal(error.kind, "network");
    assert.equal(error.cause, cause);
    assert.equal(error instanceof ApiHttpError, false);
    return true;
  });
});

test("successful responses without a body are supported", async () => {
  for (const status of [200, 204]) {
    const { data, response } = await listAccessibleInstitutions(mockClient(() => new Response(null, { status })));
    assert.equal(data, undefined);
    assert.equal(response.status, status);
  }
});

test("health retains runtime validation for invalid contract payloads", async () => {
  for (const body of [{ ...health, status: "down" }, { ...health, timestamp: "invalid" }, { ...health, extra: true }]) {
    await assert.rejects(getHealth(mockClient(() => Response.json(body))), ApiResponseError);
  }
});

test("typed query/path/body serialization uses the institutional route", async () => {
  const client = mockClient(async (request) => {
    assert.equal(request.url, `${baseUrl}/api/v1/institutions/utfsm/courses/course-id`);
    assert.equal(request.method, "PATCH");
    assert.equal(request.headers.get("Content-Type"), "application/json");
    assert.equal(request.headers.get("X-Request-Id"), "request-id");
    assert.deepEqual(await request.json(), { name: "New name" });
    return Response.json({ id: "course-id", code: "CODE", name: "New name", term: "2026-2", createdAt: health.timestamp });
  });
  await client.PATCH("/api/v1/institutions/{institutionSlug}/courses/{courseId}", {
    params: { path: { institutionSlug: "utfsm", courseId: "course-id" } },
    headers: { "X-Request-Id": "request-id" }, body: { name: "New name" },
  });
  await mockClient((request) => {
    assert.equal(request.url, `${baseUrl}/api/v1/institutions/uc/users?search=Ana%20Maria&limit=10`);
    return Response.json({ items: [], nextCursor: null, hasMore: false });
  }).GET("/api/v1/institutions/{institutionSlug}/users", {
    params: { path: { institutionSlug: "uc" }, query: { search: "Ana Maria", limit: 10 } },
  });
});

test("configuration distinguishes server/private URL from browser/public URL", async () => {
  const saved = { API_URL: process.env.API_URL, NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL, NODE_ENV: process.env.NODE_ENV };
  const fetcher: typeof fetch = async (input) => Response.json({ url: (input as Request).url });
  try {
    process.env.API_URL = "https://internal.example.test/";
    process.env.NEXT_PUBLIC_API_URL = "https://public.example.test/";
    Object.assign(process.env, { NODE_ENV: "production" });
    const server = await createApiClient({ fetch: fetcher }).GET("/health", { parseAs: "text" });
    assert.match(server.data ?? "", /internal.example.test/);
    delete process.env.API_URL;
    assert.throws(() => createApiClient(), /API_URL/);
    Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
    const browser = await createApiClient({ fetch: fetcher }).GET("/health", { parseAs: "text" });
    assert.match(browser.data ?? "", /public.example.test/);
    delete process.env.NEXT_PUBLIC_API_URL;
    process.env.API_URL = "https://private.example.test";
    assert.throws(() => createApiClient(), /NEXT_PUBLIC_API_URL/);
    Object.assign(process.env, { NODE_ENV: "development" });
    const local = await createApiClient({ fetch: fetcher }).GET("/health", { parseAs: "text" });
    assert.match(local.data ?? "", /localhost:3001/);
  } finally {
    delete (globalThis as { window?: unknown }).window;
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("unsafe base URLs are rejected", () => {
  for (const url of ["file:///tmp/api", "https://user:password@example.test", "https://example.test?secret=value", "https://example.test#fragment"]) {
    assert.throws(() => createApiClient({ baseUrl: url }));
  }
});

// Compile-time regression assertions, checked by pnpm typecheck; never executed.
export function checkRequestTypes(client: ApiClient) {
  // @ts-expect-error The institutional operation requires path parameters.
  client.GET("/api/v1/institutions/{institutionSlug}/me");
  // @ts-expect-error institutionSlug must be a string.
  client.GET("/api/v1/institutions/{institutionSlug}/me", { params: { path: { institutionSlug: 37 } } });
  // @ts-expect-error Only contract paths are accepted.
  client.GET("/api/v1/tenants");
  // @ts-expect-error The query limit is numeric.
  client.GET("/api/v1/institutions/{institutionSlug}/users", { params: { path: { institutionSlug: "uc" }, query: { search: "Ana", limit: "10" } } });
  // @ts-expect-error CourseUpdate.name must be a string.
  client.PATCH("/api/v1/institutions/{institutionSlug}/courses/{courseId}", { params: { path: { institutionSlug: "uc", courseId: "id" } }, body: { name: 37 } });
  // @ts-expect-error Institution context comes from the path, never the request body.
  const courseRequest: FetchOptions<operations["updateCourse"]> = { params: { path: { institutionSlug: "uc", courseId: "id" } }, body: { institutionId: "other" } };
  void courseRequest;
  // @ts-expect-error CourseUpdate is required for PATCH.
  client.PATCH("/api/v1/institutions/{institutionSlug}/courses/{courseId}", { params: { path: { institutionSlug: "uc", courseId: "id" } } });
  // @ts-expect-error ModuleCreate requires a title and position.
  const moduleRequest: FetchOptions<operations["createCourseModule"]> = { params: { path: { institutionSlug: "uc", courseId: "id" } }, body: { title: "Module" } };
  void moduleRequest;
}
