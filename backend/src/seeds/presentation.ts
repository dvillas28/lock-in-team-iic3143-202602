import { Pool } from "pg";
import { operationalConfig, reportError } from "../database/config";
import { transaction } from "../database/tenant-transaction";
import { fingerprint } from "../data-migrations/operation";
import { presentationDefinition, presentationPlan, presentationVersion } from "./presentation-manifest";
import { completePresentationPlan, counts, insertPresentation, ownership, sameValue } from "./presentation-data";
import { checkPresentationSchema, readPresentationAccounts, rejectPresentationCollisions, verifyPresentation, PresentationError } from "./presentation-check";

export function presentationConfig(env: NodeJS.ProcessEnv, args: string[]) {
  const mode = args[0];
  if (args.length !== 1 || !["check", "preview", "apply", "verify"].includes(mode)) throw new PresentationError("config", "usage:check|preview|apply|verify");
  const config = operationalConfig(env);
  const target = new URL(config.connectionString!);
  // Require an independently reviewed target for every invocation, even read-only checks.
  if (!env.DEMO_SEED_EXPECTED_HOST || !env.DEMO_SEED_EXPECTED_DATABASE ||
    target.hostname !== env.DEMO_SEED_EXPECTED_HOST || decodeURIComponent(target.pathname.slice(1)) !== env.DEMO_SEED_EXPECTED_DATABASE) {
    throw new PresentationError("config", "expected_host_and_database_required_or_mismatched");
  }
  if (mode === "apply") {
    // A loopback URL can be a tunnel to production: never infer safety from its hostname.
    if (env.DEMO_SEED_ALLOW_PRODUCTION !== presentationVersion) {
      throw new PresentationError("config", "explicit_production_opt_in_required");
    }
    const operator = env.DEMO_OPERATOR_REF?.trim();
    if (!operator || [...operator].length > 200 || /[\u0000-\u001f\u007f]/.test(operator)) throw new PresentationError("config", "operator_reference_required");
  }
  return { mode, config };
}

export async function seedPresentation(env: NodeJS.ProcessEnv = process.env, args = process.argv.slice(2)) {
  const { mode, config } = presentationConfig(env, args);
  const pool = new Pool({ ...config, max: 1, connectionTimeoutMillis: 5000,
    options: "-c lock_timeout=10000 -c statement_timeout=15000 -c search_path=public" });
  pool.on("error", () => {});
  try {
    return await transaction(pool, async db => {
      // READ COMMITTED observes an apply that commits while the advisory lock is awaited.
      if (mode !== "apply") await db.query("SET TRANSACTION READ ONLY");
      await db.query(`SELECT ${mode === "apply" ? "pg_advisory_xact_lock" : "pg_advisory_xact_lock_shared"}(202610290001)`);
      const target = (await db.query("SELECT current_database() AS database,current_user AS operator")).rows[0];
      if (target.database !== env.DEMO_SEED_EXPECTED_DATABASE) throw new PresentationError("config", "connected_database_mismatch");
      await checkPresentationSchema(db);
      const tenants = await readPresentationAccounts(db, mode === "apply");
      const marker = (await db.query("SELECT input_fingerprint,result FROM public.demo_data_runs WHERE version=$1", [presentationVersion])).rows[0];
      if (marker && (marker.input_fingerprint !== fingerprint(presentationDefinition) || !marker.result?.anchor ||
        !sameValue(marker.result.tenants, tenants))) throw new PresentationError("conflict", "ledger_or_account_identity_mismatch");
      const anchor = marker?.result.anchor ?? new Date().toISOString();
      const plan = await completePresentationPlan(db, presentationPlan(tenants, anchor));
      const graph = ownership(plan);
      if (marker && !sameValue(marker.result.ownership, graph)) throw new PresentationError("conflict", "ledger_ownership_mismatch");
      if (!marker) await rejectPresentationCollisions(db, plan);
      if (mode === "verify" && !marker) throw new PresentationError("conflict", "seed_not_applied");
      const result = { operation: presentationVersion, mode, target, summary: counts(plan) };
      if (marker) return { ...result, outcome: "alreadyApplied", verification: await verifyPresentation(db, plan) };
      if (mode !== "apply") return { ...result, outcome: "ready", inserts: Object.fromEntries(Object.entries(plan.rows).map(([t, rows]) => [t, rows.length])) };
      await insertPresentation(db, plan);
      const verification = await verifyPresentation(db, plan, true);
      await db.query("INSERT INTO public.demo_data_runs(version,input_fingerprint,operator_ref,result) VALUES($1,$2,$3,$4)",
        [presentationVersion, fingerprint(presentationDefinition), env.DEMO_OPERATOR_REF!.trim(), JSON.stringify({ anchor, tenants, ownership: graph })]);
      return { ...result, outcome: "applied", verification };
    });
  } finally { await pool.end(); }
}

if (require.main === module) seedPresentation().then(r => console.log(JSON.stringify(r)))
  .catch(error => {
    if (error instanceof PresentationError) console.error(JSON.stringify({ operation: presentationVersion, outcome: "error", category: error.category, diagnostic: error.diagnostic }));
    else reportError(presentationVersion, error);
    process.exitCode = 1;
  });
