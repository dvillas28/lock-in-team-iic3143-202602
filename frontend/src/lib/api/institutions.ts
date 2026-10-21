import type { ApiClient } from "./client.ts";
import type { operations } from "./schema";

/** Live backend authorization is evaluated on every operation. */
export function listAccessibleInstitutions(client: ApiClient) {
  return client.GET("/api/v1/institutions");
}

export function getCurrentUser(
  client: ApiClient,
  institutionSlug: operations["getCurrentUser"]["parameters"]["path"]["institutionSlug"],
) {
  return client.GET("/api/v1/institutions/{institutionSlug}/me", {
    params: { path: { institutionSlug } },
  });
}
