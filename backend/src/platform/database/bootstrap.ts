import { randomUUID, randomBytes } from "node:crypto";
import { Pool } from "pg";
import { hash, argon2id } from "argon2";
import { connectionConfig, OperationError, reportError } from "./config";
import { assertSchema } from "./schema";
import { demoInstitutions, demoUsers } from "./demo-data";

function validate(env: NodeJS.ProcessEnv) {
  const flag = env.DEMO_BOOTSTRAP_ENABLED;
  if (flag === undefined || flag === "false") return false;
  if (flag !== "true") throw new OperationError("config");
  for (const user of demoUsers) {
    const password = env[user.secret];
    if (!password || [...password].length < 8 || [...password].length > 30
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(user.id)
      || !/^[^\s@]+@[^\s@]+\.example$/.test(user.email) || user.email.length > 254
      || !user.name.trim() || user.name.length > 200
      || user.memberships.some(m => !demoInstitutions.some(i => i.slug === m.slug))) throw new OperationError("config");
  }
  for (const institution of demoInstitutions) {
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(institution.slug)
      || institution.slug.length > 63 || !institution.name.trim() || institution.name.length > 200) throw new OperationError("config");
  }
  return true;
}

export async function bootstrap(env: NodeJS.ProcessEnv = process.env) {
  const started = Date.now();
  const created = {institutions: 0, users: 0, memberships: 0};
  const existing = {institutions: 0, users: 0, memberships: 0};
  const summary = (outcome: string) => ({operation: "bootstrap", outcome, created, existing, durationMs: Date.now()-started});
  if (!validate(env)) return summary("skipped");
  const pool = new Pool({...connectionConfig(env), max: 1, connectionTimeoutMillis: 5000,
    options: "-c lock_timeout=10000 -c statement_timeout=15000 -c search_path=public"});
  pool.on("error", error => reportError("bootstrap", error));
  try {
    const client = await pool.connect();
    let failed = false;
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(202610150002)");
      await assertSchema(client);
      const institutionIds = new Map<string,string>();
      for (const institution of demoInstitutions) {
        let rows = await client.query("SELECT id FROM public.institutions WHERE slug=$1", [institution.slug]);
        if (rows.rowCount) existing.institutions++;
        else {
          const inserted = await client.query("INSERT INTO public.institutions(id,slug,name) VALUES($1,$2,$3) ON CONFLICT(slug) DO NOTHING RETURNING id", [randomUUID(), institution.slug, institution.name]);
          if (inserted.rowCount) created.institutions++; else existing.institutions++;
          rows = await client.query("SELECT id FROM public.institutions WHERE slug=$1", [institution.slug]);
        }
        if (rows.rowCount !== 1) throw new OperationError("conflict");
        institutionIds.set(institution.slug, rows.rows[0].id);
      }
      for (const user of demoUsers) {
        const result = await client.query("SELECT id,lower(btrim(email)) AS email FROM public.users WHERE id=$1 OR lower(btrim(email))=$2", [user.id, user.email]);
        if (result.rows.some(row => row.id !== user.id || row.email !== user.email)) throw new OperationError("conflict");
        if (!result.rowCount) {
          const encoded = await hash(env[user.secret]!, {type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1, salt: randomBytes(16)});
          await client.query("INSERT INTO public.users(id,email,password_hash,name,active) VALUES($1,$2,$3,$4,$5)", [user.id, user.email, encoded, user.name, user.active]);
          created.users++;
        } else existing.users++;
        for (const membership of user.memberships) {
          let resolved = await client.query("SELECT id FROM public.institution_memberships WHERE institution_id=$1 AND user_id=$2", [institutionIds.get(membership.slug), user.id]);
          if (resolved.rowCount) existing.memberships++;
          else {
            const inserted = await client.query("INSERT INTO public.institution_memberships(id,institution_id,user_id,active) VALUES($1,$2,$3,$4) ON CONFLICT(institution_id,user_id) DO NOTHING RETURNING id", [randomUUID(), institutionIds.get(membership.slug), user.id, membership.active]);
            if (inserted.rowCount) created.memberships++; else existing.memberships++;
            resolved = await client.query("SELECT id FROM public.institution_memberships WHERE institution_id=$1 AND user_id=$2", [institutionIds.get(membership.slug), user.id]);
          }
          if (resolved.rowCount !== 1) throw new OperationError("conflict");
        }
      }
      await client.query("COMMIT");
      return summary("ok");
    } catch (error) {
      failed = true;
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally { client.release(failed); }
  } finally { await pool.end(); }
}

if (require.main === module) {
  bootstrap().then(result => console.log(JSON.stringify(result)))
    .catch(error => { reportError("bootstrap",error); process.exitCode=1; });
}
