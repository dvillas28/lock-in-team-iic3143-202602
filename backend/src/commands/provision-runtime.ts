import {checkRuntime} from "../database/runtime-check";
import { Client } from "pg";
import { operationalConfig, connectionConfig, OperationError, reportError } from "../database/config";
export function runtimeTarget(env:NodeJS.ProcessEnv=process.env) {
 const url=new URL(connectionConfig(env).connectionString!);
 if(decodeURIComponent(url.username)!=="academix_runtime" || !url.password)throw new OperationError("config");
 const operation=operationalConfig(env),target=new URL(operation.connectionString!);
 if(url.hostname!==target.hostname || (url.port||"5432")!==(target.port||"5432") || url.pathname!==target.pathname)throw new OperationError("config");
 return {url,operation};
}
export async function provisionRuntime(env:NodeJS.ProcessEnv=process.env) {
 const {url,operation}=runtimeTarget(env);
 const admin=new Client(operation);
 try {
  await admin.connect();
  await admin.query("BEGIN");
  await admin.query("SELECT pg_advisory_xact_lock(202610200001)");
  const role=(await admin.query(`SELECT rolcanlogin,rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole
   OR EXISTS(SELECT FROM pg_auth_members WHERE member=r.oid)
   OR EXISTS(SELECT FROM pg_class WHERE relowner=r.oid AND relnamespace='public'::regnamespace) AS unsafe
   FROM pg_roles r WHERE rolname='academix_runtime'`)).rows[0];
  if(!role)throw new OperationError("schema");
  if(role.unsafe)throw new OperationError("config");
  if(!role.rolcanlogin) {
   const literal=(await admin.query("SELECT quote_literal($1) AS value",[decodeURIComponent(url.password)])).rows[0].value;
   await admin.query(`ALTER ROLE academix_runtime LOGIN PASSWORD ${literal}`);
  }
  await admin.query("COMMIT");
 } catch(error) {await admin.query("ROLLBACK").catch(()=>{});throw error;}
 finally {await admin.end();}
 await validateRuntime(env);
 return {operation:"provision-runtime",outcome:"ok"};
}
export async function validateRuntime(env:NodeJS.ProcessEnv=process.env) {
 const runtime=new Client(connectionConfig(env));
 try {await runtime.connect();await checkRuntime(runtime);} finally {await runtime.end();}
}
if(require.main===module) provisionRuntime().then(r=>console.log(JSON.stringify(r))).catch(e=>{reportError("provision-runtime",e);process.exitCode=1;});
