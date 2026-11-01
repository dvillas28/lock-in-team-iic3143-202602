import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { PoolClient } from "pg";
import { OperationError } from "../database/config";
import { demoRoles, presentationDefinition, presentationTables, type DemoTenant, type DemoPlan } from "./presentation-manifest";
import { owns, sameValue } from "./presentation-data";

export class PresentationError extends OperationError {
  constructor(category: OperationError["category"], public readonly diagnostic: string) { super(category); }
}
export async function checkPresentationSchema(db: PoolClient) {
  const operator = (await db.query(`SELECT current_user<>'academix_runtime' AND
    (r.rolsuper OR EXISTS(SELECT FROM pg_policies p WHERE p.schemaname='public' AND p.tablename='courses'
    AND p.policyname='operator_maintenance' AND current_user=ANY(p.roles))) AS allowed FROM pg_roles r WHERE rolname=current_user`)).rows[0];
  if (!operator?.allowed) throw new PresentationError("config", "migration_operator_required");
  const files = await readdir(resolve(__dirname, "../../migrations")).catch(() => {
    throw new PresentationError("schema", "migration_files_missing_or_unreadable");
  });
  const names = files.filter(f => f.endsWith(".sql")).map(f => f.slice(0, -4));
  if (!names.length) throw new PresentationError("schema", "migration_files_missing_or_unreadable");
  const applied = (await db.query("SELECT name FROM public.pgmigrations")).rows.map(r => r.name);
  if (names.some(n => !applied.includes(n))) throw new PresentationError("schema", "pending_migrations");
}

export async function readPresentationAccounts(db: PoolClient, lock: boolean): Promise<DemoTenant[]> {
  const emails = presentationDefinition.tenants.flatMap(t => demoRoles.map(r => `${r}.${t.slug}@academix.example`));
  const users = (await db.query(`SELECT id,lower(btrim(email)) AS email,active FROM public.users
    WHERE lower(btrim(email))=ANY($1::text[]) ORDER BY id${lock ? " FOR SHARE" : ""}`, [emails])).rows;
  const institutions = (await db.query(`SELECT id,slug,active FROM public.institutions WHERE slug=ANY($1::text[])
    ORDER BY id${lock ? " FOR SHARE" : ""}`, [presentationDefinition.tenants.map(t => t.slug)])).rows;
  const memberships = (await db.query(`SELECT id,institution_id,user_id,active,is_admin,is_super_admin FROM public.institution_memberships
    WHERE institution_id=ANY($1::uuid[]) AND user_id=ANY($2::uuid[]) ORDER BY id${lock ? " FOR SHARE" : ""}`, [institutions.map(t => t.id), users.map(u => u.id)])).rows;
  return presentationDefinition.tenants.map(def => {
    const institution = institutions.find(t => t.slug === def.slug);
    if (!institution?.active) throw new PresentationError("conflict", `${def.slug}:institution_missing_or_inactive`);
    const accounts = Object.fromEntries(demoRoles.map(role => {
      const found = users.filter(u => u.email === `${role}.${def.slug}@academix.example`);
      if (found.length !== 1 || !found[0].active) throw new PresentationError("conflict", `${def.slug}:${role}:account_missing_or_inactive`);
      const member = memberships.find(m => m.institution_id === institution.id && m.user_id === found[0].id);
      if (!member?.active) throw new PresentationError("conflict", `${def.slug}:${role}:membership_missing_or_inactive`);
      if ((role === "admin" && !member.is_admin) || (role === "superadmin" && !member.is_super_admin)) {
        throw new PresentationError("conflict", `${def.slug}:${role}:required_permission_missing`);
      }
      return [role, { id: found[0].id, membershipId: member.id }];
    })) as DemoTenant["accounts"];
    return { slug: def.slug, id: institution.id, accounts };
  });
}

export async function rejectPresentationCollisions(db: PoolClient, plan: DemoPlan) {
  for (const table of presentationTables) {
    if ((await db.query(`SELECT id FROM public.${table} WHERE id=ANY($1::uuid[]) LIMIT 1`, [plan.rows[table].map(r => r.id)])).rowCount) {
      throw new PresentationError("conflict", `unowned_identifier:${table}`);
    }
  }
  if ((await db.query("SELECT id FROM public.users WHERE lower(btrim(email))=ANY($1::text[]) LIMIT 1", [plan.rows.users.map(u => u.email)])).rowCount) {
    throw new PresentationError("conflict", "unowned_fictional_email");
  }
  for (const course of plan.rows.courses) if ((await db.query("SELECT id FROM public.courses WHERE institution_id=$1 AND code=$2 AND term=$3", [course.institution_id, course.code, course.term])).rowCount) {
    throw new PresentationError("conflict", "unowned_course_code");
  }
}

export async function verifyPresentation(db: PoolClient, plan: DemoPlan, strict = false) {
  const changes: Record<string, number> = {};
  for (const table of presentationTables) {
    const actual = (await db.query(`SELECT * FROM public.${table} WHERE id=ANY($1::uuid[])`, [plan.rows[table].map(r => r.id)])).rows;
    if (actual.length !== plan.rows[table].length) throw new PresentationError("conflict", `managed_records_missing:${table}`);
    for (const expected of plan.rows[table]) {
      const row = actual.find(r => r.id === expected.id)!;
      if (!owns(table, row, expected)) throw new PresentationError("conflict", `managed_ownership_changed:${table}`);
      if (!Object.keys(expected).every(k => sameValue(row[k], expected[k]))) changes[table] = (changes[table] ?? 0) + 1;
    }
  }
  const invalid = (await db.query(`SELECT g.id FROM public.grades g JOIN public.quiz_attempts a ON a.id=g.attempt_id
    WHERE g.id=ANY($1::uuid[]) AND (a.status<>'graded' OR
    (g.institution_id,g.quiz_id,g.student_id,g.section_id,g.score_percent,g.grade_value) IS DISTINCT FROM
    (a.institution_id,a.quiz_id,a.student_id,a.section_id,a.score_percent,a.grade_value)) LIMIT 1`, [plan.rows.grades.map(g => g.id)])).rowCount;
  if (invalid) throw new PresentationError("conflict", "managed_grade_attempt_mismatch");
  if (strict && Object.keys(changes).length) throw new PresentationError("conflict", `initial_data_mismatch:${Object.keys(changes).join(",")}`);
  return { changedRecords: changes, note: "Edits and revocations are preserved; no records are repaired." };
}
