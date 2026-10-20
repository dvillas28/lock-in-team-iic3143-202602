import { ForbiddenException, NotFoundException, UnauthorizedException, ConflictException, UnprocessableEntityException, ServiceUnavailableException } from "@nestjs/common";
import type { Pool, PoolClient } from "pg";

export type Sql = Pool | PoolClient;
export interface Membership {id: string; institution_id: string; user_id: string; active: boolean; is_admin: boolean; is_super_admin: boolean}
export async function context(db: Sql, actor: string, slug: string) {
  const user = (await db.query("SELECT active FROM public.users WHERE id=$1", [actor])).rows[0];
  if (!user?.active) throw new UnauthorizedException();
  const row = (await db.query<Membership>(`SELECT m.* FROM public.institution_memberships m JOIN public.institutions i ON i.id=m.institution_id
    WHERE m.user_id=$1 AND i.slug=$2 AND m.active AND i.active`, [actor,slug])).rows[0];
  if (!row) throw new NotFoundException();
  return row;
}
export async function lockContext(db: PoolClient, actor: string, slug: string, targets: string[] = [], flags = false) {
  const users = [...new Set([actor,...targets])].sort((a,b)=>a.localeCompare(b));
  await db.query("SELECT id FROM public.users WHERE id=ANY($1::uuid[]) ORDER BY id FOR SHARE", [users]);
  await db.query("SELECT id FROM public.institutions WHERE slug=$1 FOR SHARE", [slug]);
  await db.query(`SELECT m.id FROM public.institution_memberships m JOIN public.institutions i ON i.id=m.institution_id
    WHERE i.slug=$1 AND m.user_id=ANY($2::uuid[]) ORDER BY m.id FOR ${flags ? "UPDATE" : "SHARE"} OF m`, [slug,users]);
  const member = await context(db,actor,slug);
  for (const target of targets) {
    const row = (await db.query(`SELECT m.id FROM public.institution_memberships m JOIN public.users u ON u.id=m.user_id
      WHERE m.institution_id=$1 AND m.user_id=$2 AND m.active AND u.active`, [member.institution_id,target])).rows[0];
    if (!row) throw new NotFoundException();
  }
  return member;
}
export async function courseScope(db: Sql, m: Membership, courseId: string, lock = false, lockedEnrollmentId?: string) {
  const row = (await db.query(`SELECT * FROM public.courses WHERE institution_id=$1 AND id=$2${lock ? " FOR UPDATE" : ""}`, [m.institution_id,courseId])).rows[0];
  if (!row) throw new NotFoundException();
  // A self-edit must take its final lock before locking authorizing enrollments.
  if (lock && lockedEnrollmentId) await db.query(`SELECT e.id FROM public.enrollments e
    JOIN public.sections s ON s.institution_id=e.institution_id AND s.id=e.section_id
    WHERE e.institution_id=$1 AND s.course_id=$2 AND e.id=$3 FOR UPDATE OF e`, [m.institution_id,courseId,lockedEnrollmentId]);
  const roles = (await db.query(`SELECT e.* FROM public.enrollments e JOIN public.sections s ON s.id=e.section_id AND s.institution_id=e.institution_id
    WHERE e.institution_id=$1 AND s.course_id=$2 AND e.user_id=$3 AND e.active${lock ? " ORDER BY e.id FOR SHARE OF e" : ""}`, [m.institution_id,courseId,m.user_id])).rows;
  const owner = m.is_admin && row.created_by===m.user_id;
  if (!owner && !roles.length) throw new NotFoundException();
  return {course:row,owner,roles};
}
export async function sectionScope(db: Sql, m: Membership, sectionId: string, lock = false, lockedEnrollmentId?: string) {
  let section = (await db.query("SELECT * FROM public.sections WHERE institution_id=$1 AND id=$2", [m.institution_id,sectionId])).rows[0];
  if (!section) throw new NotFoundException();
  const scope = await courseScope(db,m,section.course_id,lock,lockedEnrollmentId);
  // The course lock serializes writes; discard the section read before waiting for it.
  if (lock) section = (await db.query("SELECT * FROM public.sections WHERE institution_id=$1 AND id=$2", [m.institution_id,sectionId])).rows[0];
  const roles=scope.roles.filter(e=>e.section_id===sectionId);
  if (!scope.owner && !roles.length) throw new NotFoundException();
  return {...scope,section,roles};
}
export function requirePermission(allowed: boolean) {if (!allowed) throw new ForbiddenException();}
export async function transaction<T>(pool: Pool, operation: (client: PoolClient)=>Promise<T>) {
  const client=await pool.connect();
  try {
    await client.query("BEGIN"); const result=await operation(client); await client.query("COMMIT"); return result;
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>{});
    const code=(error as {code?:string}).code;
    if (code==="23505") throw new ConflictException();
    if (code==="23514" || code==="23503") throw new UnprocessableEntityException();
    if (code?.startsWith("08") || code==="57P01" || code==="ECONNREFUSED") throw new ServiceUnavailableException();
    throw error;
  } finally {client.release();}
}
