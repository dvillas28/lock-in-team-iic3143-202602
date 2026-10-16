import { BadRequestException } from "@nestjs/common";
export function uuid(value: unknown): string {
  if (typeof value!=="string" || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) throw new BadRequestException();
  return value.toLowerCase();
}
export function slug(value: string) {
  if(value.length>63 || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(value)) throw new BadRequestException(); return value;
}
export function object(body: unknown, allowed: string[], required: string[] = []) {
  if (!body || typeof body!=="object" || Array.isArray(body)) throw new BadRequestException();
  const dto=body as Record<string,unknown>, keys=Object.keys(dto);
  if (!keys.length || keys.some(k=>!allowed.includes(k)) || required.some(k=>!keys.includes(k))) throw new BadRequestException();
  return dto;
}
export function text(value: unknown, max: number) {
  if(typeof value!=="string" || !value.trim() || [...value.trim()].length>max) throw new BadRequestException(); return value.trim();
}
export function capacity(value: unknown) {
  if(value===null || value===undefined) return null;
  if(typeof value!=="number" || !Number.isInteger(value) || value<0 || value>2147483647) throw new BadRequestException(); return value;
}
export function role(value: unknown) {
  if(!["teacher","assistant","student"].includes(value as string)) throw new BadRequestException(); return value as string;
}
export function boolean(value: unknown) {if(typeof value!=="boolean") throw new BadRequestException();return value;}
export function timestamp(value: unknown) {
  if(typeof value!=="string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(value) ||
    value.startsWith("0000") || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,19)!==value.slice(0,19))throw new BadRequestException();
  const fraction=value.slice(19,-1).replace(".","");
  return value.slice(0,19)+"."+fraction.padEnd(6,"0")+"Z";
}
export function page(query: Record<string,unknown>, scope: string, filters: string[] = []) {
  if(Object.keys(query).some(k=>!["limit","cursor",...filters].includes(k))) throw new BadRequestException();
  if(query.limit!==undefined && (typeof query.limit!=="string" || !/^(?:[1-9][0-9]?|100)$/.test(query.limit))) throw new BadRequestException();
  const limit=query.limit===undefined ? 20 : Number(query.limit);
  let date: string|null=null,id: string|null=null;
  if(query.cursor!==undefined) {
    try {
      if(typeof query.cursor!=="string" || query.cursor.length>4096 || !/^[\w-]+$/.test(query.cursor)) throw new Error();
      const raw=Buffer.from(query.cursor,"base64url");
      if(raw.toString("base64url")!==query.cursor) throw new Error();
      const c=JSON.parse(raw.toString());
      if(c.scope!==scope) throw new Error();
      id=uuid(c.id); date=timestamp(c.date);
    } catch {throw new BadRequestException();}
  }
  return {limit,date,id,scope};
}
export function paginated<T extends {id:string}>(rows:T[], p: ReturnType<typeof page>, date:(row:T)=>string) {
  const hasMore=rows.length>p.limit, items=rows.slice(0,p.limit), last=items.at(-1);
  return {items,hasMore,nextCursor:hasMore && last ? Buffer.from(JSON.stringify({scope:p.scope,date:date(last),id:last.id})).toString("base64url") : null};
}
