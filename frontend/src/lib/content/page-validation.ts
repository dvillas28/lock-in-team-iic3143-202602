import { REQUEST_LIMIT_BYTES, requestBytes } from "./markdown-edit.ts";

export type PageValues = { title: string; markdownBody: string };
export type PageErrors = { title?: string; markdownBody?: string };

/** Fields that would be sent: everything on create, only what changed on edit (mirrors the PATCH body). */
export function pagePayload(values: PageValues, original?: PageValues): Partial<PageValues> {
  const title = values.title.trim();
  if (!original) return { title, markdownBody: values.markdownBody };
  return { ...(title !== original.title ? { title } : {}), ...(values.markdownBody !== original.markdownBody ? { markdownBody: values.markdownBody } : {}) };
}
export const pageChanged = (values: PageValues, original?: PageValues) => !original || Object.keys(pagePayload(values, original)).length > 0;
/** Bytes still free in the single JSON write; negative when the page is too long to be accepted. */
export const pageRoom = (values: PageValues, original?: PageValues) => REQUEST_LIMIT_BYTES - requestBytes(pagePayload(values, original));

export function pageErrors(values: PageValues, original?: PageValues): PageErrors {
  const errors: PageErrors = {};
  const title = values.title.trim();
  if (!title) errors.title = "Ingresa un título.";
  else if ([...title].length > 200) errors.title = "El título admite hasta 200 caracteres.";
  else if (title.includes("\0")) errors.title = "El título contiene un carácter no válido.";
  const body = values.markdownBody;
  if (!body.trim()) errors.markdownBody = "Escribe el contenido de la página.";
  else if (body.includes("\0")) errors.markdownBody = "El contenido contiene un carácter no válido.";
  else if ([...body].length > 10000) errors.markdownBody = "La página admite hasta 10 000 caracteres.";
  else if (pageRoom(values, original) < 0) errors.markdownBody = "La página es demasiado larga para guardarla. Acórtala o divídela en dos páginas.";
  return errors;
}
