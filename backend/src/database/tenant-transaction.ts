import { ConflictException, UnprocessableEntityException, ServiceUnavailableException } from "@nestjs/common";
import type { Pool, PoolClient } from "pg";

export async function transaction<T>(pool: Pool, operation: (client: PoolClient)=>Promise<T>) {
  const client=await pool.connect();
  let broken=false;
  try {
    await client.query("BEGIN"); const result=await operation(client); await client.query("COMMIT"); return result;
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>{broken=true;});
    const code=(error as {code?:string}).code;
    if (code==="23505") throw new ConflictException();
    if (code==="23514" || code==="23503") throw new UnprocessableEntityException();
    if (code?.startsWith("08") || code==="57P01" || code==="ECONNREFUSED") throw new ServiceUnavailableException();
    throw error;
  } finally {client.release(broken);}
}
