import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { hash, argon2id } from "argon2";
import { connectionConfig, OperationError, reportError } from "../database/config";

const demoInstitutions = [{slug: "uc", name: "UC"}, {slug: "utfsm", name: "UTFSM"}] as const;
const demoUsers = [
  {id: "10000000-0000-4000-8000-000000000001", name: "demo-uc", email: "demo-uc@academix.example", active: true, secret: "DEMO_UC_PASSWORD", memberships: [{slug: "uc", active: true}]},
  {id: "10000000-0000-4000-8000-000000000002", name: "demo-utfsm", email: "demo-utfsm@academix.example", active: true, secret: "DEMO_UTFSM_PASSWORD", memberships: [{slug: "utfsm", active: true}]},
  {id: "10000000-0000-4000-8000-000000000003", name: "demo-multi", email: "demo-multi@academix.example", active: true, secret: "DEMO_MULTI_PASSWORD", memberships: [{slug: "uc", active: true}, {slug: "utfsm", active: true}]},
  {id: "10000000-0000-4000-8000-000000000004", name: "demo-revocado", email: "demo-revocado@academix.example", active: true, secret: "DEMO_REVOKED_PASSWORD", memberships: [{slug: "uc", active: false}]},
  {id: "10000000-0000-4000-8000-000000000005", name: "demo-inactivo", email: "demo-inactivo@academix.example", active: false, secret: "DEMO_INACTIVE_PASSWORD", memberships: [{slug: "uc", active: true}]},
] as const;

function validate(env: NodeJS.ProcessEnv) {
  for (const user of demoUsers) {
    const password = env[user.secret];
    if (!password || [...password].length < 8 || [...password].length > 30) throw new OperationError("config");
  }
}

async function institutionId(client: Client, institution: typeof demoInstitutions[number]) {
  const found = await client.query("SELECT id FROM public.institutions WHERE slug=$1", [institution.slug]);
  if (found.rowCount) return {id: found.rows[0].id as string, created: false};
  const inserted = await client.query("INSERT INTO public.institutions(id,slug,name) VALUES($1,$2,$3) ON CONFLICT(slug) DO NOTHING RETURNING id", [randomUUID(), institution.slug, institution.name]);
  const result = inserted.rowCount ? inserted : await client.query("SELECT id FROM public.institutions WHERE slug=$1", [institution.slug]);
  if (result.rowCount !== 1) throw new OperationError("conflict");
  return {id: result.rows[0].id as string, created: Boolean(inserted.rowCount)};
}

async function insertUser(client: Client, user: typeof demoUsers[number], password: string) {
  const result = await client.query("SELECT id,lower(btrim(email)) AS email FROM public.users WHERE id=$1 OR lower(btrim(email))=$2", [user.id, user.email]);
  if (result.rows.some(row => row.id !== user.id || row.email !== user.email)) throw new OperationError("conflict");
  if (result.rowCount) return false;
  const encoded = await hash(password, {type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1});
  await client.query("INSERT INTO public.users(id,email,password_hash,name,active) VALUES($1,$2,$3,$4,$5)", [user.id, user.email, encoded, user.name, user.active]);
  return true;
}

async function insertMembership(client: Client, institution: string, user: string, active: boolean) {
  const found = await client.query("SELECT id FROM public.institution_memberships WHERE institution_id=$1 AND user_id=$2", [institution, user]);
  if (found.rowCount) return false;
  const inserted = await client.query("INSERT INTO public.institution_memberships(id,institution_id,user_id,active) VALUES($1,$2,$3,$4) ON CONFLICT(institution_id,user_id) DO NOTHING RETURNING id", [randomUUID(), institution, user, active]);
  const result = inserted.rowCount ? inserted : await client.query("SELECT id FROM public.institution_memberships WHERE institution_id=$1 AND user_id=$2", [institution, user]);
  if (result.rowCount !== 1) throw new OperationError("conflict");
  return Boolean(inserted.rowCount);
}

export async function seed(env: NodeJS.ProcessEnv = process.env) {
  validate(env);
  const started = Date.now();
  const created = {institutions: 0, users: 0, memberships: 0};
  const existing = {institutions: 0, users: 0, memberships: 0};
  const client = new Client({...connectionConfig(env), connectionTimeoutMillis: 5000,
    options: "-c lock_timeout=10000 -c statement_timeout=15000 -c search_path=public"});
  client.on("error", () => { /* The active operation reports a sanitized failure. */ });
  try {
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(202610150002)");
      const institutionIds = new Map<string,string>();
      // A single transaction client executes its queries sequentially.
      for (const institution of demoInstitutions) {
        const result = await institutionId(client, institution);
        (result.created ? created : existing).institutions++;
        institutionIds.set(institution.slug, result.id);
      }
      for (const user of demoUsers) {
        (await insertUser(client, user, env[user.secret]!) ? created : existing).users++;
        for (const membership of user.memberships) {
          (await insertMembership(client, institutionIds.get(membership.slug)!, user.id, membership.active) ? created : existing).memberships++;
        }
      }
      await client.query("COMMIT");
      return {operation: "seed", outcome: "ok", created, existing, durationMs: Date.now()-started};
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    }
  } finally { await client.end(); }
}

if (require.main === module) {
  seed().then(result => console.log(JSON.stringify(result)))
    .catch(error => { reportError("seed",error); process.exitCode=1; });
}
