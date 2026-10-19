import {BadRequestException} from "@nestjs/common";
import {object,uuid,page} from "../courses/validation";
import {idempotencyKey} from "../attempts/attempt-validation";
export function weightsInput(body:unknown) {
 const input=object(body,["items"],["items"]);
 if(!Array.isArray(input.items) || !input.items.length)throw new BadRequestException();
 const items=input.items.map(value=>{
  const item=object(value,["gradeItemId","weightPercent"],["gradeItemId","weightPercent"]),weight=item.weightPercent;
  if(typeof weight!=="number" || !Number.isFinite(weight) || weight<0 || weight>100 || !/^\d+(?:\.\d{1,2})?$/.test(String(weight)))throw new BadRequestException();
  return {gradeItemId:uuid(item.gradeItemId),weightPercent:weight};
 });
 if(new Set(items.map(i=>i.gradeItemId)).size!==items.length)throw new BadRequestException();
 return items.sort((a,b)=>a.gradeItemId.localeCompare(b.gradeItemId));
}
export function publicationInput(body:unknown) {
 const keys=["gradeItemIds","sectionIds","studentIds"],input=object(body,keys,keys);
 const list=(name:string)=>{
  const value=input[name];if(!Array.isArray(value) || !value.length)throw new BadRequestException();
  const ids=value.map(uuid);if(new Set(ids).size!==ids.length)throw new BadRequestException();return ids.sort();
 };
 return {gradeItemIds:list("gradeItemIds"),sectionIds:list("sectionIds"),studentIds:list("studentIds")};
}
export type Selection=ReturnType<typeof publicationInput>;
export function publicationKey(headers:string[]) {
 const key=idempotencyKey(headers);if(key!==key.trim())throw new BadRequestException();return key;
}
export function bookPage(query:Record<string,unknown>,scope:string) {
 const p=page(query,scope,["sectionId"]);
 let section:string|null=null;
 if(query.cursor!==undefined) {
  try{section=uuid(JSON.parse(Buffer.from(query.cursor as string,"base64url").toString()).section);}catch{throw new BadRequestException();}
 }
 return {...p,section};
}
