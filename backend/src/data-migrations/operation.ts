import { createHash } from "node:crypto";
import { Pool } from "pg";
import { connectionConfig, reportError } from "../database/config";
import { text } from "../courses/validation";
export const fingerprint=(input:unknown)=>createHash("sha256").update(JSON.stringify(input)).digest("hex");
export const evidence=(operationId:unknown,operatorRef:unknown)=>({source:"operatorMigration",operationId:text(operationId,128),operatorRef:text(operatorRef,200)});
export async function run(operation:string, fn:(pool:Pool)=>Promise<unknown>) {
 let pool:Pool|undefined;
 try {
  pool=new Pool({...connectionConfig(),connectionTimeoutMillis:5000,options:"-c lock_timeout=10000 -c statement_timeout=15000 -c search_path=public"});
  pool.on("error",()=>{});
  console.log(JSON.stringify(await fn(pool)));
 }
 catch(error){reportError(operation,error);process.exitCode=1;}
 finally{await pool?.end();}
}
