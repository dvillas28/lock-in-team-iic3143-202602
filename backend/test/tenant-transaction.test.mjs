import assert from "node:assert/strict";
import {test} from "node:test";
import {transaction} from "../dist/database/tenant-transaction.js";
test("transaction commits once, rolls back errors and destroys uncertain clients",async()=>{
 for(const fail of [null,"operation","rollback"]) {
  const queries=[];let released;
  const client={query:async sql=>{queries.push(sql);if(sql==="ROLLBACK" && fail==="rollback")throw Error();},release:broken=>{released=broken;}};
  const run=()=>transaction({connect:async()=>client},async c=>{assert.equal(c,client);if(fail)throw Error("failed");return 42;});
  if(fail)await assert.rejects(run());else assert.equal(await run(),42);
  assert.deepEqual(queries,["BEGIN",fail?"ROLLBACK":"COMMIT"]);assert.equal(released,fail==="rollback");
 }
});
