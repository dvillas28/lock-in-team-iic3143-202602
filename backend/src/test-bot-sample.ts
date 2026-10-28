/**
 * ARCHIVO DE PRUEBA TEMPORAL
 * 
 * Este archivo fue creado exclusivamente para probar el comportamiento de AcademiX PR Reviewer.
 * Contiene intencionalmente patrones que deberían ser detectados por el bot:
 * 1. Recibir 'institution_id' en el body (debe resolverse del path).
 * 2. Consulta a base de datos sin filtrar por institución.
 * 3. Publicación de notas sin registrar un AuditEvent inmutable.
 * 4. Ausencia de pruebas unitarias asociadas.
 */

export interface CreateCourseDto {
  name: string;
  code: string;
  // Observación esperada: El cliente no debe enviar institution_id en el body
  institution_id: string;
}

export class SampleCourseService {
  /**
   * Consulta vulnerable: No filtra por scope institucional
   */
  async findCoursesUnscoped() {
    // Observación esperada: Query sin filtro de tenant
    return await database.query('SELECT * FROM courses');
  }

  /**
   * Publica notas sin registrar AuditEvent
   */
  async publishGrades(courseId: string, sectionId: string) {
    // Observación esperada: Debe emitir un AuditEvent en la misma transacción
    await database.query(
      'UPDATE grades SET status = $1 WHERE section_id = $2',
      ['published', sectionId]
    );
  }
}

// Mock simple de base de datos para tipado
const database = {
  query: async (sql: string, params?: any[]) => []
};

