import { BadRequestException, PayloadTooLargeException, UnprocessableEntityException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { extname } from "node:path";
import { validateUpload, type Upload } from "../academic-files/file-format";
import { object, uuid } from "../courses/validation";

export const submissionFileLimit = 5;
export const submissionFileBytes = 10 * 1024 * 1024;
export const submissionBytes = 50 * 1024 * 1024;
export const submissionTextLimit = 10_000;

export async function submissionInput(body: unknown, files: Upload[]) {
 const input = object(body, ["idempotencyKey","sectionId","expectedAttempts","writtenResponse"],
  ["idempotencyKey","sectionId","expectedAttempts"]);
 if (typeof input.expectedAttempts !== "string" || !/^\d{1,9}$/.test(input.expectedAttempts)) throw new BadRequestException();
 const writtenResponse = input.writtenResponse === undefined ? null : writtenInput(input.writtenResponse);
 if (!files.length && writtenResponse === null) throw invalid("SUBMISSION_CONTENT_REQUIRED");
 if (files.length > submissionFileLimit || files.some(file=>file.buffer.length>submissionFileBytes) || files.reduce((sum,file)=>sum+file.buffer.length,0)>submissionBytes) {
  throw new PayloadTooLargeException({code:"SUBMISSION_FILES_TOO_LARGE"});
 }
 const uploads = [];
 for (const file of files) {
  const validated = await validateUpload(file);
  uploads.push({...validated,extension:extname(validated.name).slice(1).toLowerCase(),
   sha256:createHash("sha256").update(file.buffer).digest("hex")});
 }
 const sectionId = uuid(input.sectionId), expectedAttempts = Number(input.expectedAttempts);
 const digest = createHash("sha256").update(JSON.stringify([sectionId,expectedAttempts,writtenResponse,
  uploads.map(f=>[f.name,f.mime,f.sha256])])).digest("hex");
 return {key:uuid(input.idempotencyKey),sectionId,expectedAttempts,writtenResponse,uploads,digest};
}

export function writtenInput(value: unknown) {
 if (typeof value !== "string") throw new BadRequestException();
 const content = value.replace(/\r\n?/g,"\n").trim();
 if ([...content].length > submissionTextLimit || /[\x00-\x08\x0b-\x1f\x7f]/u.test(content)) {
  throw invalid("SUBMISSION_TEXT_INVALID");
 }
 const visible = content.replace(/^[ 	]{0,3}\[[^\]\n]+\]:[^\n]*$/gm,"")
  .replace(/<[^<>\n]*>/g,"")
  .replace(/&(?:nbsp|ensp|emsp|thinsp|zwnj|zwj|ZeroWidthSpace|Tab|NewLine);/gu,"")
  .replace(/&#(x[0-9a-f]{1,6}|\d{1,7});/gi,(entity,number:string)=>{
   const code=number[0].toLowerCase()==="x" ? parseInt(number.slice(1),16) : Number(number);
   return code<=0x10ffff && /[\s\p{Cf}]/u.test(String.fromCodePoint(code)) ? "" : entity;
  }).replace(/^\s*\d+[.)](?=\s|$)/gm,"")
  .replace(/[\s\p{Cf}*_~`#>+\-\[\]\\]/gu,"");
 if (!visible.length) throw invalid("SUBMISSION_TEXT_EMPTY");
 return content;
}

export function invalid(code: string) {
 return new UnprocessableEntityException({code});
}

export function feedbackInput(value: unknown) {
 if (value===null) return null;
 if (typeof value!=="string" || [...value].length>4000 || value.includes("\0")) throw invalid("INVALID_GRADE_FEEDBACK");
 return value.trim() || null;
}
