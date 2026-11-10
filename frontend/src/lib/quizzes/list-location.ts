import { isId } from "../courses/validation.ts";

export type QuizFilters = { query: string; status: string; section: string };
export type QuizSearchParams = Record<string, string | string[] | undefined>;

export function quizListLocation(params: QuizSearchParams) {
  const filters: QuizFilters = {
    query: typeof params.q === "string" ? params.q : "",
    status: params.estado === "draft" || params.estado === "published" ? params.estado : "",
    section: params.seccion === "course" || isId(params.seccion) ? params.seccion : "",
  };
  return { filters, createdId: isId(params.creado) ? params.creado : undefined };
}

export function quizListQuery({ query, status, section }: QuizFilters, createdId?: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (status) params.set("estado", status);
  if (section) params.set("seccion", section);
  if (createdId) params.set("creado", createdId);
  return params.size ? `?${params}` : "";
}
