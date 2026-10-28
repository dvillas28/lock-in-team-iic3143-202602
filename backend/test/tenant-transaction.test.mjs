import assert from "node:assert/strict";
import {test} from "node:test";
import {EventEmitter} from "node:events";
import {transaction} from "../dist/database/tenant-transaction.js";
test("transaction commits once, rolls back errors and destroys uncertain clients",async()=>{
 for(const fail of [null,"operation","rollback"]) {
  const queries=[];let released;
  const client=Object.assign(new EventEmitter(),{query:async sql=>{queries.push(sql);if(sql==="ROLLBACK" && fail==="rollback")throw Error();},release:broken=>{released=broken;}});
  const run=()=>transaction({connect:async()=>client},async c=>{assert.equal(c,client);if(fail)throw Error("failed");return 42;});
  if(fail)await assert.rejects(run());else assert.equal(await run(),42);
  assert.deepEqual(queries,["BEGIN",fail?"ROLLBACK":"COMMIT"]);assert.equal(released,fail==="rollback");assert.equal(client.listenerCount("error"),0);
 }
});

test("checked-out disconnects become 503, destroy the client and never commit a result",async()=>{
 for(const phase of ["BEGIN","operation","COMMIT","ROLLBACK"]) {
  const queries=[];let released;let operations=0;
  const client=Object.assign(new EventEmitter(),{
   query:async sql=>{queries.push(sql);if(sql===phase)client.emit("error",new Error("sensitive connection detail"));},
   release:broken=>{released=broken;},
  });
  await assert.rejects(transaction({connect:async()=>client},async()=>{
   operations++;
   if(phase==="operation")client.emit("error",new Error("sensitive connection detail"));
   if(phase==="ROLLBACK")throw Error("operation failed");
   return "must not succeed";
  }),error=>error.getStatus?.()===503 && !error.message.includes("sensitive"));
  assert.equal(released,true);assert.equal(client.listenerCount("error"),0);assert.equal(operations,phase==="BEGIN"?0:1);
  assert.deepEqual(queries,phase==="COMMIT"?["BEGIN","COMMIT"]:phase==="ROLLBACK"?["BEGIN","ROLLBACK"]:["BEGIN"]);
 }
});
