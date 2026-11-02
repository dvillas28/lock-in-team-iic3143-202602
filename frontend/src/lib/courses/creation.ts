import {FieldError, text, type Course} from './validation.ts';

export const INITIAL_CAPACITY_MAX = 1000;
export type CourseField = 'code' | 'name' | 'term' | 'sectionCode' | 'capacity';
export type CourseErrors = Partial<Record<CourseField, string>>;
export function academicYears(now = new Date()) {
  const year = Number(new Intl.DateTimeFormat('en', {timeZone: 'America/Santiago', year: 'numeric'}).format(now));
  return Array.from({length: 6}, (_, i) => year + i);
}
export function normalizedCode(value: unknown, field: 'code' | 'sectionCode' = 'code') {
  const v = text(value, 32, field);
  if (!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(v)) throw new FieldError(field, 'Usa solo letras, números y guiones entre grupos, sin espacios ni símbolos.');
  return v.toUpperCase();
}
export function academicTerm(value: unknown, previous?: string) {
  if (previous !== undefined && value === previous) return previous;
  if (typeof value !== 'string' || !/^\d{4}-[12]$/.test(value) || !academicYears().includes(Number(value.slice(0, 4)))) {
    throw new FieldError('term', 'Selecciona un año de la lista y el semestre 1 o 2.');
  }
  return value;
}
export function initialCapacity(value: string) {
  if (!value.trim()) return null;
  if (!/^\d+$/.test(value.trim()) || Number(value) < 1 || Number(value) > INITIAL_CAPACITY_MAX) {
    throw new FieldError('capacity', 'Ingresa entre 1 y 1.000 estudiantes, o deja vacío para no limitar.');
  }
  return Number(value);
}
export function courseField(field: CourseField, data: FormData, previous?: Course) {
  const value = data.get(field);
  if (field === 'code') return previous && value === previous.code ? previous.code : normalizedCode(value);
  if (field === 'name') return text(value, 200, 'name');
  if (field === 'term') return academicTerm(value, previous?.term);
  if (field === 'sectionCode') return normalizedCode(value, 'sectionCode');
  return initialCapacity(String(value ?? ''));
}
export function courseErrors(data: FormData, previous?: Course): CourseErrors {
  const errors: CourseErrors = {};
  const fields: CourseField[] = previous ? ['code', 'name', 'term'] : ['code', 'name', 'term', 'sectionCode', 'capacity'];
  for (const field of fields) {
    try { courseField(field, data, previous); }
    catch (error) { if (error instanceof FieldError) errors[field] = error.message; else throw error; }
  }
  return errors;
}
