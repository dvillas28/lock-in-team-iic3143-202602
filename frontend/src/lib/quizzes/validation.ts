import type { components } from "../api/schema";
import { ApiResponseError } from "../api/errors.ts";
import { isRecord } from "../auth/validation.ts";
import { FieldError, isId, list } from "../courses/validation.ts";
export type Summary = components["schemas"]["QuizSummary"];
export type SafeQuiz = components["schemas"]["QuizStudentView"];
export type Authoring = components["schemas"]["QuizAuthoringView"];
export type Create = components["schemas"]["QuizCreate"];
export type Update = components["schemas"]["QuizUpdate"];
export type Question = components["schemas"]["QuestionUpdate"];
export type GradeItem = components["schemas"]["GradeItem"];
const fail = (field: string, message: string): never => { throw new FieldError(field, message); };
function string(v: unknown, field: string, max = Infinity, blank = false): string {
  if (typeof v !== "string" || (!blank && !v.trim()) || [...v].length > max || v.includes("\0")) return fail(field, "Revisa el texto y su límite; no se admite NUL.");
  return v;
}
export function timestamp(v: unknown, field: string): string | null {
  if (v === null) return null;
  const m = typeof v === "string" && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/.exec(v);
  if (!m || +m[1] === 0 || +m[2] < 1 || +m[2] > 12 || +m[3] < 1 || +m[3] > new Date(Date.UTC(+m[1], +m[2], 0)).getUTCDate() || +m[4] > 23 || +m[5] > 59 || +m[6] > 59 || !Number.isFinite(Date.parse(v as string))) return fail(field, "Ingresa fecha válida con zona horaria.");
  return v as string;
}
// Date.parse truncates microseconds; preserve the backend's six-digit ordering.
function instant(value: string) {
  const fraction = /\.(\d{1,6})/.exec(value)?.[1] ?? "";
  return BigInt(Date.parse(value)) * BigInt(1000) + BigInt(fraction.padEnd(6,"0").slice(3));
}
function integer(v: unknown, field: string) {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 2147483647) return fail(field, "Ingresa un entero entre 1 y 2147483647.");
  return v;
}
function object(v: unknown, keys: string[], field: string): Record<string, unknown> {
  if (!isRecord(v) || Object.keys(v).some(k => !keys.includes(k))) return fail(field, "Campos inválidos.");
  return v;
}
export function questionsInput(v: unknown, current?: Authoring): Question[] {
  if (!Array.isArray(v)) return fail("questions", "Revisa las preguntas.");
  const questions = v.map((value, i) => {
    const f = `questions.${i}`, q = object(value, current ? ["id","prompt","position","points","alternatives"] : ["prompt","position","points","alternatives"], f);
    if (q.id !== undefined && (!isId(q.id) || !current?.questions.some(p => p.id === q.id))) fail(f, "UUID de pregunta ajeno o inválido.");
    const points = q.points;
    if (typeof points !== "number" || !Number.isFinite(points) || points <= 0 || points > 999999.99 || Number(points.toFixed(2)) !== points) fail(f + ".points", "Puntaje positivo hasta 999999.99, con hasta dos decimales.");
    if (!Array.isArray(q.alternatives)) return fail(f, "Agrega al menos dos alternativas.");
    const alternatives = q.alternatives.map((value, j) => {
      const a = object(value, ["id","text","isCorrect"], f);
      if (typeof a.isCorrect !== "boolean") fail(f, "Selecciona una alternativa correcta.");
      return { id: string(a.id, f + `.alternatives.${j}.id`), text: string(a.text, f + `.alternatives.${j}.text`), isCorrect: a.isCorrect as boolean };
    });
    if (alternatives.length < 2 || new Set(alternatives.map(a => a.id)).size !== alternatives.length || alternatives.filter(a => a.isCorrect).length !== 1) fail(f, "Se requieren al menos dos alternativas con ID único y exactamente una correcta.");
    return { ...(q.id === undefined ? {} : {id: q.id as string}), prompt: string(q.prompt, f + ".prompt"), position: integer(q.position, f + ".position"), points: points as number, alternatives };
  });
  const ids = questions.flatMap(q => q.id ? [q.id] : []);
  if (new Set(ids).size !== ids.length || new Set(questions.map(q => q.position)).size !== questions.length || questions.reduce((n,q) => n + Math.round(q.points * 100), 0) > 99999999) fail("questions", "Revisa IDs, posiciones únicas y suma máxima de 999999.99 puntos.");
  return questions;
}
export function jsonBody<T>(body: T): T {
  if (new TextEncoder().encode(JSON.stringify(body)).length > 4096) fail("form", "El JSON completo supera 4096 bytes UTF-8. Reduce el contenido sin perder tu borrador.");
  return body;
}
export function quizInput(value: unknown, current?: Authoring): Update {
  const v = object(value, ["title","sectionId","instructions","opensAt","closesAt","maxAttempts","questions"], "form");
  const out: Update = {};
  if (!current || "title" in v) out.title = string(typeof v.title === "string" ? v.title.trim() : v.title, "title", 200);
  if ("sectionId" in v) { if (v.sectionId !== null && !isId(v.sectionId)) fail("sectionId", "Selecciona una sección válida."); out.sectionId = v.sectionId as string | null; }
  if ("instructions" in v) out.instructions = v.instructions === null ? null : string(v.instructions, "instructions", 10000, true);
  for (const k of ["opensAt","closesAt"] as const) if (k in v) out[k] = timestamp(v[k], k);
  const opens = out.opensAt === undefined ? current?.opensAt : out.opensAt, closes = out.closesAt === undefined ? current?.closesAt : out.closesAt;
  if (opens && closes && instant(opens) >= instant(closes)) fail("closesAt", "El cierre debe ser posterior a la apertura.");
  if ("maxAttempts" in v) out.maxAttempts = v.maxAttempts === null ? null : integer(v.maxAttempts, "maxAttempts");
  if ("questions" in v) out.questions = questionsInput(v.questions, current);
  if (!Object.keys(out).length) fail("form", "No hay cambios para guardar.");
  return jsonBody(out);
}
export function summary(v: unknown, courseId: string, expected?: string): Summary {
  try {
    if (!isRecord(v) || !isId(v.id) || v.courseId !== courseId || !isId(courseId) || (expected && v.id !== expected) || (v.sectionId !== null && !isId(v.sectionId))) throw new ApiResponseError();
    string(v.title, "title", 200); if (v.instructions !== null) string(v.instructions, "instructions", 10000, true);
    const opensAt = timestamp(v.opensAt, "opensAt"), closesAt = timestamp(v.closesAt, "closesAt"), publishedAt = timestamp(v.publishedAt, "publishedAt");
    if ((opensAt && closesAt && instant(opensAt) >= instant(closesAt)) || (v.maxAttempts !== null && !integer(v.maxAttempts,"maxAttempts")) || !["draft","published"].includes(v.status as string) || (v.status === "draft") !== (publishedAt === null)) throw new ApiResponseError();
    return { id:v.id, courseId, sectionId:v.sectionId as string|null, title:v.title as string, instructions:v.instructions as string|null, opensAt, closesAt, maxAttempts:v.maxAttempts as number|null, status:v.status as Summary["status"], publishedAt };
  } catch { throw new ApiResponseError(); }
}
export function quizDto(v: unknown, courseId: string, expected: string | undefined, authoring: true): Authoring;
export function quizDto(v: unknown, courseId: string, expected?: string, authoring?: false): SafeQuiz;
export function quizDto(v: unknown, courseId: string, expected?: string, authoring = false): SafeQuiz | Authoring {
  try {
    const base = summary(v, courseId, expected);
    if (!isRecord(v) || !Array.isArray(v.questions) || (authoring && !isId(v.createdBy))) throw new ApiResponseError();
    const questions = v.questions.map(q => {
      if (!isRecord(q) || !isId(q.id) || !Array.isArray(q.alternatives)) throw new ApiResponseError();
      const alternatives = q.alternatives.map(a => {
        if (!isRecord(a) || (authoring && typeof a.isCorrect !== "boolean")) throw new ApiResponseError();
        return {id:string(a.id,"questions"),text:string(a.text,"questions"),...(authoring ? {isCorrect:a.isCorrect as boolean} : {})};
      });
      if (typeof q.points !== "number" || !Number.isFinite(q.points) || q.points <= 0 || q.points > 999999.99 || Number(q.points.toFixed(2)) !== q.points || alternatives.length < 2 || new Set(alternatives.map(a=>a.id)).size !== alternatives.length) throw new ApiResponseError();
      return {id:q.id,prompt:string(q.prompt,"questions"),position:integer(q.position,"questions"),points:q.points,alternatives};
    });
    if (new Set(questions.map(q=>q.id)).size !== questions.length || new Set(questions.map(q=>q.position)).size !== questions.length || questions.reduce((n,q)=>n+Math.round(q.points*100),0)>99999999) throw new ApiResponseError();
    if (authoring) {
      const result = {...base,createdBy:v.createdBy as string,questions} as Authoring;
      questionsInput(result.questions,result);
      return result;
    }
    return {...base,questions} as SafeQuiz;
  } catch { throw new ApiResponseError(); }
}
export const quizList = (v: unknown, courseId: string) => list(v, q => summary(q, courseId));
export function gradeItem(v: unknown, courseId: string): GradeItem {
  if (!isRecord(v) || !isId(v.id) || v.courseId !== courseId || !isId(v.quizId) || typeof v.title !== "string" || typeof v.weightPercent !== "number" || !Number.isFinite(v.weightPercent) || v.weightPercent < 0 || v.weightPercent > 100 || Number(v.weightPercent.toFixed(2)) !== v.weightPercent) throw new ApiResponseError();
  try { if (!timestamp(v.createdAt,"createdAt")) throw new ApiResponseError(); } catch { throw new ApiResponseError(); }
  return {id:v.id,courseId,quizId:v.quizId,title:v.title,weightPercent:v.weightPercent,createdAt:v.createdAt as string};
}
