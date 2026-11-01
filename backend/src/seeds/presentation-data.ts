import { randomBytes } from "node:crypto";
import { hash, argon2id } from "argon2";
import type { PoolClient } from "pg";
import { calculateGrade } from "../attempts/grading";
import { publicationInput } from "../gradebook/gradebook-validation";
import { presentationId, presentationVersion, presentationTables, type DemoPlan, type DemoTable, type Row } from "./presentation-manifest";

/** Use the application's SQL grading formula, including its rounding and answer projection. */
export async function completePresentationPlan(db: PoolClient, plan: DemoPlan) {
  for (const attempt of plan.rows.quiz_attempts) {
    if (attempt.status !== "graded") continue;
    const quiz = plan.rows.quizzes.find(q => q.id === attempt.quiz_id)!;
    const result = await calculateGrade(db, quiz.questions as Parameters<typeof calculateGrade>[1], attempt.answers as Parameters<typeof calculateGrade>[2]);
    Object.assign(attempt, { answers: result.answers, score_points: Number(result.score), score_percent: Number(result.percent), grade_value: Number(result.grade) });
    const grade = plan.rows.grades.find(g => g.attempt_id === attempt.id)!;
    Object.assign(grade, { score_percent: Number(result.percent), grade_value: Number(result.grade) });
  }
  for (const t of plan.tenants) {
    const quiz = presentationId(`${t.slug}/course/0/quiz/0`);
    const grades = plan.rows.grades.filter(g => g.quiz_id === quiz);
    for (const g of grades) { g.published_at = plan.anchor; g.updated_at = plan.anchor; }
    plan.rows.grade_publications.push({ id: presentationId(`${t.slug}/publication`), institution_id: t.id,
      course_id: presentationId(`${t.slug}/course/0`), actor_user_id: t.accounts.teacher.id,
      idempotency_key: `${presentationVersion}/${t.slug}/publication`,
      request: publicationInput({ gradeItemIds: [grades[0].grade_item_id], sectionIds: [grades[0].section_id], studentIds: grades.map(g => g.student_id) }),
      published_count: grades.length, published_at: plan.anchor });
  }
  return plan;
}

const jsonColumns = new Set(["questions", "answers", "request", "changes"]);
export async function insertPresentation(db: PoolClient, plan: DemoPlan) {
  for (const table of presentationTables) for (const source of plan.rows[table]) {
    const row = { ...source };
    if (table === "users") {
      // A fresh, discarded 256-byte preimage exceeds AuthService's 128-byte input cap.
      // Active fictional students remain visible in directories, but cannot log in.
      row.password_hash = await hash(randomBytes(256), { type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
    }
    const columns = Object.keys(row);
    await db.query(`INSERT INTO public.${table} (${columns.join(",")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(",")})`,
      columns.map(c => jsonColumns.has(c) ? JSON.stringify(row[c]) : row[c]));
  }
}

// Immutable ownership only: replay must never restore edited content, grades or revoked access.
const identity: Record<DemoTable, string[]> = {
  users: ["email"], institution_memberships: ["institution_id", "user_id"],
  courses: ["institution_id", "created_by"], sections: ["institution_id", "course_id"],
  enrollments: ["institution_id", "section_id", "user_id", "role"],
  course_modules: ["institution_id", "course_id"], materials: ["institution_id", "module_id", "created_by"],
  quizzes: ["institution_id", "course_id", "section_id", "created_by"], grade_items: ["institution_id", "course_id", "quiz_id"],
  quiz_attempts: ["institution_id", "course_id", "quiz_id", "section_id", "student_id", "attempt_number"],
  grades: ["institution_id", "grade_item_id", "quiz_id", "student_id"],
  grade_publications: ["institution_id", "course_id", "actor_user_id", "idempotency_key"], audit_events: ["institution_id", "course_id"],
};
export function ownership(plan: DemoPlan) {
  return Object.fromEntries(presentationTables.map(table => [table, plan.rows[table].map(row =>
    Object.fromEntries(["id", ...identity[table]].map(key => [key, row[key]])))]));
}

export function counts(plan: DemoPlan) {
  return plan.tenants.map(t => ({ slug: t.slug, institutionId: t.id, existingAccounts: 5,
    ...Object.fromEntries(presentationTables.map(table => [table, plan.rows[table].filter(r => table === "users"
      ? plan.rows.institution_memberships.some(m => m.institution_id === t.id && m.user_id === r.id) : r.institution_id === t.id).length])) }));
}

export function sameValue(a: unknown, b: unknown): boolean {
  if (a instanceof Date) return a.toISOString() === b;
  if (typeof b === "number" && typeof a === "string") return Number(a) === b;
  if (a && b && typeof a === "object" && typeof b === "object") {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const x = a as Record<string, unknown>, y = b as Record<string, unknown>;
    return Object.keys(x).length === Object.keys(y).length && Object.keys(y).every(k => sameValue(x[k], y[k]));
  }
  return a === b;
}
export function owns(table: DemoTable, actual: Row, expected: Row) {
  return identity[table].every(key => sameValue(actual[key], expected[key]));
}
