import { BadRequestException, UnprocessableEntityException } from "@nestjs/common";
import { boolean, object, text, timestamp, uuid } from "../courses/validation";
import { position } from "../content/content-validation";

const dateKeys = ["availableFrom", "dueAt", "availableUntil"] as const;
const fields = ["confirmPastDue", "title", "description", "instructions", "maxPoints", "sectionId", "groupId", "allowedExtensions", "maxAttempts", ...dateKeys];
const allowedExtensions = new Set(["pdf","doc","docx","xls","xlsx","ppt","pptx","jpg","jpeg","png","zip","txt","csv"]);

export interface AssignmentInput {
 title: string;
 description: string | null;
 instructions: string | null;
 maxPoints: number;
 sectionId: string | null;
 groupId: string | null;
 allowedExtensions: string[];
 maxAttempts: number | null;
 availableFrom: string | null;
 dueAt: string | null;
 availableUntil: string | null;
}
const blank: AssignmentInput = {
 title: "", description: null, instructions: null, maxPoints: 0, sectionId: null, groupId: null,
 allowedExtensions: [], maxAttempts: null, availableFrom: null, dueAt: null, availableUntil: null,
};

function extensions(value: unknown, current?: string[]) {
 if (!Array.isArray(value) || value.length > 30) throw new BadRequestException();
 const normalized = value.map(v => {
  if (typeof v !== "string" || !/^\.?[a-z0-9]{1,16}$/i.test(v)) throw new BadRequestException();
  return v.replace(/^\./, "").toLowerCase();
 });
 const unique = [...new Set(normalized)].sort();
 const previous = current ? [...new Set(current.map(v => v.toLowerCase()))].sort() : undefined;
 if (current && previous) {
  const legacy = new Set(previous.filter(value => !allowedExtensions.has(value)));
  if (unique.every(value => allowedExtensions.has(value) || legacy.has(value)) &&
      (unique.length > 0 || previous.length === 0)) {
   if (JSON.stringify(unique) === JSON.stringify(previous)) return current;
   return [...current.filter(value => !allowedExtensions.has(value.toLowerCase())), ...unique.filter(value => allowedExtensions.has(value))];
  }
 }
 if (!unique.length || unique.some(value => !allowedExtensions.has(value))) {
  throw new UnprocessableEntityException({code:"INVALID_ASSIGNMENT_EXTENSIONS"});
 }
 return unique;
}

function fieldsFrom(input: Record<string, unknown>, current: AssignmentInput) {
 const result = {...current};
 if ("title" in input) result.title = text(input.title, 200);
 if ("description" in input) result.description = input.description === null ? null : text(input.description, 2000);
 if ("instructions" in input) result.instructions = input.instructions === null ? null : text(input.instructions, 10000);
 for (const key of ["sectionId", "groupId"] as const) if (key in input) result[key] = input[key] === null ? null : uuid(input[key]);
 for (const key of dateKeys) if (key in input) result[key] = input[key] === null ? null : timestamp(input[key]);
 const opening = result.availableFrom;
 const due = result.dueAt;
 const closing = result.availableUntil;
 if ((opening !== null && due !== null && opening > due) ||
     (due !== null && closing !== null && closing < due) ||
     (opening !== null && closing !== null && closing < opening)) {
  throw new UnprocessableEntityException({code:"INVALID_ASSIGNMENT_DATES"});
 }

 if ("maxPoints" in input) {
  const value = input.maxPoints;
  if (typeof value !== "number" || value < 0 || value > 999999.99 || !/^\d+(?:\.\d{1,2})?$/.test(String(value))) {
   throw new UnprocessableEntityException({code:"INVALID_ASSIGNMENT_POINTS"});
  }
  result.maxPoints = value;
 }
 if ("maxAttempts" in input) result.maxAttempts = input.maxAttempts === null ? null : position(input.maxAttempts);
 if ("allowedExtensions" in input) {
  result.allowedExtensions = current === blank
    ? extensions(input.allowedExtensions)
    : extensions(input.allowedExtensions, current.allowedExtensions);
 }
 return result;
}

function version(value: unknown) {
 if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > 2147483647) throw new BadRequestException();
 return value;
}

export function assignmentCreate(body: unknown) {
 const input = object(body, ["id", "publish", ...fields], ["id", "title", "maxPoints"]);
 return {id:uuid(input.id), values:fieldsFrom(input,blank), publish:"publish" in input && boolean(input.publish)};
}
export function assignmentUpdate(body: unknown, current: AssignmentInput) {
 const input = object(body, ["expectedVersion", "publish", ...fields], ["expectedVersion"]);
 return {expectedVersion:version(input.expectedVersion), values:fieldsFrom(input,current), publish:"publish" in input && boolean(input.publish)};
}
export function assignmentVisibility(body: unknown) {
 const input = object(body, ["expectedVersion","published"], ["expectedVersion","published"]);
 return {expectedVersion:version(input.expectedVersion), published:boolean(input.published)};
}
