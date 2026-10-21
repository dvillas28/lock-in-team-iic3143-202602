import {OperationError} from "../database/config";
export function corsOrigins(env:NodeJS.ProcessEnv=process.env):string[] {
 try {
  const values:unknown=JSON.parse(env.CORS_ALLOWED_ORIGINS??"[]");
  if(!Array.isArray(values) || values.some(v=>typeof v!=="string" || new URL(v).origin!==v || !["http:","https:"].includes(new URL(v).protocol)))throw Error();
  if(env.NODE_ENV==="production" && (["https://uc.academix.dvillasc.me","https://utfsm.academix.dvillasc.me"].some(v=>!values.includes(v)) || values.some(v=>new URL(v).protocol!=="https:")))throw Error();
  return values;
 }catch{throw new OperationError("config");}
}
