import {BadRequestException} from "@nestjs/common";
import {object,uuid,page,text,boolean,timestamp} from "../courses/validation";
import {feedbackInput} from "../assignments/submission-validation";
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
 const ids=value.map(uuid).sort((a,b)=>a.localeCompare(b,"en"));
 if(new Set(ids).size!==ids.length)throw new BadRequestException();
 return ids;
}
export function publicationInput(body:unknown) {
 const keys=["gradeItemIds","sectionIds","studentIds"],input=object(body,keys,keys);
 return {gradeItemIds:selectionIds(input.gradeItemIds),sectionIds:selectionIds(input.sectionIds),studentIds:selectionIds(input.studentIds)};
}
export function publicationRequest(body:unknown) {
 if(!body || typeof body!=="object" || !("scope" in body))return publicationInput(body);
 if (body.scope==="assignment") {
  const input=object(body,["scope","gradeItemId","grades"],["scope","gradeItemId","grades"]);
  if (!Array.isArray(input.grades) || !input.grades.length || input.grades.length>100) throw new BadRequestException();
  const grades=input.grades.map(value=>{
   const entry=object(value,["id","expectedUpdatedAt"],["id","expectedUpdatedAt"]);
   return {id:uuid(entry.id),expectedUpdatedAt:timestamp(entry.expectedUpdatedAt)};
  }).sort((a,b)=>a.id.localeCompare(b.id,"en"));
  if (new Set(grades.map(g=>g.id)).size!==grades.length) throw new BadRequestException();
  return {scope:"assignment" as const,gradeItemId:uuid(input.gradeItemId),grades};
 }
 const input=object(body,["scope","sectionIds","gradeItemIds"],["scope","sectionIds"]);
 if(input.scope!=="pending")throw new BadRequestException();
 return {scope:"pending" as const,sectionIds:selectionIds(input.sectionIds),
  gradeItemIds:input.gradeItemIds===undefined?[]:selectionIds(input.gradeItemIds)};
}
export type Selection=Exclude<ReturnType<typeof publicationRequest>,{scope:"assignment"}>;
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
   gradeItemIds:group.gradeItemIds.map(uuid).sort((a,b)=>a.localeCompare(b,"en"))};
 });
 const items=groups.flatMap(g=>g.gradeItemIds),ids=groups.flatMap(g=>g.id?[g.id]:[]);
 if(new Set(items).size!==items.length || new Set(ids).size!==ids.length)throw new BadRequestException();
 return {expectedVersion:input.expectedVersion,confirmRecalculation:boolean(input.confirmRecalculation),groups};
}

export function pointsInput(points:unknown) {
 if(typeof points!=="number" || points<0 || points>999999.99 || !/^\d+(?:\.\d{1,2})?$/.test(String(points)))throw new BadRequestException();
 return points;
}

export function correctionInput(body:unknown) {
 const required=["revisionId","expectedRevisionId","points","reason"];
 const input=object(body,[...required,"attemptId","feedback"],required);
 return {revisionId:uuid(input.revisionId),expectedRevisionId:input.expectedRevisionId===null?null:uuid(input.expectedRevisionId),
  points:pointsInput(input.points),reason:text(input.reason,500),
  attemptId:"attemptId" in input ? uuid(input.attemptId) : undefined,
  feedback:"feedback" in input ? feedbackInput(input.feedback) : undefined};
}
