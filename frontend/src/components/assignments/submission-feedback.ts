import { ApiHttpError } from "../../lib/api/errors.ts";
import { getRouteFeedback } from "../../lib/route-feedback.ts";

const messages: Record<string,string> = {
 SUBMISSION_NOT_OPEN:"La tarea aún no está abierta.",
 SUBMISSION_CLOSED:"La recepción de entregas ya cerró.",
 SUBMISSION_ATTEMPTS_EXHAUSTED:"Ya utilizaste todos los intentos disponibles.",
 SUBMISSION_ATTEMPTS_CHANGED:"El historial cambió. Revísalo antes de volver a entregar.",
 SUBMISSION_TEXT_NOT_ALLOWED:"La tarea ya no acepta respuestas escritas.",
 SUBMISSION_FORMAT_NOT_ALLOWED:"Uno de los archivos no tiene un formato permitido para esta tarea.",
 SUBMISSION_TEXT_EMPTY:"Escribe una respuesta con contenido.",
 SUBMISSION_TEXT_INVALID:"La respuesta admite hasta 10.000 caracteres.",
 SUBMISSION_CONTENT_REQUIRED:"Escribe una respuesta o selecciona un archivo permitido.",
 SUBMISSION_STORAGE_UNAVAILABLE:"El almacenamiento de archivos no está disponible. Reintenta en unos momentos.",
 INTEGRATION_NOT_CONFIGURED:"El almacenamiento de archivos no está habilitado.",
 GRADE_POINTS_OUT_OF_RANGE:"El puntaje está fuera del rango de la tarea.",
 GRADE_DRAFT_CHANGED:"El borrador cambió. Actualiza las entregas y vuelve a revisar la nota.",
 GRADE_REVISION_CHANGED:"La nota publicada cambió. Actualiza la revisión antes de corregirla.",
 ASSIGNMENT_HAS_SUBMISSIONS:"Los destinatarios quedan fijos después de la primera entrega.",
 ASSIGNMENT_HAS_GRADES:"El puntaje máximo queda fijo después de guardar la primera calificación.",
};

export function submissionError(error: unknown) {
 if (error instanceof ApiHttpError) {
  if (error.status===413) return "Selecciona hasta 5 archivos de 10 MiB cada uno. El límite por formato puede ser menor.";
  if (error.status===415) return "Revisa que el contenido de cada archivo corresponda al formato indicado.";
  const code=error.problem.code;
  if (code && Object.hasOwn(messages,code)) return messages[code];
 }
 return getRouteFeedback(error).message;
}

export const uncertainResult=(error:unknown)=>!(error instanceof ApiHttpError) || error.status>=500;
