import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {fixture, authorized} from "./helpers.mjs";
export const users={owner:"10000000-0000-4000-8000-000000000003",other:"10000000-0000-4000-8000-000000000001",foreign:"10000000-0000-4000-8000-000000000002",revoked:"10000000-0000-4000-8000-000000000004",inactive:"10000000-0000-4000-8000-000000000005"};
export async function membersFixture(pool) {
 const env=await fixture(pool);
 const tenants=Object.fromEntries((await pool.query("SELECT slug,id FROM institutions")).rows.map(r=>[r.slug,r.id]));
 await pool.query("UPDATE institution_memberships SET is_admin=true WHERE institution_id=$1 AND user_id=ANY($2::uuid[])",[tenants.uc,[users.owner,users.other]]);
 await pool.query("UPDATE institution_memberships SET is_super_admin=true WHERE institution_id=$1 AND user_id=$2",[tenants.uc,users.owner]);
 return {env,tenants};
}
export async function coursesFixture(pool) {
 const {env,tenants}=await membersFixture(pool);
 const own=randomUUID(),other=randomUUID(),foreign=randomUUID(),s1=randomUUID(),s2=randomUUID(),s3=randomUUID(),s4=randomUUID();
 for(const [id,tenant,owner,code] of [[own,tenants.uc,users.owner,"A"],[other,tenants.uc,users.other,"B"],[foreign,tenants.utfsm,users.foreign,"C"]])
  await pool.query("INSERT INTO courses(id,institution_id,created_by,code,name,term) VALUES($1,$2,$3,$4,$4,\u00272026-2\u0027)",[id,tenant,owner,code]);
 for(const [id,tenant,course,code] of [[s1,tenants.uc,own,"1"],[s2,tenants.uc,own,"2"],[s3,tenants.uc,other,"1"],[s4,tenants.utfsm,foreign,"1"]])
  await pool.query("INSERT INTO sections(id,institution_id,course_id,code) VALUES($1,$2,$3,$4)",[id,tenant,course,code]);
 const add=async(section,user,role,tenant=tenants.uc)=>{
  const id=randomUUID();await pool.query("INSERT INTO enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,$5)",[id,tenant,section,user,role]);return id;
 };
 const teacher=await add(s1,users.owner,"teacher");await add(s1,users.owner,"student");await add(s1,users.other,"assistant");await add(s3,users.owner,"teacher");
 return {env,tenants,own,other,foreign,s1,s2,s3,s4,teacher,add};
}
export async function request(app,token,path,method="GET",body) {
 const response=await fetch(`${app.base}/api/v1/institutions/${path}`,{...authorized(token),method,...(body===undefined?{}:{headers:{...authorized(token).headers,"Content-Type":"application/json"},body:JSON.stringify(body)})});
 const result=await response.json();assert.equal(response.headers.get("cache-control"),"no-store");return {status:response.status,body:result,headers:response.headers};
}
export async function failAudit(pool, action="*", resourceId=null) {
 if(resourceId)assert.match(resourceId,/^[0-9a-f-]{36}$/);
 await pool.query(`CREATE FUNCTION public.fail_audit_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF (NEW.action=$1 OR $1=\u0027*\u0027) AND ${resourceId ? `NEW.resource_id=\u0027${resourceId}\u0027` : "true"} THEN RAISE EXCEPTION \u0027fixture audit failure\u0027; END IF; RETURN NEW; END $$`.replaceAll("$1",`\u0027${action}\u0027`));
 await pool.query("CREATE TRIGGER fail_audit_test BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION fail_audit_test()");
}
export async function restoreAudit(pool) {await pool.query("DROP TRIGGER fail_audit_test ON audit_events; DROP FUNCTION fail_audit_test()");}
