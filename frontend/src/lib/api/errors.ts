import type { components } from "./schema";

type Problem = components["schemas"]["Problem"];
type ProblemFieldError = components["schemas"]["ProblemFieldError"];
type HttpErrorKind = "authentication" | "authorization" | "not-found" | "http";

export class ApiHttpError extends Error {
  readonly kind: HttpErrorKind;
  readonly status: number;
  /** Diagnostic metadata only. Show message in the UI, not server detail/title/errors. */
  readonly problem: Partial<Problem> & { status: number };

  constructor(status: number, problem: Partial<Problem> = {}) {
    const kind = status === 401 ? "authentication"
      : status === 403 ? "authorization"
      : status === 404 ? "not-found" : "http";
    const messages = {
      authentication: "Se requiere una sesión válida para continuar.",
      authorization: "No tienes permisos para realizar esta operación.",
      "not-found": "El recurso no existe o no está disponible.",
      http: "No se pudo completar la solicitud.",
    };
    super(messages[kind]);
    this.name = "ApiHttpError";
    this.kind = kind;
    this.status = status;
    // The actual HTTP response determines classification, even if Problem disagrees.
    this.problem = { ...problem, status };
  }
}

export class ApiNetworkError extends Error {
  readonly kind = "network";

  constructor(cause: unknown) {
    super("No se pudo conectar con el backend.", { cause });
    this.name = "ApiNetworkError";
  }
}

export class ApiResponseError extends Error {
  readonly kind = "invalid-response";

  constructor() {
    super("El backend devolvió una respuesta inválida.");
    this.name = "ApiResponseError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFieldError(value: unknown): value is ProblemFieldError {
  return isRecord(value) && typeof value.field === "string" &&
    typeof value.message === "string" &&
    (value.code === undefined || value.code === null || typeof value.code === "string");
}

/** Tolerate incomplete/malformed Problem payloads without losing the HTTP status. */
export async function toApiHttpError(response: Response): Promise<ApiHttpError> {
  const problem: Partial<Problem> = {};
  const mediaType = response.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase();
  if (mediaType === "application/problem+json" || mediaType === "application/json") {
    try {
      const data: unknown = await response.json();
      if (isRecord(data)) {
        for (const key of ["type", "title", "code", "traceId"] as const) {
          if (typeof data[key] === "string") problem[key] = data[key];
        }
        for (const key of ["detail", "instance"] as const) {
          if (typeof data[key] === "string" || data[key] === null) problem[key] = data[key];
        }
        if (Array.isArray(data.errors)) {
          problem.errors = data.errors.filter(isFieldError).map(({ field, message, code }) => ({
            field, message, ...(code === undefined ? {} : { code }),
          }));
        }
      }
    } catch {
      // Empty, invalid JSON, or an unreadable error body still has a meaningful status.
    }
  }
  return new ApiHttpError(response.status, problem);
}
