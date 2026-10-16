import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import { randomUUID } from "node:crypto";

const problems: Record<number, [string, string, string]> = {
  400: ["BAD_REQUEST", "Solicitud inválida", "La solicitud no es válida."],
  401: ["UNAUTHORIZED", "Autenticación requerida", "Se requiere una identidad autenticada válida."],
  403: ["FORBIDDEN", "Acceso prohibido", "La acción no está permitida."],
  404: ["RESOURCE_NOT_FOUND", "Recurso no encontrado", "El recurso no existe o no es visible en el contexto autorizado."],
  409: ["CONFLICT", "Conflicto", "La operación entra en conflicto con el estado actual."],
  422: ["UNPROCESSABLE_ENTITY", "Restricción de dominio", "La operación viola una restricción de dominio."],
  413: ["PAYLOAD_TOO_LARGE", "Cuerpo excesivo", "El cuerpo supera el límite permitido."],
  415: ["UNSUPPORTED_MEDIA_TYPE", "Tipo no admitido", "Se requiere application/json."],
  429: ["TOO_MANY_REQUESTS", "Demasiadas solicitudes", "Intente nuevamente después del bloqueo."],
  500: ["INTERNAL_ERROR", "Error interno", "No se pudo completar la operación."],
  503: ["SERVICE_UNAVAILABLE", "Servicio no disponible", "Una dependencia no está disponible."],
};

@Catch()
export class ProblemFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const databaseCode=(error as {code?:string})?.code;
    const unavailable=typeof databaseCode==="string" && (databaseCode.startsWith("08") || ["57P01","57P02","57P03","53300","ECONNREFUSED","ECONNRESET","ETIMEDOUT"].includes(databaseCode));
    const status = error instanceof HttpException ? error.getStatus() : unavailable ? 503 : 500;
    const path = (request.originalUrl ?? request.url).split("?", 1)[0];
    if (/^\/ready\/?$/i.test(path) && status === 503) {
      response.status(503).json({status: "unavailable"}); return;
    }
    const [code, title, detail] = problems[status] ?? problems[500];
    response.setHeader("Content-Type", "application/problem+json");
    response.setHeader("Cache-Control", "no-store");
    if (status === 401) response.setHeader("WWW-Authenticate", "Bearer");
    const payload = error instanceof HttpException ? error.getResponse() : null;
    const field = payload && typeof payload === "object" && "field" in payload ? payload.field : null;
    const errors = status === 400 && typeof field === "string" && ["body", "email", "password", "institutionSlug"].includes(field)
      ? [{field, message: "Campo inválido."}] : [];
    response.status(status).json({type: `https://academix/errors/${code.toLowerCase().replaceAll("_", "-")}`,
      title, status, detail, code, instance: path, traceId: randomUUID(), errors});
  }
}
