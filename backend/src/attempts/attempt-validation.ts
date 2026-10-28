import {BadRequestException} from "@nestjs/common";
import {object,uuid} from "../courses/validation";
export interface Answer {questionId:string;alternativeId:string;isCorrect?:boolean;pointsAwarded?:number}
export function answersInput(body:unknown):Answer[] {
 const input=object(body,["answers"],["answers"]);
 if(!Array.isArray(input.answers))throw new BadRequestException();
 const result=input.answers.map(value=>{
  const a=object(value,["questionId","alternativeId"],["questionId","alternativeId"]);
  if(typeof a.alternativeId!=="string" || !a.alternativeId.length || a.alternativeId.includes("\0"))throw new BadRequestException();
  return {questionId:uuid(a.questionId),alternativeId:a.alternativeId};
 });
 if(new Set(result.map(a=>a.questionId)).size!==result.length)throw new BadRequestException();return result;
}
export function emptyBody(value:unknown) {
 if(value!==undefined && (!value || typeof value!=="object" || Array.isArray(value) || Object.keys(value).length))throw new BadRequestException();
}
export function idempotencyKey(rawHeaders:string[]) {
 const values:string[]=[];
 for(let i=0;i<rawHeaders.length;i+=2)if(rawHeaders[i].toLowerCase()==="idempotency-key")values.push(rawHeaders[i+1]);
 const key=values[0];
 if(values.length!==1 || typeof key!=="string" || !key.length || [...key].length>200 || /\p{Cc}/u.test(key))throw new BadRequestException();
 return key;
}
