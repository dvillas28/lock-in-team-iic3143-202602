import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import { reportError } from "../database/config";
import { randomUUID } from "node:crypto";

const problems: Record<number, [string, string, string]> = {
  400: ["BAD_REQUEST", "Solicitud inválida", "La solicitud no es válida."],
  401: ["UNAUTHORIZED", "Autenticación requerida", "Se requiere una identidad autenticada válida."],
  403: ["FORBIDDEN", "Acceso prohibido", "La acción no está permitida."],
  404: ["RESOURCE_NOT_FOUND", "Recurso no encontrado", "El recurso no existe o no es visible en el contexto autorizado."],
  409: ["CONFLICT", "Conflicto", "La operación entra en conflicto con el estado actual."],
  410: ["DATA_PURGED", "Datos depurados", "Los datos temporales de esta operación ya fueron depurados."],
  422: ["UNPROCESSABLE_ENTITY", "Restricción de dominio", "La operación viola una restricción de dominio."],
  413: ["PAYLOAD_TOO_LARGE", "Cuerpo excesivo", "El cuerpo supera el límite permitido."],
  415: ["UNSUPPORTED_MEDIA_TYPE", "Tipo no admitido", "El contenido de la solicitud no tiene un formato admitido."],
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
    const [defaultCode, title, detail] = problems[status] ?? problems[500];
    if(status>=500)reportError("http",error);
    const domain=error instanceof HttpException?error.getResponse():null;
    const candidate=domain && typeof domain==="object" && "code" in domain?domain.code:null;
    const allowed:Record<number,string[]>={409:["GRADE_WEIGHTS_LOCKED","GRADE_ALREADY_PUBLISHED","IDEMPOTENCY_CONFLICT","INVITATION_LOGIN_REQUIRED",
      "USE_GRADE_GROUPS","GRADEBOOK_CHANGED","GRADEBOOK_CONFIRM_RECALCULATION","GRADE_NOT_PUBLISHED","GRADE_REVISION_CHANGED","ASSIGNMENT_CHANGED","LAST_SECTION_TEACHER","SECTION_CAPACITY_DECREASE","SECTION_CAPACITY_BELOW_ENROLLMENTS"],
      422:["INVALID_GRADE_GROUPS","GRADE_POINTS_OUT_OF_RANGE","INVALID_GRADE_GROUP","INVALID_ASSIGNMENT_DATES","INVALID_ASSIGNMENT_POINTS","ASSIGNMENT_DUE_DATE_IN_PAST"],410:["DATA_PURGED"],503:["INTEGRATION_NOT_CONFIGURED","AVATAR_STORAGE_UNAVAILABLE"]};
    const code=typeof candidate==="string" && allowed[status]?.includes(candidate)?candidate:defaultCode;
    if(status===429 && domain && typeof domain==="object" && "retryAfter" in domain && typeof domain.retryAfter==="number")
      response.setHeader("Retry-After",String(Math.max(1,Math.min(86400,Math.ceil(domain.retryAfter)))));
    response.setHeader("Content-Type", "application/problem+json");
    response.setHeader("Cache-Control", "no-store");
    if (status === 401) response.setHeader("WWW-Authenticate", "Bearer");
    const payload = error instanceof HttpException ? error.getResponse() : null;
    const field = payload && typeof payload === "object" && "field" in payload ? payload.field : null;
    const errors = status === 400 && typeof field === "string" && ["body","email","password","institutionSlug","name","bio","expectedUpdatedAt","currentPassword","newPassword","confirmPassword","token","file"].includes(field)
      ? [{field, message: "Campo inválido."}] : [];
    response.status(status).json({type: `https://academix/errors/${code.toLowerCase().replaceAll("_", "-")}`,
      title, status, detail, code, instance: path, traceId: randomUUID(), errors});
  }
}
