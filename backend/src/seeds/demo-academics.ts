import type { Client } from "pg";
import { OperationError } from "../database/config";
import { fingerprint } from "../data-migrations/operation";
import { academicDemoManifest, academicDemoVersion } from "./demo-academic-manifest";

export function academicSeedConfig(env: NodeJS.ProcessEnv): { operatorRef: string } | undefined {
  const enabled = env.DEMO_ACADEMIC_DATA_ENABLED ?? "false";
  if (!["true", "false"].includes(enabled)) throw new OperationError("config");
  if (enabled === "false") return undefined;
  const operatorRef = env.DEMO_OPERATOR_REF?.trim();
  if (!operatorRef || [...operatorRef].length > 200 || /[\u0000-\u001f\u007f]/.test(operatorRef)) throw new OperationError("config");
  return { operatorRef };
}

/** Runs inside the legacy seed transaction and lock; never called from HTTP/startup. */
export async function seedAcademics(db: Client, institutions: Map<string, string>, operatorRef: string) {
  const inputFingerprint = fingerprint(academicDemoManifest);
  const expected = academicDemoManifest.map(t => ({ ...t, institutionId: institutions.get(t.slug)! }));
  const marker = (await db.query("SELECT input_fingerprint,result FROM public.demo_data_runs WHERE version=$1", [academicDemoVersion])).rows[0];
  if (marker) {
    if (marker.input_fingerprint !== inputFingerprint || !Array.isArray(marker.result) || marker.result.length !== expected.length ||
      expected.some((t, index) => {
        const saved = marker.result[index];
        return !saved || typeof saved !== "object" || Object.keys(saved).length !== Object.keys(t).length ||
          Object.entries(t).some(([key, value]) => saved[key] !== value);
      })) throw new OperationError("conflict");
    for (const t of expected) {
      const found = await db.query(`SELECT c.id FROM public.courses c
        JOIN public.sections s ON s.institution_id=c.institution_id AND s.course_id=c.id
        JOIN public.enrollments teacher ON teacher.institution_id=s.institution_id AND teacher.section_id=s.id
        JOIN public.enrollments student ON student.institution_id=s.institution_id AND student.section_id=s.id
        WHERE c.id=$1 AND c.institution_id=$2 AND c.created_by=$3 AND s.id=$4
        AND teacher.id=$5 AND teacher.user_id=$3 AND teacher.role='teacher'
        AND student.id=$6 AND student.user_id=$7 AND student.role='student'`,
      [t.courseId, t.institutionId, t.teacherId, t.sectionId, t.teacherEnrollmentId, t.studentEnrollmentId, t.studentId]);
      if (found.rowCount !== 1) throw new OperationError("conflict");
    }
    return { operation: academicDemoVersion, outcome: "alreadyApplied" };
  }

  // Preserve normal lock order and refuse inactive identities or memberships on first application.
  const ids = [...new Set(expected.flatMap(t => [t.teacherId, t.studentId]))].sort((left, right) => left.localeCompare(right));
  const users = (await db.query("SELECT id,active FROM public.users WHERE id=ANY($1::uuid[]) ORDER BY id FOR SHARE", [ids])).rows;
  const tenants = (await db.query("SELECT id,active FROM public.institutions WHERE id=ANY($1::uuid[]) ORDER BY id FOR SHARE", [expected.map(t => t.institutionId)])).rows;
  const memberships = (await db.query(`SELECT institution_id,user_id,active FROM public.institution_memberships
    WHERE institution_id=ANY($1::uuid[]) AND user_id=ANY($2::uuid[]) ORDER BY id FOR SHARE`, [expected.map(t => t.institutionId), ids])).rows;
  if (users.length !== ids.length || users.some(u => !u.active) || tenants.length !== expected.length || tenants.some(t => !t.active) ||
    expected.some(t => [t.teacherId, t.studentId].some(id => !memberships.some(m => m.institution_id === t.institutionId && m.user_id === id && m.active)))) {
    throw new OperationError("conflict");
  }

  for (const t of expected) {
    const collision = await db.query("SELECT id FROM public.courses WHERE id=$1 OR (institution_id=$2 AND code=$3 AND term=$4)", [t.courseId, t.institutionId, t.code, t.term]);
    if (collision.rowCount) throw new OperationError("conflict");
    await db.query("INSERT INTO public.courses(id,institution_id,code,name,term,created_by) VALUES($1,$2,$3,$4,$5,$6)", [t.courseId, t.institutionId, t.code, t.name, t.term, t.teacherId]);
    await db.query("INSERT INTO public.sections(id,institution_id,course_id,code,capacity) VALUES($1,$2,$3,$4,$5)", [t.sectionId, t.institutionId, t.courseId, t.sectionCode, t.capacity]);
    const enrollments = [
      { id: t.teacherEnrollmentId, userId: t.teacherId, role: t.teacherRole },
      { id: t.studentEnrollmentId, userId: t.studentId, role: t.studentRole },
    ];
    for (const e of enrollments) await db.query("INSERT INTO public.enrollments(id,institution_id,section_id,user_id,role,active) VALUES($1,$2,$3,$4,$5,$6)", [e.id, t.institutionId, t.sectionId, e.userId, e.role, t.enrollmentActive]);
  }
  // The operational ledger records the operator and complete initial ownership graph.
  // Do not impersonate a teacher or relax audit actor constraints for a database seed.
  await db.query("INSERT INTO public.demo_data_runs(version,input_fingerprint,operator_ref,result) VALUES($1,$2,$3,$4)", [academicDemoVersion, inputFingerprint, operatorRef, JSON.stringify(expected)]);
  return { operation: academicDemoVersion, outcome: "applied" };
}
