import {BadRequestException,UnprocessableEntityException} from "@nestjs/common";
import {randomUUID} from "node:crypto";
import {object,uuid} from "../courses/validation";
import {title,position} from "../content/content-validation";
export interface Alternative {id:string;text:string;isCorrect:boolean}
export interface Question {id:string;position:number;prompt:string;points:number;alternatives:Alternative[]}
export interface QuizInput {title:string;sectionId:string|null;instructions:string|null;opensAt:string|null;closesAt:string|null;maxAttempts:number|null;questions:Question[]}
function string(value:unknown,nonblank=true,max=Infinity) {
 if(typeof value!=="string")throw new BadRequestException();
 if((nonblank && !value.trim()) || [...value].length>max || value.includes("\0"))throw new UnprocessableEntityException();
 return value;
}
function date(value:unknown):string|null {
 if(value===null)return null;
 if(typeof value!=="string")throw new BadRequestException();
 const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/.exec(value);
 if(!m || +m[1]===0 || +m[2]<1 || +m[2]>12 || +m[3]<1 ||
  +m[3]>new Date(Date.UTC(+m[1],+m[2],0)).getUTCDate() || +m[4]>23 || +m[5]>59 || +m[6]>59 || !Number.isFinite(Date.parse(value)))throw new BadRequestException();
 return new Date(value).toISOString().slice(0,19)+"."+(m[7]??"").padEnd(6,"0")+"Z";
}
export function validateQuiz(body:unknown,current?:QuizInput):QuizInput {
 const input=object(body,["title","sectionId","instructions","opensAt","closesAt","maxAttempts","questions"],current?[]:["title"]);
 const result:QuizInput=current?{...current}:{title:"",sectionId:null,instructions:null,opensAt:null,closesAt:null,maxAttempts:null,questions:[]};
 if("title" in input)result.title=title(input.title);
 if("sectionId" in input)result.sectionId=input.sectionId===null?null:uuid(input.sectionId);
 if("instructions" in input)result.instructions=input.instructions===null?null:string(input.instructions,false,10000);
 for(const key of ["opensAt","closesAt"] as const)if(key in input)result[key]=date(input[key]);
 if(result.opensAt && result.closesAt && result.opensAt>=result.closesAt)throw new UnprocessableEntityException();
 if("maxAttempts" in input)result.maxAttempts=input.maxAttempts===null?null:position(input.maxAttempts);
 if("questions" in input) {
  if(!Array.isArray(input.questions))throw new BadRequestException();
  result.questions=input.questions.map(value=>{
   const q=object(value,current?["id","prompt","position","points","alternatives"]:["prompt","position","points","alternatives"],["prompt","position","points","alternatives"]);
   const id=q.id===undefined?randomUUID():uuid(q.id);
   if(q.id!==undefined && !current?.questions.some(p=>p.id===id))throw new UnprocessableEntityException();
   if(typeof q.points!=="number")throw new BadRequestException();
   if(!Number.isFinite(q.points) || q.points<=0 || Number(q.points.toFixed(2))!==q.points)throw new UnprocessableEntityException();
   if(!Array.isArray(q.alternatives))throw new BadRequestException();
   const alternatives=q.alternatives.map(value=>{
    const a=object(value,["id","text","isCorrect"],["id","text","isCorrect"]);
    if(typeof a.isCorrect!=="boolean")throw new BadRequestException();
    return {id:string(a.id),text:string(a.text),isCorrect:a.isCorrect};
   });
   if(alternatives.length<2 || new Set(alternatives.map(a=>a.id)).size!==alternatives.length || alternatives.filter(a=>a.isCorrect).length!==1)throw new UnprocessableEntityException();
   return {id,position:position(q.position),prompt:string(q.prompt),points:q.points,alternatives};
  }).sort((a,b)=>a.position-b.position);
 }
 if(new Set(result.questions.map(q=>q.id)).size!==result.questions.length ||
  new Set(result.questions.map(q=>q.position)).size!==result.questions.length ||
  result.questions.reduce((sum,q)=>sum+Math.round(q.points*100),0)>99999999)throw new UnprocessableEntityException();
 return result;
}
export function validatePublish(input:QuizInput) {
 if(!input.questions.length)throw new UnprocessableEntityException();
 // Revalidate stored JSON too; SQL fixtures and migrations are not an HTTP trust boundary.
 validateQuiz({questions:input.questions},input);
}
