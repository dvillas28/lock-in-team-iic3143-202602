/** Display labels only; the API continues accepting contractual action/type strings. */
export const auditActions: Record<string, string> = {
  "course.created": "Curso creado",
  "course.updated": "Curso actualizado",
  "section.created": "Sección creada",
  "section.updated": "Sección actualizada",
  "enrollment.created": "Participante asignado",
  "enrollment.roleChanged": "Rol actualizado",
  "enrollment.activeChanged": "Matrícula actualizada",
  "module.created": "Módulo creado",
  "module.updated": "Módulo actualizado",
  "module.published": "Módulo publicado",
  "module.unpublished": "Módulo ocultado",
  "module.reordered": "Módulos reordenados",
  "academicFile.created": "Archivo agregado",
  "academicFile.renamed": "Archivo renombrado",
  "academicFile.replaced": "Archivo reemplazado",
  "academicFile.published": "Archivo publicado",
  "academicFile.unpublished": "Archivo ocultado",
  "academicFile.deleted": "Archivo eliminado",
  "module.resourcesReordered": "Recursos del módulo reordenados",
  "module.quizLinked": "Cuestionario enlazado al módulo",
  "module.quizUnlinked": "Enlace de cuestionario retirado",
  "material.created": "Material creado",
  "material.updated": "Material actualizado",
  "material.published": "Material publicado",
  "material.unpublished": "Material ocultado",
  "material.deleted": "Página eliminada",
  "quiz.created": "Quiz creado",
  "quiz.updated": "Quiz actualizado",
  "quiz.published": "Quiz publicado",
  "attempt.started": "Intento iniciado",
  "attempt.answersSaved": "Respuestas guardadas",
  "attempt.graded": "Intento calificado",
  "attempt.cancelled": "Intento cancelado",
  "grade.created": "Nota calculada",
  "grade.updated": "Nota recalculada",
  "assignment.submitted": "Tarea entregada",
  "grade.draftSaved": "Borrador de calificación guardado",
  "grade.corrected": "Nota corregida",
  "gradebook.groupsUpdated": "Grupos y ponderaciones actualizados",
  "grade.published": "Nota publicada",
  "gradebook.weightsUpdated": "Ponderaciones actualizadas",
};
export const auditResources: Record<string, string> = {
  course: "Curso",
  section: "Sección",
  enrollment: "Matrícula",
  courseModule: "Módulo",
  material: "Material",
  quiz: "Quiz",
  assignmentAttempt: "Entrega de tarea",
  quizAttempt: "Intento",
  grade: "Nota",
  gradebook: "Libro de notas",
  gradeItem: "Evaluación",
};

export type AuditTone = "primary" | "success" | "danger" | "warning" | "accent" | "neutral";
/** Groups contractual actions into a visual family; never used to authorize anything. */
export function auditFamily(action: string): { label: string; tone: AuditTone } {
  const verb = action.split(".").at(-1) ?? "";
  if (/^(grade|gradebook)\./.test(action) || verb === "graded") return { label: "Calificación", tone: "accent" };
  if (verb === "published") return { label: "Publicación", tone: "success" };
  if (verb === "deleted" || verb === "cancelled") return { label: verb === "deleted" ? "Eliminación" : "Cancelación", tone: "danger" };
  if (verb === "unpublished" || verb === "quizUnlinked") return { label: "Retiro", tone: "warning" };
  if (/^(created|submitted|started|quizLinked)$/.test(verb)) return { label: "Creación", tone: "primary" };
  return { label: "Edición", tone: "neutral" };
}
