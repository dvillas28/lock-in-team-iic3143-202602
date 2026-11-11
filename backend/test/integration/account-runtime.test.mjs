import assert from "node:assert/strict";
import {test} from "node:test";
import {database,runtimeDatabase} from "./helpers.mjs";
import {accountFixture} from "./account-fixtures.mjs";

test("readiness rejects widened global audit policies, account function grants and writer tenant bypass",async()=>{
 const pool=await database();let runtime;
 try {
  await accountFixture(pool);runtime=await runtimeDatabase();await runtime.check();
  await pool.query("CREATE POLICY account_test_leak ON public.account_security_events FOR SELECT TO PUBLIC USING(true)");
  await assert.rejects(()=>runtime.check(),/Unsafe account audit policies/);
  await pool.query("DROP POLICY account_test_leak ON public.account_security_events");
  await runtime.check();
  await pool.query("GRANT EXECUTE ON FUNCTION public.account_change_password(text,integer) TO PUBLIC");
  await assert.rejects(()=>runtime.check(),/Unsafe account functions/);
  await pool.query("REVOKE EXECUTE ON FUNCTION public.account_change_password(text,integer) FROM PUBLIC");
  await runtime.check();
  await pool.query("ALTER POLICY account_invitation_accept ON public.account_invitations USING(true) WITH CHECK(true)");
  await assert.rejects(()=>runtime.check(),/Unsafe account writer policies/);
  await pool.query(`ALTER POLICY account_invitation_accept ON public.account_invitations
   USING(institution_id=NULLIF(current_setting('academix.institution_id',true),'')::uuid)
   WITH CHECK(institution_id=NULLIF(current_setting('academix.institution_id',true),'')::uuid)`);
  await runtime.check();
 }finally{if(runtime)await runtime.onApplicationShutdown();await pool.end();}
});
