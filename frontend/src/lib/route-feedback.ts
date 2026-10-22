import { ApiHttpError, ApiNetworkError, ApiResponseError } from "./api/errors.ts";

export type RouteFeedback = Readonly<{
  title: string;
  message: string;
  retryable: boolean;
}>;

/** Map errors where they are caught; server error boundaries may receive a redacted Error. */
export function getRouteFeedback(error: unknown): RouteFeedback {
  if (error instanceof ApiHttpError) {
    const titles = {
      authentication: "Sesión requerida",
      authorization: "Permisos insuficientes",
      "not-found": "Recurso no disponible",
      http: "No se pudo completar la solicitud",
    };
    const statuses: Record<number, string> = {
      400: " Solicitud o cursor inválido (400). Reinicia los filtros.",
      409: " Conflicto con el estado actual (409). Revisa la operación.",
      422: " Los valores enviados no cumplen las reglas (422).",
      503: " Servicio temporalmente no disponible (503).",
    };
    const conflicts: Record<string, string> = {
      IDEMPOTENCY_CONFLICT: " La clave pertenece a otra operación. Conserva la clave y revisa el contexto.",
      GRADE_ALREADY_PUBLISHED: " La selección incluye notas ya publicadas e inmutables.",
      GRADE_WEIGHTS_LOCKED: " Los pesos están bloqueados por una publicación.",
    };
    const conflict = error.status === 409 && Object.hasOwn(conflicts, error.problem.code ?? "")
      ? conflicts[error.problem.code!] : undefined;
    return {
      title: titles[error.kind],
      message: new ApiHttpError(error.status).message + (conflict || statuses[error.status] || ""),
      retryable: error.status >= 500,
    };
  }

  if (error instanceof ApiNetworkError || error instanceof ApiResponseError) {
    return {
      title: "Servicio no disponible",
      message: error instanceof ApiNetworkError
        ? "No se pudo conectar con el backend. Inténtalo nuevamente."
        : "No se pudo cargar el contenido. Inténtalo nuevamente.",
      retryable: true,
    };
  }

  return {
    title: "No se pudo cargar el contenido",
    message: "Ocurrió un problema inesperado. Inténtalo nuevamente.",
    retryable: true,
  };
}
