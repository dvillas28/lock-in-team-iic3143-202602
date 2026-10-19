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
    return {
      title: titles[error.kind],
      message: new ApiHttpError(error.status).message,
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
