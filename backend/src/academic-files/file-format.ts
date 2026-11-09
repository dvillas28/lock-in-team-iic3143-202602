import {BadRequestException, PayloadTooLargeException, UnsupportedMediaTypeException} from "@nestjs/common";
import {extname} from "node:path";
import sharp from "sharp";

export const maxUploadBytes = 50 * 1024 * 1024;
const MiB = 1024 * 1024;
const formats: Record<string, [string, string]> = {
 pdf:["application/pdf","document"], doc:["application/msword","document"],
 docx:["application/vnd.openxmlformats-officedocument.wordprocessingml.document","document"],
 ppt:["application/vnd.ms-powerpoint","document"],
 pptx:["application/vnd.openxmlformats-officedocument.presentationml.presentation","document"],
 xls:["application/vnd.ms-excel","document"],
 xlsx:["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","document"],
 csv:["text/csv","document"], txt:["text/plain","document"], md:["text/markdown","document"],
 jpg:["image/jpeg","image"], jpeg:["image/jpeg","image"], png:["image/png","image"], webp:["image/webp","image"],
 zip:["application/zip","zip"], ipynb:["application/x-ipynb+json","document"],
};
export const previewType = (type: string) =>
 type === "application/pdf" ? "pdf" : /^image\/(?:jpeg|png|webp)$/.test(type) ? "image" :
 /^text\/(?:plain|markdown)$/.test(type) ? "text" : null;

export function uploadLimits(env: NodeJS.ProcessEnv = process.env) {
 const limit = (name: string, fallback: number) => {
  const value = Number(env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 50) throw new Error("Invalid academic upload limit");
  return value * MiB;
 };
 return {document:limit("ACADEMIC_DOCUMENT_LIMIT_MIB",20),image:limit("ACADEMIC_IMAGE_LIMIT_MIB",10),zip:limit("ACADEMIC_ZIP_LIMIT_MIB",50)};
}

function zipEntries(bytes: Buffer) {
 const first = Math.max(0,bytes.length-65557);
 for (let end=bytes.length-22; end>=first; end--) {
  if (bytes.readUInt32LE(end)!==0x06054b50 || end+22+bytes.readUInt16LE(end+20)!==bytes.length) continue;
  const count=bytes.readUInt16LE(end+10), start=bytes.readUInt32LE(end+16);
  if (bytes.readUInt32LE(end+4)!==0 || bytes.readUInt16LE(end+8)!==count || start+bytes.readUInt32LE(end+12)!==end) return null;
  let offset=start;
  const names=new Set<string>();
  for (let i=0;i<count;i++) {
   if (offset+46>end || bytes.readUInt32LE(offset)!==0x02014b50) return null;
   const nameEnd=offset+46+bytes.readUInt16LE(offset+28);
   const next=nameEnd+bytes.readUInt16LE(offset+30)+bytes.readUInt16LE(offset+32);
   const local=bytes.readUInt32LE(offset+42);
   if (next>end || local+30>start || bytes.readUInt32LE(local)!==0x04034b50) return null;
   names.add(bytes.toString("utf8",offset+46,nameEnd));
   offset=next;
  }
  return offset===end ? names : null;
 }
 return null;
}

const officePart: Record<string,string> = {docx:"word/document.xml",pptx:"ppt/presentation.xml",xlsx:"xl/workbook.xml"};
const compoundName: Record<string,string> = {doc:"WordDocument",ppt:"PowerPoint Document",xls:"Workbook"};
async function validContent(extension: string, mime: string, bytes: Buffer) {
 if (extension==="pdf") return bytes.subarray(0,5).toString()==="%PDF-" && bytes.subarray(-2048).includes("%%EOF");
 if (mime.startsWith("image/")) {
  try {
   const image=await sharp(bytes,{limitInputPixels:24_000_000,failOn:"warning"}).metadata();
   return image.format===mime.slice(6) && !!image.width && !!image.height && image.width*image.height<=24_000_000;
  } catch {return false;}
 }
 if (extension==="zip" || officePart[extension]) {
  const names=zipEntries(bytes);
  return names!==null && (extension==="zip" || (names.has("[Content_Types].xml") && names.has(officePart[extension])));
 }
 if (compoundName[extension]) {
  return bytes.length>=512 && bytes.subarray(0,8).equals(Buffer.from("d0cf11e0a1b11ae1","hex")) &&
   (bytes.includes(Buffer.from(compoundName[extension]+"\0","utf16le")) ||
    (extension==="xls" && bytes.includes(Buffer.from("Book\0","utf16le"))));
 }
 try {
  const text=new TextDecoder("utf-8",{fatal:true}).decode(bytes);
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/u.test(text)) return false;
  if (extension!=="ipynb") return true;
  const notebook=JSON.parse(text);
  return Number.isInteger(notebook?.nbformat) && notebook.nbformat>=4 && Array.isArray(notebook.cells);
 } catch {return false;}
}

export interface Upload {buffer: Buffer; originalname: string; mimetype: string}
export async function validateUpload(file?: Upload, limits=uploadLimits()) {
 if (!file?.buffer.length) throw new BadRequestException({field:"file"});
 let name=file.originalname;
 try {
  if (/^[\u0000-\u00ff]+$/u.test(name)) name=new TextDecoder("utf-8",{fatal:true}).decode(Buffer.from(name,"latin1"));
 } catch { /* The filename already arrived decoded. */ }
 name=name.normalize("NFC").replace(/[\p{Cc}\p{Cf}\/\\]/gu,"_").trim();
 if (!name || [...name].length>240) throw new BadRequestException({field:"file"});
 const extension=extname(name).slice(1).toLowerCase(), format=Object.hasOwn(formats,extension) ? formats[extension] : undefined;
 if (!format) throw new UnsupportedMediaTypeException();
 const [mime,category]=format;
 if (file.buffer.length>limits[category as keyof typeof limits]) throw new PayloadTooLargeException();
 const declared=file.mimetype.toLowerCase();
 const alternative: Record<string,string[]> = {
  md:["text/plain","text/x-markdown"], csv:["text/plain","application/vnd.ms-excel"],
  zip:["application/x-zip-compressed"], ipynb:["application/json","text/plain"],
 };
 if (![mime,"application/octet-stream",...(alternative[extension]??[])].includes(declared) ||
     !(await validContent(extension,mime,file.buffer))) throw new UnsupportedMediaTypeException();
 return {name,mime,size:file.buffer.length,bytes:file.buffer};
}

export function disposition(name:string, download:boolean) {
 const fallback=name.replace(/[^\x20-\x7e]|["\\]/gu,"_");
 const utf8=encodeURIComponent(name).replace(/['()*]/g,c=>`%${c.charCodeAt(0).toString(16).toUpperCase()}`);
 return `${download?"attachment":"inline"}; filename="${fallback}"; filename*=UTF-8''${utf8}`;
}
