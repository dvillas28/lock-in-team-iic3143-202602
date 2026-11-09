import type {components} from "../api/schema";
import {ApiResponseError} from "../api/errors.ts";
import {isRecord} from "../auth/validation.ts";
import {isId,list} from "../courses/validation.ts";
import {materialDto} from "./validation.ts";

export type AcademicFile=components["schemas"]["AcademicFile"];
export type ModuleQuiz=components["schemas"]["ModuleQuiz"];
export type ModuleResource=components["schemas"]["ModuleResources"]["items"][number];
export type UploadLimits=components["schemas"]["UploadLimits"];
const validSize=(value:unknown)=>typeof value==="number" && Number.isInteger(value) && value>0 && value<=50*1024*1024;
function base(v:unknown,moduleId:string,expected?:string) {
 if (!isRecord(v) || !isId(v.id) || v.moduleId!==moduleId || (expected && v.id!==expected) ||
  typeof v.title!=="string" || !v.title.trim() || [...v.title].length>200 ||
  typeof v.position!=="number" || !Number.isInteger(v.position) || v.position<1 ||
  (v.publishedAt!==null && (typeof v.publishedAt!=="string" || !Number.isFinite(Date.parse(v.publishedAt))))) throw new ApiResponseError();
 return v;
}
export function fileDto(v:unknown,moduleId:string,expected?:string):AcademicFile {
 const item=base(v,moduleId,expected);
 if (item.kind!=="file" || !isId(item.createdBy) || !validSize(item.byteSize) ||
  typeof item.fileName!=="string" || !item.fileName || [...item.fileName].length>240 ||
  typeof item.mediaType!=="string" || !["pdf","image","text",null].includes(item.preview as string|null)) throw new ApiResponseError();
 return item as AcademicFile;
}
export function moduleResources(v:unknown,moduleId:string) {
 if (!isRecord(v) || !isRecord(v.limits) || !["document","image","zip"].every(key=>validSize((v.limits as Record<string,unknown>)[key]))) throw new ApiResponseError();
 const items=list(v,(raw):ModuleResource=>{
  const item=base(raw,moduleId);
  if (item.kind==="file") return fileDto(item,moduleId);
  if (item.kind==="markdown") return {...materialDto(item,moduleId),position:item.position as number};
  if (item.kind==="quiz" && isId(item.quizId) && typeof item.canUnlink==="boolean") return item as ModuleQuiz;
  throw new ApiResponseError();
 });
 if (new Set(items.map(item=>item.position)).size!==items.length) throw new ApiResponseError();
 return {items:items.sort((a,b)=>a.position-b.position),limits:v.limits as UploadLimits};
}
const documentFormats=["pdf","doc","docx","ppt","pptx","xls","xlsx","csv","txt","md","ipynb"];
const imageFormats=["jpg","jpeg","png","webp"];
export const acceptedFiles=[...documentFormats,...imageFormats,"zip"].map(extension=>"."+extension).join(",");
export const fileExtension=(name:string)=>name.includes(".") ? name.split(".").at(-1)!.toLowerCase() : "";
export function checkSelectedFile(file:File,limits:UploadLimits) {
 const extension=fileExtension(file.name);
 const limit=imageFormats.includes(extension) ? limits.image : extension==="zip" ? limits.zip :
  documentFormats.includes(extension) ? limits.document : undefined;
 if (!limit) return "Selecciona un archivo de un formato admitido.";
 if (!file.size) return "El archivo está vacío.";
 if (file.size>limit) return `Este formato admite hasta ${formatBytes(limit)}.`;
 return undefined;
}
export function formatBytes(bytes:number) {
 const unit=bytes>=1024*1024 ? "MiB" : bytes>=1024 ? "KiB" : "B";
 const size=bytes/(unit==="MiB"?1024*1024:unit==="KiB"?1024:1);
 return `${new Intl.NumberFormat("es-CL",{maximumFractionDigits:1}).format(size)}\u00a0${unit}`;
}
