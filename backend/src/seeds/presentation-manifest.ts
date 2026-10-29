import { createHash } from "node:crypto";
import type { Question } from "../quizzes/quiz-validation";

export const presentationVersion = "academix-presentation-v1";
export const demoRoles = ["superadmin", "admin", "teacher", "assistant", "student"] as const;
export type DemoRole = typeof demoRoles[number];
export interface DemoTenant {
  slug: string; id: string;
  accounts: Record<DemoRole, { id: string; membershipId: string }>;
}
export const presentationDefinition = {
  version: presentationVersion, term: "DEMO-2026-2",
  tenants: [
    { slug: "uc", students: 8, courses: ["Desarrollo de Software", "Programación y Algoritmos", "Fundamentos de Datos"],
      topics: ["Diseño de contratos", "Aislamiento institucional", "Pruebas de integración"] },
    { slug: "utfsm", students: 6, courses: ["Sistemas Distribuidos", "Estructuras de Datos", "Redes de Computadores"],
      topics: ["Comunicación entre procesos", "Consistencia de réplicas", "Tolerancia a fallos"] },
  ],
};

/** A dedicated namespace, unrelated to legacy bootstrap identifiers. */
export function presentationId(key: string) {
  const h = createHash("sha256").update(`${presentationVersion}:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
export type Row = Record<string, unknown> & { id: string };
export const presentationTables = ["users", "institution_memberships", "courses", "sections", "enrollments",
  "course_modules", "materials", "quizzes", "grade_items", "quiz_attempts", "grades", "grade_publications", "audit_events"] as const;
export type DemoTable = typeof presentationTables[number];
export interface DemoPlan { rows: Record<DemoTable, Row[]>; tenants: DemoTenant[]; anchor: string }

export function presentationPlan(tenants: DemoTenant[], anchor: string): DemoPlan {
  const rows = Object.fromEntries(presentationTables.map(t => [t, []])) as unknown as DemoPlan["rows"];
  const add = (table: DemoTable, key: string, fields: Record<string, unknown>) => {
    const row = { id: presentationId(key), ...fields }; rows[table].push(row); return row.id;
  };
  const offset = (days: number) => new Date(Date.parse(anchor) + days * 86400000).toISOString();
  for (const tenant of tenants) {
    const def = presentationDefinition.tenants.find(t => t.slug === tenant.slug)!;
    const { slug, id: institution_id, accounts: a } = tenant;
    const studentIds = Array.from({ length: def.students }, (_, i) => {
      const id = add("users", `${slug}/student/${i}`, { email: `demo.seed.${slug}.${i + 1}@academix.example`,
        name: `Estudiante ficticio ${slug.toUpperCase()} ${String(i + 1).padStart(2, "0")}`, active: true, created_at: offset(-31), updated_at: offset(-31) });
      add("institution_memberships", `${slug}/member/${i}`, { institution_id, user_id: id, active: true, is_admin: false, is_super_admin: false, created_at: offset(-30), updated_at: offset(-30) });
      return id;
    });
    for (const [courseIndex, courseName] of def.courses.entries()) {
      const base = `${slug}/course/${courseIndex}`;
      const course_id = add("courses", base, { institution_id, code: `DEMO-${slug.toUpperCase()}-${courseIndex + 1}01`,
        name: `${courseName} · Demostración`, term: presentationDefinition.term, created_by: a.admin.id, created_at: offset(-25) });
      const sections: string[] = [];
      for (let s = 0; s < (courseIndex === 0 ? 2 : 1); s++) {
        const section_id = add("sections", `${base}/section/${s}`, { institution_id, course_id, code: String(s + 1), capacity: s === 0 ? 30 : 12, created_at: offset(-24) });
        sections.push(section_id);
        const enroll = (user_id: string, role: string, active = true) => add("enrollments", `${base}/section/${s}/${user_id}/${role}/${active}`, { institution_id, section_id, user_id, role, active, created_at: offset(-20) });
        // Admin owning a course has a teacher enrollment, as CoursesService.create does.
        enroll(a.admin.id, "teacher");
        if (s === 0) {
          enroll(a.teacher.id, "teacher"); enroll(a.assistant.id, "assistant"); enroll(a.student.id, "student");
        }
        const roster = courseIndex === 0 ? (s === 0 ? studentIds.slice(0, -2) : studentIds.slice(-2))
          : courseIndex === 1 ? studentIds.slice(0, 3) : [];
        for (const user of roster) enroll(user, "student");
        if (courseIndex === 1) enroll(studentIds.at(-1)!, "student", false);
      }
      for (let m = 0; m < 3; m++) {
        const module_id = add("course_modules", `${base}/module/${m}`, { institution_id, course_id,
          title: `${m + 1}. ${def.topics[m]}`, position: m + 1, published_at: m === 2 ? null : anchor });
        for (let r = 0; r < 2; r++) add("materials", `${base}/module/${m}/material/${r}`, {
          institution_id, module_id, title: `${r === 0 ? "Apuntes" : "Ejercicios"}: ${def.topics[m]}`,
          kind: "markdown", created_by: a.teacher.id, published_at: r === 0 ? anchor : null,
          markdown_body: `# ${def.topics[m]}\n\nMaterial ficticio de demostración de ${slug.toUpperCase()}, sin carácter oficial.\n\n` +
            `## Objetivo\nRelacionar ${def.topics[m].toLowerCase()} con ${courseName.toLowerCase()}.\n\n` +
            (r === 0 ? "1. Identifica el problema y sus restricciones.\n2. Propón una solución y explica sus límites.\n3. Verifica el resultado con un ejemplo."
              : "## Caso práctico\nCompara dos soluciones. Escribe sus supuestos y diseña una prueba que detecte un error.\n\nEste borrador está preparado para publicarse durante la presentación."),
        });
      }
      if (courseIndex === 2) continue; // A real empty evaluation/gradebook state.
      const labels = courseIndex === 0 ? ["Control publicado", "Control por publicar notas", "Práctica abierta", "Control futuro", "Control cerrado"]
        : ["Práctica de publicación", "Quiz en borrador"];
      for (const [q, title] of labels.entries()) {
        const draft = courseIndex === 1 && q === 1;
        const questions: Question[] = [
          { id: presentationId(`${base}/quiz/${q}/question/0`), position: 1, points: 6,
            prompt: slug === "uc" ? "¿Qué permite comprobar un contrato de API?" : "¿Para qué se replica información en un sistema distribuido?",
            alternatives: [{ id: "a", text: slug === "uc" ? "Las entradas y salidas acordadas" : "Para mejorar disponibilidad", isCorrect: true },
              { id: "b", text: "Para eliminar todas las validaciones", isCorrect: false }] },
          { id: presentationId(`${base}/quiz/${q}/question/1`), position: 2, points: 4,
            prompt: "¿Qué debe verificar una prueba de aislamiento institucional?",
            alternatives: [{ id: "a", text: "Que una cuenta no acceda a recursos de otra institución", isCorrect: true },
              { id: "b", text: "Que todos los usuarios compartan todos los recursos", isCorrect: false }] },
        ];
        const quiz_id = add("quizzes", `${base}/quiz/${q}`, { institution_id, course_id, section_id: sections[0],
          title: `${title} · ${slug.toUpperCase()}`, instructions: "Evaluación ficticia. Selecciona una alternativa por pregunta. Las notas se publican por separado.",
          opens_at: q === 3 ? offset(365) : q === 4 ? offset(-14) : null,
          closes_at: q === 3 ? offset(372) : q === 4 ? offset(-7) : null,
          max_attempts: 3, published_at: draft ? null : offset(-15), created_by: a.teacher.id, questions });
        if (draft) continue;
        const grade_item_id = add("grade_items", `${base}/item/${q}`, { institution_id, course_id, quiz_id,
          title: `${title} · ${slug.toUpperCase()}`, weight_percent: courseIndex === 0 ? [30, 30, 20, 10, 10][q] : 100, created_at: offset(-15) });
        const roster = [a.student.id, ...studentIds.slice(0, -2)];
        if (courseIndex === 0 && q < 2) for (const [i, student_id] of roster.entries()) {
          add("quiz_attempts", `${base}/quiz/${q}/${student_id}/graded`, { institution_id, course_id, quiz_id, section_id: sections[0], student_id,
            attempt_number: 1, status: "graded", started_at: offset(-3), submitted_at: offset(-2), cancelled_at: null,
            answers: questions.map((p, k) => ({ questionId: p.id, alternativeId: (i + q) % 3 === 0 || (i + q) % 3 === k + 1 ? "a" : "b" })),
            start_key: `${presentationVersion}/${quiz_id}/${student_id}/start`, submit_key: `${presentationVersion}/${quiz_id}/${student_id}/submit` });
          add("grades", `${base}/quiz/${q}/${student_id}/grade`, { institution_id, grade_item_id, quiz_id, student_id,
            section_id: sections[0], attempt_id: presentationId(`${base}/quiz/${q}/${student_id}/graded`), published_at: null, created_at: offset(-2), updated_at: offset(-2) });
        }
        if (courseIndex === 0 && q === 2) {
          for (const [i, status] of ["in_progress", "cancelled"].entries()) add("quiz_attempts", `${base}/quiz/${q}/${status}`, {
            institution_id, course_id, quiz_id, section_id: sections[0], student_id: studentIds[i], attempt_number: 1, status,
            started_at: anchor, submitted_at: null, cancelled_at: status === "cancelled" ? anchor : null,
            answers: [], start_key: `${presentationVersion}/${quiz_id}/${status}`, submit_key: null });
        }
      }
    }
  }
  return { rows, tenants, anchor };
}
