import assert from "node:assert/strict";
import {randomBytes, randomUUID} from "node:crypto";
import {hash, argon2id} from "argon2";
import {membersFixture, users} from "./course-fixtures.mjs";
import {runtimeDatabase} from "./helpers.mjs";

export {users};
export const newPassword=()=>`Test-${randomBytes(12).toString("hex")}`;
export async function accountFixture(pool) {
 const fixture=await membersFixture(pool);
 const standalone={id:randomUUID(),email:`own-${randomUUID()}@example.test`,password:newPassword()};
 const encoded=await hash(standalone.password,{type:argon2id,memoryCost:19456,timeCost:2,parallelism:1});
 await pool.query("INSERT INTO public.users(id,email,name,password_hash) VALUES($1,$2,'Cuenta sin institución',$3)",[standalone.id,standalone.email,encoded]);
 return {...fixture,standalone};
}
export async function accountRequest(app,token,path,method="GET",body,extra={}) {
 const headers={...(token?{Authorization:`Bearer ${token}`} : {}),...extra};
 if(body!==undefined)headers["Content-Type"]="application/json";
 return fetch(app.base+"/api/v1"+path,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
}
export async function loginStandalone(app,standalone) {
 const response=await accountRequest(app,null,"/auth/login","POST",{email:standalone.email,password:standalone.password});
 assert.equal(response.status,200);return (await response.json()).accessToken;
}
export async function failAccountAudit(pool) {
 await pool.query(`CREATE FUNCTION public.fail_account_event_test() RETURNS trigger LANGUAGE plpgsql AS $$
  BEGIN RAISE EXCEPTION 'fixture account audit failure'; END $$`);
 await pool.query("CREATE TRIGGER fail_account_event_test BEFORE INSERT ON public.account_security_events FOR EACH ROW EXECUTE FUNCTION public.fail_account_event_test()");
}
export async function restoreAccountAudit(pool) {
 await pool.query("DROP TRIGGER fail_account_event_test ON public.account_security_events; DROP FUNCTION public.fail_account_event_test()");
}
export async function accountServices() {
 const [{AuditService},{AccountsService},{InvitationsService},{FakeInvitationMailer},{DisabledAvatarStorage}]=await Promise.all([
  import("../../dist/audit/audit.service.js"),import("../../dist/accounts/accounts.service.js"),
  import("../../dist/accounts/invitations.service.js"),import("../../dist/accounts/providers/mailer.js"),
  import("../../dist/accounts/providers/avatar-storage.js"),
 ]);
 const runtime=await runtimeDatabase(),audit=new AuditService(),mailer=new FakeInvitationMailer({NODE_ENV:"test"});
 const integrations={avatars:new DisabledAvatarStorage(),mailer,origins:new Map([["uc","http://uc.localhost:3000"],["utfsm","http://utfsm.localhost:3000"]]),
  capabilities(){return {avatar:this.avatars.available,invitationEmail:this.mailer.available};}};
 return {runtime,audit,mailer,integrations,accounts:new AccountsService(runtime,integrations),invitations:new InvitationsService(runtime,audit,integrations),close:()=>runtime.onApplicationShutdown()};
}
export function inviteCode(mailer,index=mailer.messages.length-1) {
 const text=mailer.messages[index]?.text;
 assert.equal(typeof text,"string");
 const code=/\/activate#token=([A-Za-z0-9_-]{43})/.exec(text)?.[1];
 assert.equal(typeof code,"string","test message missing activation link");return code;
}
export function status(error) {return error?.getStatus?.();}
