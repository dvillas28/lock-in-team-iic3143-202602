export type HealthResponse = {
  status: "ok";
  version: string;
  timestamp: string;
};

function isHealthResponse(data: unknown): data is HealthResponse {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const candidate = data as Record<string, unknown>;

  return (
    Object.keys(candidate).length === 3 &&
    candidate.status === "ok" &&
    typeof candidate.version === "string" &&
    typeof candidate.timestamp === "string" &&
    !Number.isNaN(Date.parse(candidate.timestamp))
  );
}

export async function getHealth(): Promise<HealthResponse> {
  const apiUrl = process.env.API_URL ?? "http://localhost:3001";

  const response = await fetch(`${apiUrl}/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  const data: unknown = await response.json();

  if (!isHealthResponse(data)) {
    throw new Error("Health check returned an invalid response");
  }

  return data;
}
