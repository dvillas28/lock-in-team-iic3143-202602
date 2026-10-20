import { createApiClient, type ApiClient } from "./client.ts";
import { ApiResponseError } from "./errors.ts";
import type { components } from "./schema";

export type HealthResponse = components["schemas"]["HealthResponse"];

function isHealthResponse(data: unknown): data is HealthResponse {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const candidate = data as Record<string, unknown>;

  return (
    Object.keys(candidate).length === 5 &&
    candidate.status === "ok" &&
    typeof candidate.version === "string" &&
    (typeof candidate.commit === "string" || candidate.commit === null) &&
    typeof candidate.deployedAt === "string" &&
    !Number.isNaN(Date.parse(candidate.deployedAt)) &&
    typeof candidate.timestamp === "string" &&
    !Number.isNaN(Date.parse(candidate.timestamp))
  );
}

export async function getHealth(client: ApiClient = createApiClient()): Promise<HealthResponse> {
  const { data } = await client.GET("/health");

  if (!isHealthResponse(data)) {
    throw new ApiResponseError();
  }

  return data;
}
