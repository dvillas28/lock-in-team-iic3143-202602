import type { Authoring, Update } from "./validation.ts";
import { FieldError } from "../courses/validation.ts";

/** Reject duplicate controls and files instead of silently coercing their values. */
export function formValue(form: FormData, name: string): string {
  const values = form.getAll(name);
  if (values.length > 1 || values.some(value => typeof value !== "string"))
    throw new FieldError(name, "Revisa este campo: debe contener un único valor.");
  return (values[0] as string | undefined) ?? "";
}

export function formNumber(value: string, field: string, integer = false): number {
  if (!(integer ? /^\d+$/ : /^\d+(?:\.\d{1,2})?$/).test(value))
    throw new FieldError(field, integer ? "Ingresa un número entero positivo, sin exponentes ni decimales." : "Ingresa un puntaje positivo con hasta dos decimales.");
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > (integer ? 2147483647 : 999999.99))
    throw new FieldError(field, integer ? "Ingresa un número entre 1 y 2147483647." : "El puntaje debe estar entre 0,01 y 999999,99.");
  return number;
}

// Keep the backend's timezone and microseconds when the local field is unchanged.
export function localDate(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
}

function localInstant(value: string, field: string): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  const date = new Date(value);
  const parts = match?.slice(1).map(part => Number(part ?? 0));
  // Component round trip also rejects dates normalized across a DST gap.
  if (!parts || parts[0] < 1 || !Number.isFinite(date.getTime()) ||
      date.getFullYear() !== parts[0] || date.getMonth() + 1 !== parts[1] ||
      date.getDate() !== parts[2] || date.getHours() !== parts[3] ||
      date.getMinutes() !== parts[4] || date.getSeconds() !== parts[5])
    throw new FieldError(field, "Ingresa una fecha y hora válidas en tu zona horaria.");
  return date.toISOString();
}

export function configuration(form: FormData, original?: Authoring): Update {
  const date = (field: "opensAt" | "closesAt") => {
    const value = formValue(form, field);
    // Native datetime-local controls omit :00 seconds even when defaultValue includes them.
    const comparable = value.length === 16 ? value + ":00" : value;
    return original && comparable === localDate(original[field]) ? original[field] : localInstant(value, field);
  };
  const instructions = formValue(form, "instructions"), attempts = formValue(form, "maxAttempts");
  return {
    title: formValue(form, "title"), sectionId: formValue(form, "sectionId") || null,
    instructions: original?.instructions === null && instructions === "" ? null : instructions,
    opensAt: date("opensAt"), closesAt: date("closesAt"),
    maxAttempts: attempts === "" ? null : formNumber(attempts, "maxAttempts", true),
  };
}

/** Native number/date controls can report bad input while exposing an empty value. */
export function checkNativeInputs(form: HTMLFormElement) {
  for (const control of Array.from(form.elements)) {
    if (control instanceof HTMLInputElement && control.validity.badInput)
      throw new FieldError(control.name, "Completa este campo con un formato válido o déjalo vacío si es opcional.");
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
