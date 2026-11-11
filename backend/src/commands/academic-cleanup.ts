import {Pool} from "pg";
import {operationalConfig,OperationError,reportError} from "../database/config";
import {assertMaterialKey,assertSubmissionKey,configuredStorage,type ObjectStorage} from "../academic-files/object-storage";

interface Options {apply?:boolean;batch?:number;after?:string;now?:Date;submissions?:boolean}
export async function collectOrphans(storage:ObjectStorage, referenced:(key:string)=>Promise<boolean>, options:Options={}) {
 const {apply=false,batch=100,after,now=new Date(),submissions=false}=options;
 if (!Number.isInteger(batch)||batch<1||batch>500||!Number.isFinite(now.getTime())) throw new OperationError("config");
 if (after) (submissions?assertSubmissionKey:assertMaterialKey)(after);
 const cutoff=now.getTime()-24*60*60*1000;
 let inspected=0,orphans=0,cursor:string|null=null;
 for await (const item of (submissions?storage.listSubmissions(after):storage.listMaterials(after))) {
  inspected++;
  if (item.modified.getTime()<cutoff && !(await referenced(item.key))) {
   if (apply) await storage.delete(item.key);
   orphans++;
  }
  if (inspected===batch) {cursor=item.key;break;}
 }
 return {operation:"academic-cleanup",outcome:"ok",applied:apply,inspected,orphans,cursor};
}

export async function cleanupAcademicFiles(env:NodeJS.ProcessEnv=process.env,options:Options={}) {
 const store=configuredStorage(env);
 if (!store) throw new OperationError("config");
 const pool=new Pool({...operationalConfig(env),max:1,connectionTimeoutMillis:3000,application_name:"academix-academic-maintenance"});
 try {
  // A runtime connection with a tenant context cannot establish that a key is unreferenced.
  const table=options.submissions?"assignment_attempt_files":"materials";
  const policy=(await pool.query(`SELECT current_user=pg_get_userbyid(relowner) AS owner
   FROM pg_class WHERE oid=$1::regclass`,[`public.${table}`])).rows[0];
  const all=(await pool.query(`SELECT 1 FROM pg_policies
   WHERE schemaname='public' AND tablename=$1 AND policyname='operator_maintenance'
   AND cmd='ALL' AND qual='true' AND current_user=ANY(roles)`,[table])).rowCount;
  if (!policy?.owner || !all) throw new OperationError("config");
  return await collectOrphans(store,async key=>!!(await pool.query(
   `SELECT 1 FROM public.${table} WHERE file_key=$1`,[key])).rowCount,options);
 } finally {await pool.end();}
}
if (require.main===module) {
 const args=process.argv.slice(2).filter(arg=>arg!=="--");
 if (args.some(arg=>arg!=="--apply" && arg!=="--submissions" && !/^--batch=\d+$/.test(arg) && !arg.startsWith("--after="))) {
  reportError("academic-cleanup",new OperationError("config"));process.exitCode=1;
 } else {
  const options={submissions:args.includes("--submissions"),apply:args.includes("--apply"),batch:Number(args.find(arg=>arg.startsWith("--batch="))?.slice(8)??100),
   after:args.find(arg=>arg.startsWith("--after="))?.slice(8)};
  cleanupAcademicFiles(process.env,options).then(result=>console.log(JSON.stringify(result)))
   .catch(error=>{reportError("academic-cleanup",error);process.exitCode=1;});
 }
}
