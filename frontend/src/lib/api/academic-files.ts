import type { ApiClient } from "./client.ts";
import type { paths } from "./schema";
import { ApiResponseError } from "./errors.ts";
import { path } from "../courses/validation.ts";
import { fileDto, moduleResources, type AcademicFile } from "../content/academic-files.ts";

const resources="/api/v1/institution/{institutionSlug}/modules/{moduleId}/resources";
const file="/api/v1/institution/{institutionSlug}/materials/{materialId}/file";
const moduleParams=(slug:string,moduleId:string)=>({path:{...path(slug,{moduleId}),moduleId}});
const fileParams=(slug:string,materialId:string)=>({path:{...path(slug,{materialId}),materialId}});

export async function listModuleResources(client:ApiClient,slug:string,moduleId:string) {
 const result=await client.GET(resources,{params:moduleParams(slug,moduleId)});
 return moduleResources(result.data,moduleId);
}
export async function getAcademicFile(client:ApiClient,slug:string,id:string,moduleId:string) {
 const result=await client.GET(file,{params:fileParams(slug,id)});
 return fileDto(result.data,moduleId,id);
}
export async function moveResource(client:ApiClient,slug:string,moduleId:string,id:string,neighborId:string,direction:-1|1) {
 await client.PUT(`${resources}/order`,{params:moduleParams(slug,moduleId),body:{resourceId:id,neighborId,direction}});
}
export async function linkModuleQuiz(client:ApiClient,slug:string,moduleId:string,quizId:string) {
 await client.POST(`${resources}/quizzes`,{params:moduleParams(slug,moduleId),body:{quizId}});
}
export async function unlinkModuleQuiz(client:ApiClient,slug:string,moduleId:string,resourceId:string) {
 await client.DELETE(`${resources}/quizzes/{resourceId}`,{params:{path:{...moduleParams(slug,moduleId).path,resourceId}}});
}
export async function renameAcademicFile(client:ApiClient,slug:string,item:AcademicFile,title:string) {
 const result=await client.PATCH(file,{params:fileParams(slug,item.id),body:{title}});
 return fileDto(result.data,item.moduleId,item.id);
}
export async function setAcademicFilePublication(client:ApiClient,slug:string,id:string,moduleId:string,published:boolean) {
 const params=fileParams(slug,id);
 const result=published ? await client.POST(`${file}/publish`,{params}) : await client.POST(`${file}/unpublish`,{params});
 const saved=fileDto(result.data,moduleId,id);
 if ((saved.publishedAt!==null)!==published) throw new ApiResponseError();
 return saved;
}
export async function deleteAcademicFile(client:ApiClient,slug:string,id:string) {
 await client.DELETE(file,{params:fileParams(slug,id)});
}
export async function fileBytes(client:ApiClient,slug:string,item:AcademicFile,download:boolean,signal?:AbortSignal) {
 const result=await client.GET(download?`${file}/download`:`${file}/preview`,{
  params:fileParams(slug,item.id),parseAs:"blob",headers:{Accept:"*/*"},signal,
 });
 if (!(result.data instanceof Blob) || !result.data.size || result.data.size>50*1024*1024 ||
  result.data.size!==item.byteSize || result.data.type.split(";")[0]!==item.mediaType) throw new ApiResponseError();
 return result.data;
}
const uploadPath="/api/v1/institution/{institutionSlug}/modules/{moduleId}/files";
type UploadBody=paths[typeof uploadPath]["post"]["requestBody"]["content"]["multipart/form-data"];

export async function sendAcademicFile(client:ApiClient,slug:string,moduleId:string,form:FormData,signal:AbortSignal,operation:string,item?:AcademicFile) {
 // The generated binary schema represents the file as a string. The serializer transmits the actual File.
 const body={file:""};
 const options={body,bodySerializer:()=>form,signal};
 const result=item ? await client.PUT(file,{...options,params:fileParams(slug,item.id)}) :
  await client.POST(uploadPath,{...options,body:body satisfies UploadBody,params:moduleParams(slug,moduleId),headers:{"Idempotency-Key":operation}});
 return fileDto(result.data,moduleId,item?.id);
}

export function uploadTransport(form:FormData,onProgress:(progress:number)=>void) {
 return {
  timeoutMs:120_000,
  fetch:(request:Request)=>new Promise<Response>((resolve,reject)=>{
   if (request.signal.aborted) {reject(request.signal.reason);return;}
   const xhr=new XMLHttpRequest();
   xhr.open(request.method,request.url);
   xhr.responseType="arraybuffer";
   request.headers.forEach((value,name)=>{if (name!=="content-type") xhr.setRequestHeader(name,value);});
   xhr.upload.onprogress=event=>{if (event.lengthComputable) onProgress(Math.round(event.loaded*100/event.total));};
   const abort=()=>xhr.abort();
   request.signal.addEventListener("abort",abort,{once:true});
   xhr.onloadend=()=>{
    request.signal.removeEventListener("abort",abort);
    if (!xhr.status || xhr.responseURL!==request.url) {reject(request.signal.reason??new Error("Upload transport failed"));return;}
    const headers=new Headers();
    for (const line of xhr.getAllResponseHeaders().trim().split("\r\n")) {
     const colon=line.indexOf(":");
     if (colon>0) headers.append(line.slice(0,colon),line.slice(colon+1).trim());
    }
    resolve(new Response(xhr.response,{status:xhr.status,headers}));
   };
   xhr.send(form);
  }),
 };
}
