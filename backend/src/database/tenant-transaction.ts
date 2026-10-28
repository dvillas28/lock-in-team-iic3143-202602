import { ConflictException, UnprocessableEntityException, ServiceUnavailableException } from "@nestjs/common";
import type { Pool, PoolClient } from "pg";

export async function transaction<T>(pool: Pool, operation: (client: PoolClient)=>Promise<T>) {
  const client=await pool.connect();
  let broken=false;
  // pg-pool handles errors only while a client is idle in the pool. A checked-out
  // client can disconnect between queries; keep that event from terminating HTTP.
  let disconnected=false;
  const onError=()=>{broken=true;disconnected=true;};
  const assertConnected=()=>{if(disconnected)throw new ServiceUnavailableException();};
  client.on("error",onError);
  try {
    await client.query("BEGIN");
    assertConnected();
    const result=await operation(client);
    assertConnected();
    await client.query("COMMIT");
    assertConnected();
    return result;
  } catch(error) {
    if(!disconnected)await client.query("ROLLBACK").catch(()=>{broken=true;});
    assertConnected();
    const code=(error as {code?:string}).code;
    if (code==="23505") throw new ConflictException();
    if (code==="23514" || code==="23503") throw new UnprocessableEntityException();
    if (code?.startsWith("08") || code==="57P01" || code==="ECONNREFUSED") throw new ServiceUnavailableException();
    throw error;
  } finally {client.release(broken);client.removeListener("error",onError);}
}
