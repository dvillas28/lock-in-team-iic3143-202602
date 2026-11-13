import { ConflictException } from "@nestjs/common";
import type { PoolClient, QueryResultRow } from "pg";

/**
 * Capacity counts student seats: only active student enrollments consume them, so teachers and
 * assistants never fill a section. Callers hold the course lock taken by `sectionScope(..., true)`,
 * which serializes every enrollment and capacity write of the course (concurrent requests included).
 */
export async function activeStudents(db: PoolClient, institutionId: string, sectionId: string) {
  return (await db.query("SELECT count(*)::int AS n FROM public.enrollments WHERE institution_id=$1 AND section_id=$2 AND role='student' AND active",
    [institutionId, sectionId])).rows[0].n as number;
}

/** A new active student enrollment needs a free seat; null capacity is unlimited. */
export async function requireStudentSeat(db: PoolClient, institutionId: string, section: QueryResultRow) {
  if (section.capacity === null) return;
  if (await activeStudents(db, institutionId, section.id) >= section.capacity) throw new ConflictException({ code: "SECTION_FULL" });
}
