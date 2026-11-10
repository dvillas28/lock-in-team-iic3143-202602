import type { Authoring, Update } from "./validation.ts";
import { FieldError } from "../courses/validation.ts";
import { chileCandidates, chileInstant, localChile } from "../assignments/dates.ts";

/** Reject duplicate controls and files instead of silently coercing their values. */
export function formValue(form: FormData, name: string): string {
  const values = form.getAll(name);
  if (values.length > 1 || values.some(value => typeof value !== "string"))
    throw new FieldError(name, "Revisa este campo: debe contener un único valor.");
  return (values[0] as string | undefined) ?? "";
}

export function formNumber(value: string, field: string, integer = false): number {
  if (!integer && !value) throw new FieldError(field, "Ingresa el puntaje de esta pregunta.");
  if (!(integer ? /^\d+$/ : /^\d+(?:\.\d{1,2})?$/).test(value))
    throw new FieldError(field, integer ? "Ingresa un número entero mayor que cero." : "Ingresa un puntaje positivo con hasta dos decimales.");
  const number = Number(value);
  if (integer && number === 0)
    throw new FieldError(field, "Ingresa al menos 1 intento o deja el campo en blanco para permitir intentos ilimitados.");
  if (!Number.isFinite(number) || number <= 0 || number > (integer ? 2147483647 : 999999.99))
    throw new FieldError(field, integer ? "El número de intentos es demasiado alto. Ingresa un número menor." : "El puntaje debe estar entre 0,01 y 999.999,99.");
  return number;
}

export { localChile as localDate } from "../assignments/dates.ts";

export function quizWallTime(value: string) {
  // Some datetime-local implementations serialize whole seconds with a zero fraction.
  return value.replace(/(T\d{2}:\d{2}:\d{2})\.0{1,3}$/, "$1");
}

export function configurationDate(form: FormData, field: "opensAt" | "closesAt", original?: Authoring) {
  const value = quizWallTime(formValue(form, field));
  if (value && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value))
    throw new FieldError(field, "Ingresa una fecha y hora válidas. Si indicas segundos, usa un número entero.");
  const offset = formValue(form, `${field}Offset`);
  const choice = offset && chileCandidates(value).includes(offset) ? offset : undefined;
  const previous = original?.[field];
  // The browser omits zero seconds, and the optional offset identifies a repeated hour.
  const comparable = value.length === 16 ? value + ":00" : value;
  if (previous && comparable === localChile(previous)
      && (!choice || choice.slice(0, 19) === new Date(previous).toISOString().slice(0, 19))) {
    return previous;
  }
  return chileInstant(value, field, undefined, choice);
}

export function configuration(form: FormData, original?: Authoring): Update {
  const instructions = formValue(form, "instructions"), attempts = formValue(form, "maxAttempts");
  return {
    ...(form.has("groupId") ? { groupId:formValue(form,"groupId") || null } : {}),
    title: formValue(form, "title"), sectionId: formValue(form, "sectionId") || null,
    instructions: original?.instructions === null && instructions === "" ? null : instructions,
    opensAt: configurationDate(form, "opensAt", original), closesAt: configurationDate(form, "closesAt", original),
    maxAttempts: attempts === "" ? null : formNumber(attempts, "maxAttempts", true),
  };
}

/** Native number/date controls can report bad input while exposing an empty value. */
export function quizNativeError(control: HTMLInputElement) {
  return control.type === "datetime-local" ? "Completa la fecha y la hora o deja el campo vacío."
    : control.name === "maxAttempts" ? "Ingresa un número entero mayor que cero o deja el campo vacío."
    : "Ingresa un puntaje positivo con hasta dos decimales.";
}

export function checkNativeInputs(form: HTMLFormElement) {
  for (const control of Array.from(form.elements)) {
    if (control instanceof HTMLInputElement && control.validity.badInput)
      throw new FieldError(control.name, quizNativeError(control));
  }
}

export function focusQuizError(form: HTMLFormElement | null, field?: string): boolean {
  if (!form || !field) return false;
  const controls = Array.from(form.elements).filter((element): element is HTMLElement & { name: string } => element instanceof HTMLElement && "name" in element);
  const target = controls.find(element => element.name === field || element.dataset.errorField === field) ??
    controls.find(element => element.name.startsWith(field + ".") && element.getAttribute("type") !== "hidden");
  if (!target || target.getAttribute("type") === "hidden") return false;
  for (let parent = target.parentElement; parent; parent = parent.parentElement)
    if (parent.tagName === "DETAILS") parent.setAttribute("open", "");
  target.focus();
  return true;
}
