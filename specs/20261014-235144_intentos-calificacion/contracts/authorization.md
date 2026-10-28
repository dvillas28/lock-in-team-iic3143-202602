# Autorización, ventana y seguridad

AuthGuard verifica identidad; cada operación vuelve a consultar User, Institution,
membership y roles vigentes. No confiar en rol, studentId o institución del body.

| Actor vigente | GET | Iniciar/guardar/enviar | Cancelar |
| --- | --- | --- | --- |
| Student propietario sin acceso a pauta | Vista propia | Sí, con reglas de operación | Sí |
| Student ajeno | No | No | No |
| Teacher activo de sección histórica | Vista docente | No por ese rol | Sí |
| Teacher activo + admin dueño | Vista docente todo curso | No por ese rol | Todo curso |
| Assistant de sección histórica | Vista seguimiento sin corrección | No | No |
| Admin/superadmin sin rol académico | No | No | No |
| Contexto revocado | No | No | No |

Inicio exige student en sectionId de ruta, quiz publicado aplicable y acceso a
pauta ausente. Guardar/enviar/cancelar propio exige student activo en alguna
sección del curso histórico y ausencia de acceso a pauta del quiz; mover sección
no reescribe attempt.section_id ni concede al teacher nuevo la sección anterior.
Teacher cancelando puede cerrar intento aunque estudiante esté revocado.
Flags institucionales no sustituyen teacher. Teacher ordinario solo su sección;
admin dueño requiere teacher activo de alguna sección para ampliar alcance.
Usar predicado único de pauta entregado por autoría; teacher+student que accede a
pauta no puede rendir. Assistant+student puede rendir si no adquiere esa capacidad.
En GET, propietario elegible recibe vista student incluso con assistant acumulado;
otro lector académico recibe proyección según teacher/assistant autorizado.

## Ventana ratificada

Usar clock_timestamp() después de locks. Inicio/PUT/primer submit admitidos si
(opens_at IS NULL OR opens_at <= ahora) AND
(closes_at IS NULL OR ahora < closes_at). Fuera: 409, sin cambios ni cancelación.
No cancelar al cierre; intento activo sigue bloqueando publicación hasta cierre
explícito. GET y cancel no dependen de ventana. Replay confirmado no es nuevo envío.

## DTO y revocación

Student: solo campos QuizAttemptStudentView y answers questionId/alternativeId.
Nunca score/grade/isCorrect/pointsAwarded ni claves, incluso tras graded; resultados
publicados se consultarán por endpoint de notas. Submit devuelve solo recibo.
Teacher: QuizAttemptAcademicView con corrección solo graded, dentro de su scope.
Assistant: mismo contexto/status/answers elegidas y scorePercent/grade agregados
si graded; sin isCorrect, pointsAwarded, alternativas correctas ni pauta.
Los resultados agregados son seguimiento autorizado, no vista student.
GET declara anyOf: teacher/assistant pueden tener igual forma sin corrección;
la elección de DTO depende de permisos, nunca del número de ramas que validan.

No cargar filas ajenas para filtrar luego. SELECT acotado a tenant y permisos,
DTO allowlist; ninguna serialización de fila SQL completa. Cache-Control:no-store
en éxito/error; errores Problem genéricos, sin respuestas, SQL ni pauta.
Recursos/tenants invisibles → 404; acción prohibida sobre visible → 403;
identidad inválida/inactiva → 401. Membership revocada deja tenant invisible.
Comprobar visibilidad antes de distinguir estado terminal para no filtrar existencia.
Inicio aplica visibilidad de autoría: borrador invisible y quiz ajeno devuelven 404.

POST/PUT revalidan bajo protocolo de locks del modelo. Operaciones posteriores al
COMMIT de revocación se deniegan con el mismo JWT; carreras definen un orden válido.
No devolver éxito antes de COMMIT. No guardar request completo, Authorization,
claves idempotentes ni contenido de preguntas/respuestas en logs o auditoría.
