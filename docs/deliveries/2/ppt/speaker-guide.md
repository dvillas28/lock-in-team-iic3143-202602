# Guía oral: E2 y respuesta al feedback

Revisión 2026-10-29. Tiempo objetivo: 10–15 minutos, no se acredita ensayo.
Los títulos de diapositivas guían el relato; no fijar números tras añadir E6.

## Apertura y alcance (2 minutos)

AcademiX: cursos → material markdown → quiz → nota → publicación → promedio.
PostgreSQL compartida, identidad global y pertenencia institucional.
La simplificación multi-tenant frente a E1 es antecedente, no cambio de este polish.
Corte 2026-10-29/7f4334a registra lo que existía al comenzar; no fecha de evaluación.

## Arquitectura y fallas (2 minutos)

C6 pide simplificar/justificar HAProxy. Blueprint actual: Render Next.js/NestJS y
PostgreSQL 17, sin HAProxy, HA ni PgBouncer externo. Pool pg del proceso existe.
Diferimos infraestructura hasta necesidad medida. Free tiene suspensión, cuota,
expiración y no acredita backup/PITR; no prometer disponibilidad continua.
No hubo despliegue ni verificación DNS/TLS en el polish. Capturas Railway son historia.

## Dominio y datos (3 minutos)

D6: ambos extremos llevan cardinalidad; catálogo/ER y UML comparten reglas.
Membership une User global e Institution; flags institucionales separados de role.
Curso se crea con sección/teacher inicial, sin mínimo permanente en SQL.
Quiz pertenece a Course, sección opcional. CourseModule organiza Material, no Quiz.
AuditEvent puede no tener curso/actor solo en operaciones institucionales acotadas.
GradeItem es columna del libro; Grade nota vigente; ledger de publicación privado.
E6 role: dominio teacher/student/assistant, varchar+CHECK rechaza cualquier otro
valor como un enum SQL; no migramos por apariencia.

## Administración y cuentas (3 minutos)

Recorrer seis actores: operador provisiona institución e identidad inicial;
superadmin institucional delega is_admin, admin crea cursos y administra propios;
teacher trabaja en secciones, assistant sigue sin escritura, student ve lo propio.
No existe superadmin global ni acceso académico general por flags.
UC/UTFSM: diez cuentas institucionales, solo superadmin con ambos flags iniciales.
Las etiquetas no conceden matrículas; seed académico legacy es operación separada.
Replay conserva identidad/hash, estados, datos y permisos revocados.
Altas generales/invitaciones en institución existente no soportadas: otra misión.
No presentar onboarding inicial como signup ni publicar secretos.

## Privacidad, riesgos y evidencia (2 minutos)

AUD-PRIV es hallazgo técnico propio, no comentario del profesor.
Regresión válida: revocar teacher antes de rendir, Grade no publicada y fuga por
historial. Fix SQL excluye grade sin docencia antes de paginar; owner conserva
administrativos, teacher conserva historia autorizada. Estudiante usa my-grades.
La evidencia registra pruebas realmente ejecutadas; no inferir despliegue.
F6/G6 valoran riesgos y semanas/backlog: conservar dueños y planificación.
No atribuir al polish implementación previa de roles, cursos, delegación o RLS.

## Preguntas previsibles

- ¿Quién crea más usuarios? Onboarding inicial controlado por operador; alta
  general en institución existente fuera del MVP, necesita especificación propia.
- ¿Quién administra todo el producto? Operador operativo; sin superadmin global HTTP.
- ¿HA sustituye backup? No; tampoco está desplegada por esta misión.
- ¿Qué cambió funcionalmente? Lectura de auditoría grade; resto documentación/validación.
- ¿Qué se comprobó? Consultar [evidencia local](../../../backend/feedback-e2-validation.md)
  y [privacidad](../../../backend/audit-grade-privacy-validation.md), con versión/alcance.
