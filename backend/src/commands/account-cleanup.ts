import {Pool} from "pg";
import {randomUUID} from "node:crypto";
import {operationalConfig,OperationError,reportError} from "../database/config";
import {transaction} from "../database/tenant-transaction";
import {createAvatarStorage,assertAvatarKey} from "../accounts/providers/avatar-storage";

interface CleanupOptions {apply?:boolean;batch?:number;now?:Date;operatorRef?:string;avatarAfter?:string}
export async function cleanupAccounts(env:NodeJS.ProcessEnv=process.env,options:CleanupOptions={}) {
 const batch=options.batch??100,now=options.now??new Date(),apply=options.apply??false;
 const operatorRef=options.operatorRef??env.ACCOUNT_MAINTENANCE_OPERATOR_REF??"";
 if(!Number.isInteger(batch)||batch<1||batch>500||!Number.isFinite(now.getTime())||
  (apply&&(!operatorRef.trim()||operatorRef.length>200)))throw new OperationError("config");
 if(options.avatarAfter!==undefined) {
  try {assertAvatarKey(options.avatarAfter);}catch {throw new OperationError("config");}
 }
 const pool=new Pool({...operationalConfig(env),max:1,application_name:"academix-account-maintenance"});
 let imports=0,invitations=0,avatars=0;
 const operationId=randomUUID();
 try {
  await transaction(pool,async db=>{
   const lots=(await db.query(`SELECT id,institution_id FROM public.user_imports WHERE pii_purged_at IS NULL
    AND coalesce(confirmed_at,expires_at)<=$1::timestamptz-interval '7 days'
    ORDER BY coalesce(confirmed_at,expires_at),id LIMIT $2 FOR UPDATE SKIP LOCKED`,[now,batch])).rows;
   imports=lots.length;
   if(apply)for(const lot of lots) {
    await db.query("UPDATE public.user_import_rows SET name=NULL,normalized_email=NULL WHERE institution_id=$1 AND import_id=$2",[lot.institution_id,lot.id]);
    await db.query("UPDATE public.user_imports SET input_fingerprint=NULL,pii_purged_at=$1,status=CASE WHEN status='previewed' THEN 'expired' ELSE status END WHERE id=$2",[now,lot.id]);
    await db.query(`INSERT INTO public.audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,changes)
     VALUES(gen_random_uuid(),$1,NULL,'import.purged','userImport',$2,$3)`,[lot.institution_id,lot.id,{before:null,after:{source:"operatorMaintenance",operationId,operatorRef}}]);
   }
   const pending=(await db.query(`SELECT id,institution_id FROM public.account_invitations WHERE pii_purged_at IS NULL AND
    ((closed_at IS NOT NULL AND closed_at<=$1::timestamptz-interval '30 days') OR
     (status='pending' AND expires_at<=$1::timestamptz-interval '30 days') OR
     (status='pending' AND delivery_version=0 AND created_at<=$1::timestamptz-interval '30 days'))
    ORDER BY created_at,id LIMIT $2 FOR UPDATE SKIP LOCKED`,[now,batch])).rows;
   invitations=pending.length;
   if(apply)for(const invite of pending) {
    await db.query(`UPDATE public.account_invitations SET normalized_email=NULL,invited_name=NULL,token_hash=NULL,input_fingerprint=NULL,pii_purged_at=$1,
     status=CASE WHEN status='pending' THEN CASE WHEN delivery_version=0 THEN 'revoked' ELSE 'expired' END ELSE status END,
     revoked_at=CASE WHEN status='pending' AND delivery_version=0 THEN $1 ELSE revoked_at END,
     closed_at=coalesce(closed_at,expires_at,$1) WHERE id=$2`,[now,invite.id]);
    await db.query(`INSERT INTO public.audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,changes)
     VALUES(gen_random_uuid(),$1,NULL,'invitation.purged','accountInvitation',$2,$3)`,[invite.institution_id,invite.id,{before:null,after:{source:"operatorMaintenance",operationId,operatorRef}}]);
   }
  });
  const storage=createAvatarStorage(env);
  let inspected=0,avatarCursor:string|null=null;
  const cutoff=new Date(now.getTime()-86_400_000);
  if(storage.available&&storage.list)for await(const candidate of storage.list(options.avatarAfter)) {
   inspected++;
   if(candidate.lastModified<cutoff) {
    const references=(await pool.query("SELECT 1 FROM public.users WHERE avatar_key=$1 LIMIT 1",[candidate.key])).rowCount;
    if(!references) {
     if(apply)await storage.delete(candidate.key);
     avatars++;
    }
   }
   if(inspected===batch) {avatarCursor=candidate.key;break;}
  }
  return {operation:"account-cleanup",outcome:"ok",applied:apply,batch,imports,invitations,avatars,avatarsInspected:inspected,avatarCursor};
 } finally {await pool.end();}
}
if(require.main===module) {
 const args=process.argv.slice(2).filter(a=>a!=="--");
 if(args.some(a=>a!=="--apply"&&!/^--batch=\d+$/.test(a)&&!a.startsWith("--avatar-after="))){reportError("account-cleanup",new OperationError("config"));process.exitCode=1;}
 else cleanupAccounts(process.env,{apply:args.includes("--apply"),batch:Number(args.find(a=>a.startsWith("--batch="))?.slice(8)??100),avatarAfter:args.find(a=>a.startsWith("--avatar-after="))?.slice(15)})
  .then(result=>console.log(JSON.stringify(result))).catch(error=>{reportError("account-cleanup",error);process.exitCode=1;});
}
