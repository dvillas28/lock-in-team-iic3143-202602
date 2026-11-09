import {BadRequestException} from "@nestjs/common";
import {object,uuid,page,text,boolean} from "../courses/validation";
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
function selectionIds(value:unknown) {
 if(!Array.isArray(value) || !value.length)throw new BadRequestException();
 const ids=value.map(uuid).sort();
 if(new Set(ids).size!==ids.length)throw new BadRequestException();
 return ids;
}
export function publicationInput(body:unknown) {
 const keys=["gradeItemIds","sectionIds","studentIds"],input=object(body,keys,keys);
 return {gradeItemIds:selectionIds(input.gradeItemIds),sectionIds:selectionIds(input.sectionIds),studentIds:selectionIds(input.studentIds)};
}
export function publicationRequest(body:unknown) {
 if(!body || typeof body!=="object" || !("scope" in body))return publicationInput(body);
 const input=object(body,["scope","sectionIds","gradeItemIds"],["scope","sectionIds"]);
 if(input.scope!=="pending")throw new BadRequestException();
 return {scope:"pending" as const,sectionIds:selectionIds(input.sectionIds),
  gradeItemIds:input.gradeItemIds===undefined?[]:selectionIds(input.gradeItemIds)};
}
export type Selection=ReturnType<typeof publicationRequest>;
export function publicationKey(headers:string[]) {
 const key=idempotencyKey(headers);
 if(key!==key.trim())throw new BadRequestException();
 return key;
}
export function bookPage(query:Record<string,unknown>,scope:string) {
 const p=page(query,scope,["sectionId"]);
 let section:string|null=null;
 if(query.cursor!==undefined) {
  try{section=uuid(JSON.parse(Buffer.from(query.cursor as string,"base64url").toString()).section);}catch{throw new BadRequestException();}
 }
 return {...p,section};
}

export function groupsInput(body:unknown) {
 const input=object(body,["expectedVersion","confirmRecalculation","groups"],["expectedVersion","confirmRecalculation","groups"]);
 if(typeof input.expectedVersion!=="number" || !Number.isSafeInteger(input.expectedVersion) ||
  input.expectedVersion<0 || !Array.isArray(input.groups) || !input.groups.length || input.groups.length>100)throw new BadRequestException();
 const groups=input.groups.map(value=>{
  const keys=["id","title","weightPercent","gradeItemIds"],group=object(value,keys,keys);
  if(!Array.isArray(group.gradeItemIds))throw new BadRequestException();
  const weight=group.weightPercent;
  if(typeof weight!=="number" || weight<0 || weight>100 || !/^\d+(?:\.\d{1,2})?$/.test(String(weight)))throw new BadRequestException();
  return {id:group.id===null?null:uuid(group.id),title:text(group.title,200),weightPercent:weight,
   gradeItemIds:group.gradeItemIds.map(uuid).sort()};
 });
 const items=groups.flatMap(g=>g.gradeItemIds),ids=groups.flatMap(g=>g.id?[g.id]:[]);
 if(new Set(items).size!==items.length || new Set(ids).size!==ids.length)throw new BadRequestException();
 return {expectedVersion:input.expectedVersion,confirmRecalculation:boolean(input.confirmRecalculation),groups};
}

export function correctionInput(body:unknown) {
 const keys=["revisionId","expectedRevisionId","points","reason"],input=object(body,keys,keys),points=input.points;
 if(typeof points!=="number" || points<0 || points>999999.99 || !/^\d+(?:\.\d{1,2})?$/.test(String(points)))throw new BadRequestException();
 return {revisionId:uuid(input.revisionId),expectedRevisionId:input.expectedRevisionId===null?null:uuid(input.expectedRevisionId),
  points,reason:text(input.reason,500)};
}
