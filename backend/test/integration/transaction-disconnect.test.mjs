import assert from "node:assert/strict";
import {once} from "node:events";
import {test} from "node:test";
import {database,migrated,runtimeDatabase} from "./helpers.mjs";

test("a checked-out PostgreSQL disconnect between queries returns 503 and the pool recovers",async()=>{
 const pool=await database();let runtime;let terminatedPid;
 try {
  await migrated(pool);runtime=await runtimeDatabase();
  await assert.rejects(runtime.withIdentity(null,async client=>{
   terminatedPid=(await client.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
   // Observe the real event before allowing the callback to return without another query.
   const disconnected=once(client,"error",{signal:AbortSignal.timeout(5000)});
   const [termination]=await Promise.all([
    pool.query("SELECT pg_terminate_backend($1,1000) AS terminated",[terminatedPid]),disconnected,
   ]);
   assert.equal(termination.rows[0].terminated,true);
   return "must not commit";
  }),error=>error.getStatus?.()===503);
  const recovered=await runtime.withIdentity(null,client=>client.query(`SELECT pg_backend_pid() AS pid,
   current_setting('academix.actor_id') AS actor,current_setting('academix.institution_id') AS institution`));
  assert.notEqual(recovered.rows[0].pid,terminatedPid);
  assert.equal(recovered.rows[0].actor,"");assert.equal(recovered.rows[0].institution,"");
 } finally {await runtime?.onApplicationShutdown();await pool.end();}
});
